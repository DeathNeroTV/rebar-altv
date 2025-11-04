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
            if (!canRespawn || !alt.Player.local.isDead) return;
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
            if (calledEMS || !alt.Player.local.isDead) return;
            alt.emitServer(DeathEvents.toServer.callEms);
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
            if (isReviving || alt.Player.local.isDead) return;
            const closest = getClosestPlayer(3.0);
            if (closest && closest.isDead) {
                alt.emitServer(DeathEvents.toServer.reviveTarget, closest);
                isReviving = true;
            }
        },
        restrictions: { isOnFoot: true }
    }
];

alt.on('connectionComplete', async() => {
    const keyBindApi = await useClientApi().getAsync('keyBinds-api');
    keyBinds.forEach(keyBind => keyBindApi.add(keyBind));
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

function getClosestPlayer(radius: number): alt.Player | null {
    let closest: alt.Player | null = null;
    let minDist = radius;
    let players = [...alt.Player.all];
    for (const player of players) {
        if (!player.valid || player.id === alt.Player.local.id) continue;
        const dist = natives.getDistanceBetweenCoords(
            player.pos.x, player.pos.y, player.pos.z,
            alt.Player.local.pos.x, alt.Player.local.pos.y, alt.Player.local.pos.z,
            true
        );
        if (dist < minDist) {
            closest = player;
            minDist = dist;
        }
    }

    return closest;
}