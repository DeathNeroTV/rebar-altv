import * as alt from 'alt-client';
import * as natives from 'natives';

import { useRebarClient } from '@Client/index.js';
import { useClientApi } from '@Client/api/index.js';

import { DeathEvents } from '../shared/events.js';
import { DeathConfig } from '../shared/config.js';

const Rebar = useRebarClient();
const view = Rebar.webview.useWebview();

type ClientState = { canRespawn: boolean; calledEMS: boolean; isReviving: boolean; isReviver: boolean };

const state: ClientState = { canRespawn: false, calledEMS: false, isReviving: false, isReviver: false };

function emitServerSafe(event: string, ...args: any[]) {
    if (!alt.Player.local || !alt.Player.local.valid) return;
    alt.emitServer(event, ...args);
}

async function registerKeybinds() {
    const keyBindApi = await useClientApi().getAsync('keyBinds-api');

    const binds: KeyInfo[] = [
        {
            key: alt.KeyCode.E,
            description: 'Lasse dich vom Rettungsteam abholen',
            identifier: 'emergency-trigger',
            keyDown: () => {
                if (!state.canRespawn || state.isReviving) return;
                emitServerSafe(DeathEvents.toServer.toggleRespawn);
                state.canRespawn = false;
            },
            allowIfDead: true,
            restrictions: { isOnFoot: true }
        },
        {
            key: alt.KeyCode.G,
            description: 'Setze einen Notruf ab',
            identifier: 'emergency-call',
            keyDown: () => {
                if (state.calledEMS || state.isReviving) return;
                emitServerSafe(DeathEvents.toServer.toggleEms);
                state.calledEMS = true;
            },
            allowIfDead: true,
            restrictions: { isOnFoot: true }
        },
        {
            key: alt.KeyCode.H,
            description: 'Reanimiere einen anderen Spieler, der bewusstlos ist',
            identifier: 'emergency-revive',
            keyDown: async () => {
                const player = alt.Player.local;
                const victim = alt.Utils.getClosestPlayer({ range: 3.0 });
                if (!victim || !victim.valid) return;

                // Zielposition leicht vor dem Opfer
                const chestPos = natives.getPedBoneCoords(victim, 24816, 0, 0, 0);
                const offsetDistance = 0.5; // Abstand vor dem Opfer

                const victimHeading = natives.getEntityHeading(victim) * (Math.PI / 180);
                const targetX = chestPos.x - Math.sin(victimHeading) * offsetDistance;
                const targetY = chestPos.y + Math.cos(victimHeading) * offsetDistance;

                let targetZ = chestPos.z;
                const [found, groundZ] = natives.getGroundZFor3dCoord(targetX, targetY, targetZ, targetZ, false, false);
                if (found) targetZ = groundZ;

                // Spieler zum Ziel bewegen, dabei Collision berücksichtigen
                natives.taskGoStraightToCoord(player, targetX, targetY, targetZ, 1.2, -1, 0.0, 0.0);

                // Warten, bis Spieler ungefähr am Ziel ist (max. 5 Sekunden)
                const startTime = Date.now();
                while (player.pos.distanceTo({ x: targetX, y: targetY, z: targetZ }) > 0.3 && Date.now() - startTime < 5000) {
                    await alt.Utils.wait(0);
                }

                // Spieler korrekt zum Opfer drehen
                const turnStart = Date.now();
                while (!natives.isPedFacingPed(player, victim, 10) && Date.now() - turnStart < 2000) {
                    natives.taskTurnPedToFaceCoord(player, chestPos.x, chestPos.y, chestPos.z, 1000);
                    await alt.Utils.wait(0);
                }

                emitServerSafe(DeathEvents.toServer.toggleRevive, victim);
            },

            restrictions: { isOnFoot: true }
        }
    ];

    binds.forEach(b => keyBindApi.add(b));
}

function registerListeners() {
    view.on(DeathEvents.toClient.reviveComplete, () => {
        emitServerSafe(DeathEvents.toServer.reviveComplete, state.isReviver);
        state.isReviving = false;
        state.isReviver = false;
    });

    alt.onServer(DeathEvents.toClient.startRevive, (isReviver: boolean) => {
        state.isReviving = true;
        state.isReviver = isReviver;
        view.emit(DeathEvents.toWebview.startRevive);
    });

    alt.onServer(DeathEvents.toClient.stopRevive, () => {
        view.emit(DeathEvents.toWebview.stopRevive);
        state.isReviving = false;
        state.isReviver = false;
    });

    alt.onServer(DeathEvents.toClient.startTimer, (timeLeft: number) => {
        view.emit(DeathEvents.toWebview.startTimer, timeLeft);
        state.canRespawn = false;
    });

    alt.onServer(DeathEvents.toClient.stopTimer, () => {
        view.emit(DeathEvents.toWebview.stopTimer);
        state.canRespawn = true;
    });

    alt.onServer(DeathEvents.toClient.confirmEms, () => {
        view.emit(DeathEvents.toWebview.confirmEms);
        state.calledEMS = true;
    });

    alt.onServer(DeathEvents.toClient.respawned, () => {
        view.emit(DeathEvents.toWebview.respawned);
        state.calledEMS = false;
        state.canRespawn = false;
        state.isReviving = false;
        state.isReviver = false;
    });
}

async function init() {
    await registerKeybinds();
    registerListeners();
}

init();