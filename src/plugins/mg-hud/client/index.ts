import * as alt from 'alt-client';
import * as natives from 'natives';
import { HudEvents } from '../shared/events.js';

alt.setConfigFlag('DISABLE_IDLE_CAMERA', true);

alt.everyTick(() => {
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
