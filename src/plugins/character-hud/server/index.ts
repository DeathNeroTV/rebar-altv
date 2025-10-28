import * as alt from 'alt-server';
import { useRebar } from '@Server/index.js';
import { Character } from '@Shared/types/character.js';
import { HudEvents } from '../shared/events.js';
import { Vehicle } from '@Shared/types/vehicle.js';

const Rebar = useRebar();
const allowedPlayerKeys: (keyof Character)[] = [
    'armour',
    'food',
    'water',
    'health',
    'voiceRange'
];
const allowedVehicleKeys: (keyof Vehicle)[] = [
    'speed',
    'gear',
    'maxSpeed',
    'stateProps',
    'lightsOn',
    'fuel',
    'rpm'
];

alt.on('rebar:playerCharacterUpdated', (player: alt.Player, fieldName: keyof Character, value: any) => {
    if (!player || !player.valid) return;
    if (!allowedPlayerKeys.includes(fieldName)) return;

    Rebar.player.useWebview(player).emit(HudEvents.toClient.updatePlayer, {
        key: fieldName,
        value: value
    });
});

alt.on('rebar:vehicleUpdated', (vehicle: alt.Vehicle, fieldName: keyof Vehicle, value: any) => {
    if (!vehicle || !vehicle.valid) return;
    if (!allowedVehicleKeys.includes(fieldName)) return;

    const driver = vehicle.driver;
    if (!driver || !driver.valid) return;

    Rebar.player.useWebview(driver).emit(HudEvents.toClient.updateVehicle, {
        key: fieldName,
        value: value
    });
});

alt.on('playerEnteredVehicle', (player: alt.Player, vehicle: alt.Vehicle, seat: number) => {
    if (seat !== 0) return;
    Rebar.player.useWebview(player).emit(HudEvents.toClient.toggleVehicle, true);
});

alt.on('playerLeftVehicle', (player: alt.Player, vehicle: alt.Vehicle, seat: number) => {
    if (seat !== 0) return;    
    Rebar.player.useWebview(player).emit(HudEvents.toClient.toggleVehicle, false);
});

alt.onClient(HudEvents.toServer.updateFuel, async (player: alt.Player, data: { rpm: number; gear: number; speed: number; maxSpeed: number; }) => {
    if (!player.vehicle?.valid) return;

    const vehicleData = Rebar.document.vehicle.useVehicle(player.vehicle);
    if (!vehicleData.isValid) return;

    let consumption = 0.0004;
    consumption += Math.pow(data.rpm, 1.8) * 0.002;
    consumption *= 1 + (1 / data.gear) * 0.5;
    if (data.speed > 80) consumption *= 1 + Math.pow(data.speed / 100, 2) * 0.02;

    const intervalSeconds = 500 / 1000;
    const fuelUsed = consumption * intervalSeconds * 10;

    await vehicleData.setBulk({ 
        fuel: fuelUsed,
        rpm: data.rpm,
        gear: data.gear,
        speed: data.speed,
        maxSpeed: data.maxSpeed
    });
});

declare module '@Shared/types/character.js' {
    export interface Character {
        voiceRange: number;
        weapon: (alt.IWeapon & { ammo: number; totalAmmo: number; });
    }
}

declare module '@Shared/types/vehicle.js' {
    export interface Vehicle {
        speed: number;
        maxSpeed: number;
        rpm: number;
        gear: number;
        lightsOn: boolean;
    }
}