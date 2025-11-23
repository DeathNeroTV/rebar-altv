import * as alt from 'alt-client';
import * as natives from 'natives';

import { useRebarClient } from '@Client/index.js';
import { useClientApi } from '@Client/api/index.js';

import { HudEvents } from '../shared/events.js';
import { Config } from '../shared/config.js';
import { ActionModifiers } from '../shared/interfaces.js';
import { Character } from '@Shared/types/character.js';

const Rebar = useRebarClient();
const streamGetter = Rebar.systems.useStreamSyncedGetter();
const api = useClientApi();
const view = Rebar.webview.useWebview();
const keyBindApi = await api.getAsync('keyBinds-api');

const msPerGameSecond = 1000 / Config.timePerSecond;
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

alt.setInterval(() => {
    if (!view.isOverlayOpen('Hud')) return;
    if (!alt.Player.local.vehicle || !alt.Player.local.vehicle.valid) return;

    const vehicle = alt.Player.local.vehicle;
    if (!natives.getIsVehicleEngineRunning(vehicle)) return;

    const rpm = vehicle.rpm;
    const gear = vehicle.gear;
    const speed = natives.getEntitySpeed(vehicle.scriptID) * 3.6;
    const maxSpeed = natives.getVehicleEstimatedMaxSpeed(vehicle.scriptID) * 3.6;
    alt.emitServer(HudEvents.toServer.updateFuel, { rpm, gear, speed, maxSpeed });
}, Config.ticksInMS);

alt.setInterval(() => {
    if (!alt.getConfigFlag(alt.ConfigFlag.DisableIdleCamera)) 
        alt.setConfigFlag(alt.ConfigFlag.DisableIdleCamera, true);
    
    if (!view.isOverlayOpen('Hud')) return;
    
    const player = alt.Player.local;  
    const isMoving = natives.isPedWalking(player.scriptID);
    const isClimbing = natives.isPedClimbing(player.scriptID);
    const isJumping = natives.isPedJumping(player.scriptID);
    const isSprinting = natives.isPedSprinting(player.scriptID) || natives.isPedRunning(player.scriptID);
    const isShooting = natives.isPedShooting(player.scriptID);
    const isSwimming = natives.isPedSwimming(player.scriptID) || natives.isPedDiving(player.scriptID);

    const modifiers: ActionModifiers = { isSprinting, isMoving, isJumping, isShooting, isClimbing, isSwimming }; 
    alt.emitServer(HudEvents.toServer.updateStats, modifiers);
}, Config.ticksInMS);