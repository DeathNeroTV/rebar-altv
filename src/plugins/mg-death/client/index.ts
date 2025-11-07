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
            if (!victim || !victim.valid || !victim.isDead) return;
            alt.emitServer(DeathEvents.toServer.toggleRevive, victim);
            isReviving = true;
        },
        restrictions: { isOnFoot: true }
    }
];

const keyBindApi = await useClientApi().getAsync('keyBinds-api');
keyBinds.forEach(keyBind => keyBindApi.add(keyBind));

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

alt.onServer(DeathEvents.toClient.moveTo, async(target: alt.Player) => {
    if (!target || !target.valid) return;

    const chestPos = natives.getPedBoneCoords(target, 24816, 0, 0, 0);
    natives.taskGoStraightToCoord(alt.Player.local, chestPos.x, chestPos.y, chestPos.z, 1.0, -1, 0.0, 0.0);

    let attempts = 0;
    while (alt.Player.local.pos.distanceTo(chestPos) > 0.8 && attempts < 200) {
        attempts++;
        await alt.Utils.wait(1);
    }

    natives.taskTurnPedToFaceCoord(alt.Player.local, chestPos.x, chestPos.y, chestPos.z, 1000);
    alt.setTimeout(() => alt.emitServer(DeathEvents.toServer.toggleProgress, target), 1100);
});