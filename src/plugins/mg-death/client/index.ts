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
var chestPos: alt.Vector3 | null;

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

    while (target.moveSpeed > 0.0) {
        chestPos = natives.getPedBoneCoords(target, 24816, 0, -1.0, 0);
        alt.Utils.wait(1);
    }

    // Falls noch keine Position gespeichert, hole sie jetzt
    if (!chestPos) chestPos = natives.getPedBoneCoords(target, 24816, 0, -1.0, 0);
    natives.taskGoStraightToCoord(alt.Player.local, chestPos.x, chestPos.y, chestPos.z, 1.0, -1, 0.0, 0.0);

    let attempts = 0;
    while (alt.Player.local.pos.distanceTo(chestPos) > 0.5 && attempts < 200) {
        attempts++;
        await alt.Utils.wait(1);
    }

    const playerPos = alt.Player.local.pos;
    const dx = chestPos.x - playerPos.x;
    const dy = chestPos.y - playerPos.y;
    const heading = Math.atan2(dy, dx) * (180 / Math.PI);
    natives.taskAchieveHeading(alt.Player.local, heading, 1000);

    await alt.Utils.wait(1200);
    alt.emitServer(DeathEvents.toServer.toggleProgress, target);
    chestPos = null;
});

alt.everyTick(() =>  {
    if (!chestPos) return;
    natives.drawMarker(20, chestPos.x, chestPos.y, chestPos.z, 0, 0, 0, 0, 0, 0, 0.5, 0.5, 0.5, 0, 135, 54, 255, true, true, 0, false, null, null, false);
});