import * as alt from 'alt-client';
import * as natives from 'natives';

import { useRebarClient } from '@Client/index.js';
import { useClientApi } from '@Client/api/index.js';

import { DeathEvents } from '../shared/events.js';

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
            keyDown: async() => {
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
                natives.taskGoStraightToCoord(alt.Player.local, targetX, targetY, targetZ, 1.2, -1, 0.0, 0.0);

                // Warten, bis Spieler ungefähr am Ziel ist (max. 5 Sekunden)
                const startTime = Date.now();
                while (alt.Player.local.pos.distanceTo({ x: targetX, y: targetY, z: targetZ }) > 0.3 && Date.now() - startTime < 5000) {
                    await alt.Utils.wait(50);
                }

                // Spieler korrekt zum Opfer drehen
                natives.taskTurnPedToFaceCoord(alt.Player.local, chestPos.x, chestPos.y, chestPos.z, 1000);

                // Warten, bis Spieler auf das Ziel schaut (max. 2 Sekunden)
                const turnStart = Date.now();
                while (!natives.isPedFacingPed(alt.Player.local, victim, 10) && Date.now() - turnStart < 2000) {
                    await alt.Utils.wait(50);
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

    alt.onRpc(DeathEvents.toClient.startRescue, async(payload: { 
        pilot: alt.Ped, 
        helicopter: alt.Vehicle, 
        landPoint: alt.IVector3, 
        endPoint: alt.IVector3 
    }) => {
        const player = alt.Player.local;
        const helicopter = payload.helicopter;
        const pilot = payload.pilot;
        const landPoint = payload.landPoint;
        const endPoint = payload.endPoint;

        natives.freezeEntityPosition(helicopter.scriptID, true);
        natives.freezeEntityPosition(pilot.scriptID, true);

        natives.taskWarpPedIntoVehicle(pilot.scriptID, helicopter.scriptID, 0);
        natives.setVehicleEngineOn(helicopter.scriptID, true, true, true);
        natives.setVehicleLivery(helicopter.scriptID, 2);
        natives.setVehicleDoorsLocked(helicopter.scriptID, 2);

        await alt.Utils.wait(2000);

        natives.freezeEntityPosition(helicopter.scriptID, false);
        natives.freezeEntityPosition(pilot.scriptID, false);

        // Bodenhöhe
        const [foundZ, groundZ] = natives.getGroundZFor3dCoord(landPoint.x, landPoint.y, landPoint.z, 0, false, false);
        const z = foundZ ? groundZ : landPoint.z;

        // 1️⃣ Heli fliegt über Landepunkt
        natives.taskHeliMission(pilot.scriptID, helicopter.scriptID, 0, 0, landPoint.x, landPoint.y, z + 20, 4, 30.0, 10.0, 0.0, 50, 20, 50.0, 0);

        // Warten bis Heli nah am Hover-Punkt ist
        let attempts = 0;
        while(helicopter.pos.distanceTo(new alt.Vector3(landPoint.x, landPoint.y, z + 20)) > 5 && attempts < 200) {
            attempts++;
            await alt.Utils.wait(20);
        }

        // 2️⃣ Heli landet
        natives.taskHeliMission(pilot.scriptID, helicopter.scriptID, 0, 0, landPoint.x, landPoint.y, z, 20, 10.0, 5.0, 0.0, 30, 10, 20.0, 0);
        await alt.Utils.wait(3000);

        // 3️⃣ Spieler einsteigen
        natives.taskWarpPedIntoVehicle(player.scriptID, helicopter.scriptID, 2); // hinterer Sitz
        await alt.Utils.wait(1000);

        // 4️⃣ Heli startet erneut und fliegt zum Endpunkt
       const [foundEndZ, groundEndZ] = natives.getGroundZFor3dCoord(endPoint.x, endPoint.y, endPoint.z, 0, false, false);
       const hoverZ = 100; // Immer 100m Höhe über Ziel

        natives.taskHeliMission(pilot.scriptID, helicopter.scriptID, 0, 0, endPoint.x, endPoint.y, hoverZ, 4, 35.0, 10.0, 0.0, 50, 20, 50.0, 0);

        // Warten bis Heli am Ziel angekommen
        attempts = 0;
        while(helicopter.pos.distanceTo(new alt.Vector3(endPoint.x, endPoint.y, hoverZ)) > 5 && attempts < 500) {
            attempts++;
            await alt.Utils.wait(20);
        }

        // 5️⃣ Heli landet am Endpunkt
        const finalZ = foundEndZ ? groundEndZ : endPoint.z;
        natives.taskHeliMission(pilot.scriptID, helicopter.scriptID, 0, 0, endPoint.x, endPoint.y, finalZ, 20, 10.0, 5.0, 0.0, 30, 10, 20.0, 0);
        await alt.Utils.wait(3000);

        natives.deleteEntity(helicopter);
        natives.deleteEntity(pilot);
        return;
    });
}

async function init() {
    await registerKeybinds();
    registerListeners();
}

init();