import * as alt from 'alt-client';
import * as natives from 'natives';

import { useRebarClient } from '@Client/index.js';
import { useClientApi } from '@Client/api/index.js';

import { DeathEvents } from '../shared/events.js';

const Rebar = useRebarClient();
const view = Rebar.webview.useWebview();

let interval: number | null = null;  

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

    alt.onServer(DeathEvents.toClient.toggleControls, (value: boolean) => {
        if (!value) {
            if (interval) alt.clearEveryTick(interval);
            interval = alt.everyTick(handleControls);
            return;
        }

        if (!interval) return;
        alt.clearEveryTick(interval);
    });

    alt.onRpc(DeathEvents.toClient.startRescue, async(payload: { 
        pilot: alt.Ped;
        helicopter: alt.Vehicle;
        startPoint: alt.IVector3, 
        landPoint: alt.IVector3, 
        endPoint: alt.IVector3 
    }) => {
        const pilot = payload.pilot;
        const helicopter = payload.helicopter;
        const player = alt.Player.local;
        const landPoint = payload.landPoint;
        const endPoint = payload.endPoint;

        natives.taskWarpPedIntoVehicle(pilot.scriptID, helicopter.scriptID, -1);

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

        natives.deleteVehicle(helicopter.scriptID);
        natives.deletePed(pilot.scriptID);
        return {};
    });
}

function handleControls() {
    // Scroll Wheel
    natives.disableControlAction(0, 14, true);
    natives.disableControlAction(0, 15, true);
    natives.disableControlAction(0, 16, true);
    natives.disableControlAction(0, 17, true);

    // Attacking
    natives.disableControlAction(0, 24, true);
    natives.disableControlAction(0, 25, true);

    //Movement
    natives.disableControlAction(0, 21, true);
    natives.disableControlAction(0, 22, true);
    natives.disableControlAction(0, 23, true);
    natives.disableControlAction(0, 32, true);
    natives.disableControlAction(0, 33, true);
    natives.disableControlAction(0, 34, true);
    natives.disableControlAction(0, 35, true);
}

async function init() {
    alt.setConfigFlag('DISABLE_VEHICLE_ENGINE_SHUTDOWN_ON_LEAVE', true);
    await registerKeybinds();
    registerListeners();
}

init();