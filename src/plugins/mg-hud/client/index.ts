import * as alt from 'alt-client';
import * as natives from 'natives';
import { HudEvents } from '../shared/events.js';
import { useRebarClient } from '@Client/index.js';
import { useClientApi } from '@Client/api/index.js';
import { HudConfig } from '../shared/config.js';

const Rebar = useRebarClient();
const api = useClientApi();
const view = Rebar.webview.useWebview();

const keyBind: KeyInfo = {
    description: 'Mauszeiger de-/aktivieren',
    identifier: 'toggle-hud-cursor',
    key: alt.KeyCode.F2,
    keyDown: () => {
        view.focus();
        view.showCursor(true);
        alt.toggleGameControls(false);
    },
    keyUp: () => {
        view.unfocus();
        view.showCursor(false);
        alt.toggleGameControls(true);
    }
};

alt.on('connectionComplete', async() => {
    const msPerGameSecond = 1000 / HudConfig.timePerSecond;
    const msPerGameMinute = msPerGameSecond * 60;
    alt.setMsPerGameMinute(msPerGameMinute);
    const keyBindApi = await api.getAsync('keyBinds-api', 3000);
    keyBindApi.add(keyBind);
});

alt.everyTick(() => {
    alt.nextTick(() => {
        if (!alt.getConfigFlag(alt.ConfigFlag.DisableIdleCamera)) 
            alt.setConfigFlag(alt.ConfigFlag.DisableIdleCamera, true);
    });
    const player = alt.Player.local;
    const vehicle = player.vehicle;

    if (!vehicle || !vehicle.valid) return;
    if (!vehicle.engineOn) return;

    const rpm = vehicle.rpm;
    const gear = vehicle.gear;
    const speedKmh = natives.getEntitySpeed(vehicle.scriptID) * 3.6;
    const maxSpeed = natives.getVehicleEstimatedMaxSpeed(vehicle.scriptID) * 3.6;

    alt.emitServer(HudEvents.toServer.updateFuel, { rpm, gear, speed: speedKmh, maxSpeed });
});



