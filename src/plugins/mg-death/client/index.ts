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
            const closest = alt.Utils.getClosestPlayer({ range: 3.0 });
            if (isReviving || alt.Player.local.isDead || !closest || !closest.valid || !closest.isDead) return;
            alt.emitServer(DeathEvents.toServer.reviveTarget, closest);
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

alt.onServer(DeathEvents.toClient.animation.play, async (player: alt.Player, animDict: string, animName: string, easeIn: number = 1.0, easeOut: number = 1.0, duration: number = -1, flags: number = 9, playBackRate: number = 1.0) => {
    if (!natives.hasAnimDictLoaded(animDict)) 
        natives.requestAnimDict(animDict);

    natives.taskPlayAnim(player, animDict, animName, easeIn, easeOut, duration, flags, playBackRate, false, false, false);
});

alt.onServer(DeathEvents.toClient.animation.stop, (player: alt.Player) => {
    natives.clearPedTasks(player);
});