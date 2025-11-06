import * as alt from 'alt-client';
import * as natives from 'natives';
import { useRebarClient } from '@Client/index.js';
import { DeathEvents } from '../shared/events.js';
import { useClientApi } from '@Client/api/index.js';

const Rebar = useRebarClient();
const view = Rebar.webview.useWebview();

let canRespawn = false;
let calledEMS = false;
let isReviving = false;

const keyBinds: KeyInfo[] = [
    {
        key: alt.KeyCode.E,
        description: 'Lasse dich vom Rettungsteam abholen',
        identifier: 'emergency-trigger',
        keyDown: () => {
            if (!canRespawn || isReviving || !alt.Player.local.isDead) return;
            alt.emitServer(DeathEvents.toServer.toggleRespawn);
            canRespawn = false;
            calledEMS = false;
        },
        allowIfDead: true,
        restrictions: { isOnFoot: true }
    },
    {
        key: alt.KeyCode.G,
        description: 'Setze einen Notruf ab',
        identifier: 'emergency-call',
        keyDown: () => {
            if (calledEMS || isReviving || !alt.Player.local.isDead) return;
            alt.emitServer(DeathEvents.toServer.toggleEms);
            calledEMS = true;
        },
        allowIfDead: true,
        restrictions: { isOnFoot: true }
    },
    {
        key: alt.KeyCode.H,
        description: 'Reanimiere einen anderen Spieler, der bewusstlos ist',
        identifier: 'emergency-revive',
        keyDown: () => {
            const victim = alt.Utils.getClosestPlayer({ range: 3.0 });
            if (!victim || !victim.valid) return;
            alt.emitServer(DeathEvents.toServer.toggleRevive, victim);
            isReviving = true;
        },
        restrictions: { isOnFoot: true }
    }
];

const keyBindApi = await useClientApi().getAsync('keyBinds-api');
keyBinds.forEach(keyBind => keyBindApi.add(keyBind));

async function loadAnimDict(dict: string): Promise<void> {
    if (natives.hasAnimDictLoaded(dict)) return;

    natives.requestAnimDict(dict);
    let attempts = 0;
    while (!natives.hasAnimDictLoaded(dict) && attempts < 200) {
        await alt.Utils.wait(1);
        attempts++;
    }
}

async function playAnimation(player: alt.Player | alt.LocalPlayer, dict: string, name: string, flags: number = 1, blendInSpeed: number = 1.0, blendOutSpeed: number = -1.0, duration: number = -1, playbackRate: number = 1.0) {
    if (!player || !player.valid) return;

    await loadAnimDict(dict);

    natives.clearPedTasksImmediately(player);
    natives.taskPlayAnim(player, dict, name, blendInSpeed, blendOutSpeed, duration, flags, playbackRate, false, false, false);
}

async function moveToAndPlayAnimation(player: alt.Player | alt.LocalPlayer, target: alt.Player, animDict: string, animName: string) {
    if (!target || !target.valid) return;

    // Brustkoordinaten des Zielspielers
    const chestPos = natives.getPedBoneCoords(target, 24816, 0, 0, 0);

    // Spieler läuft zum Brustkorb
    natives.taskGoStraightToCoord(player, chestPos.x, chestPos.y, chestPos.z, 1.2, -1, 0.0, 0.0);

    let attempts = 0;
    // Warten bis Spieler <= 1 Meter vom Brustkorb entfernt ist oder max. 200 Versuche
    while (player.pos.distanceTo(chestPos) > 1.0 && attempts < 200) {
        await alt.Utils.wait(1);
        attempts++;
    }

    natives.clearPedTasks(player);

    // Spieler auf das Ziel ausrichten
    const dx = chestPos.x - player.pos.x;
    const dy = chestPos.y - player.pos.y;
    const heading = Math.atan2(dy, dx) * (180 / Math.PI);
    natives.setEntityHeading(player, heading - 90);

    // Animation abspielen
    await playAnimation(player, animDict, animName);
}

function stopAnimation(player: alt.Player | alt.LocalPlayer) {
    if (!player || !player.valid) return;
    natives.clearPedTasksImmediately(player);
}

alt.onServer(DeathEvents.toClient.animation.play, async (animDict: string, animName: string, player: alt.Player | alt.LocalPlayer, target?: alt.Player) => {
    if (!player || !player.valid) return;

    if (target) await moveToAndPlayAnimation(player, target, animDict, animName);
    else await playAnimation(player, animDict, animName);
});

alt.onServer(DeathEvents.toClient.animation.stop, (target: alt.Player | alt.LocalPlayer) => {
    if (!target || !target.valid) return;
    stopAnimation(target);
});

alt.onServer(DeathEvents.toClient.reviveProgress, (progress: number) => {
    view.emit(DeathEvents.toClient.reviveProgress, progress);
});

alt.onServer(DeathEvents.toClient.startRevive, () => {    
    view.emit(DeathEvents.toClient.startRevive);
});

alt.onServer(DeathEvents.toClient.stopRevive, () => {
    view.emit(DeathEvents.toClient.stopRevive);
    if (isReviving) isReviving = false;
});

alt.onServer(DeathEvents.toClient.reviveComplete, () => {
    view.emit(DeathEvents.toClient.reviveComplete);
    if (isReviving) isReviving = false;
});

alt.onServer(DeathEvents.toClient.startTimer, (timeLeft: number) => {
    view.emit(DeathEvents.toClient.startTimer, timeLeft);
    if (canRespawn) canRespawn = false;
});

alt.onServer(DeathEvents.toClient.stopTimer, () => {
    view.emit(DeathEvents.toClient.stopTimer, 0);
    if (!canRespawn) canRespawn = true;
});