import * as alt from 'alt-client';
import * as natives from 'natives';

import { useRebarClient } from '@Client/index.js';
import { useClientApi } from '@Client/api/index.js';

import { DeathEvents } from '../shared/events.js';

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
            if (!canRespawn || isReviving) return;
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
            if (calledEMS || isReviving) return;
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
        keyDown: async () => {
            if (isReviving) return;
            
            const victim = alt.Utils.getClosestPlayer({ range: 3.0 });
            if (!victim || !victim.valid) return;
            isReviving = true;

            const playerPos = alt.Player.local.pos;
            const victimPos = victim.pos;
            const victimHeading = natives.getEntityHeading(victim);
            const dx = playerPos.x - victimPos.x;
            const dy = playerPos.y - victimPos.y;
            const angleToPlayer = Math.atan2(dy, dx) * (180 / Math.PI);
            let relativeAngle = (angleToPlayer - victimHeading + 360) % 360;
            const isRightSide = relativeAngle > 0 && relativeAngle < 180;
            const offsetX = isRightSide ? 0.5 : -0.5;
            
            natives.taskGoStraightToCoordRelativeToEntity(alt.Player.local, victim, offsetX, 0.01, 0.0, 1.2, 5000);
            await alt.Utils.wait(5100);

            const chestPos = natives.getPedBoneCoords(victim, 24816, 0, 0, 0);
            const dx2 = chestPos.x - alt.Player.local.pos.x;
            const dy2 = chestPos.y - alt.Player.local.pos.y;
            const headingToChest = Math.atan2(dy2, dx2) * (180 / Math.PI);
            natives.setEntityHeading(alt.Player.local, headingToChest);
            natives.taskLookAtEntity(alt.Player.local, victim, -1, 2048, 3);
            alt.emitServer(DeathEvents.toServer.toggleRevive, victim);
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
    isReviving = true;
});

alt.onServer(DeathEvents.toClient.stopRevive, () => {
    view.emit(DeathEvents.toClient.stopRevive);
    isReviving = false;
});

alt.onServer(DeathEvents.toClient.reviveComplete, () => {
    view.emit(DeathEvents.toClient.reviveComplete);
    isReviving = false;
});

alt.onServer(DeathEvents.toClient.startTimer, (timeLeft: number) => {
    view.emit(DeathEvents.toClient.startTimer, timeLeft);
    if (canRespawn) canRespawn = false;
});

alt.onServer(DeathEvents.toClient.stopTimer, () => {
    view.emit(DeathEvents.toClient.stopTimer, 0);
    if (!canRespawn) canRespawn = true;
});