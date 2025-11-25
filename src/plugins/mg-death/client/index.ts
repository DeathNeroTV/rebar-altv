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
                view.emit(DeathEvents.toWebview.requestRespawn);
            },
            allowIfDead: true,
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

    alt.onServer(DeathEvents.toClient.disableControls, (value: boolean) => {
        if (value) {
            try { alt.clearEveryTick(interval); } catch {}
            interval = alt.everyTick(handleControls);
            return;
        }

        try { alt.clearEveryTick(interval); } catch {}
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
    natives.disableControlAction(0, 49, true);
    natives.disableControlAction(0, 75, true);
    natives.disableControlAction(0, 144, true);
    natives.disableControlAction(0, 145, true);
}

async function init() {
    alt.setConfigFlag('DISABLE_VEHICLE_ENGINE_SHUTDOWN_ON_LEAVE', true);
    await registerKeybinds();
    registerListeners();
}
init();