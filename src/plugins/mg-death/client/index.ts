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
    while (!natives.hasAnimDictLoaded(dict) && attempts < 100) {
        await alt.Utils.wait(10);
        attempts++;
    }
}

async function playAnimation(player: alt.Player | alt.LocalPlayer, dict: string, name: string, flags: number = 1, blendInSpeed: number = 1.0, blendOutSpeed: number = -1.0, duration: number = -1, playbackRate: number = 1.0) {
    if (!player || !player.valid) return;

    await loadAnimDict(dict);

    natives.clearPedTasksImmediately(player);
    natives.taskPlayAnim(player, dict, name, blendInSpeed, blendOutSpeed, duration, flags, playbackRate, false, false, false);
}

function stopAnimation(player: alt.Player | alt.LocalPlayer) {
    if (!player || !player.valid) return;
    natives.clearPedTasksImmediately(player);
}

alt.onServer(DeathEvents.toClient.animation.play, async (animDict: string, animName: string, target: alt.Player | alt.LocalPlayer) => {
    if (!target || !target.valid) return;
    await playAnimation(target, animDict, animName, 1);
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