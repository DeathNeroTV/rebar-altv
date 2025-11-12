import * as alt from 'alt-client';
import * as natives from 'natives';
import { HudEvents } from '../shared/events.js';
import { useRebarClient } from '@Client/index.js';
import { useClientApi } from '@Client/api/index.js';
import { HudConfig } from '../shared/config.js';

const Rebar = useRebarClient();
const api = useClientApi();
const view = Rebar.webview.useWebview();
const keyBindApi = await api.getAsync('keyBinds-api');

const msPerGameSecond = 1000 / HudConfig.timePerSecond;
const msPerGameMinute = msPerGameSecond * 60;

const keyBind: KeyInfo = {
    description: 'Mauszeiger de-/aktivieren',
    identifier: 'toggle-hud-cursor',
    key: alt.KeyCode.F2,
    keyDown: () => {
        if (!view.isOverlayOpen('Hud')) return;
        view.focus();
        view.showCursor(true);
        alt.toggleGameControls(false);
    },
    keyUp: () => {
        if (!view.isOverlayOpen('Hud')) return;
        view.unfocus();
        view.showCursor(false);
        alt.toggleGameControls(true);
    }
};

alt.setMsPerGameMinute(msPerGameMinute);
keyBindApi.add(keyBind);

alt.onServer(HudEvents.toClient.syncTime, (hour: number, minute: number, second: number) => {
    if (!view.isOverlayOpen('Hud')) return;
    view.emit(HudEvents.toWebview.syncTime, hour, minute, second);
});

alt.setInterval(() => {
    if (!view.isOverlayOpen('Hud')) return;
    const player = alt.Player.local;
    const vehicle = player.vehicle;

    if (!vehicle || !vehicle.valid) return;
    if (!vehicle.engineOn) return;

    const rpm = vehicle.rpm;
    const gear = vehicle.gear;
    const speed = natives.getEntitySpeed(vehicle.scriptID) * 3.6;
    const maxSpeed = natives.getVehicleEstimatedMaxSpeed(vehicle.scriptID) * 3.6;
    alt.emitServer(HudEvents.toServer.updateFuel, { rpm, gear, speed, maxSpeed });
}, HudConfig.ticksInMS);

alt.setInterval(() => {
    if (!alt.getConfigFlag(alt.ConfigFlag.DisableIdleCamera)) 
        alt.setConfigFlag(alt.ConfigFlag.DisableIdleCamera, true);

    if (!view.isOverlayOpen('Hud')) return;
    
    const player = alt.Player.local;  
    const isMoving = natives.getEntitySpeed(player.scriptID) > 0.0;
    const isJumping = natives.isPedJumping(player.scriptID)
    const isSprinting = natives.isPedSprinting(player.scriptID) || natives.isPedRunning(player.scriptID);
    const isShooting = natives.isPedShooting(player.scriptID);

    alt.emitServer(HudEvents.toServer.updateStats, { isSprinting, isMoving, isJumping, isShooting });
}, HudConfig.ticksInMS);