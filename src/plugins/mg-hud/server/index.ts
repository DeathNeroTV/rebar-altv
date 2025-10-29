import * as alt from 'alt-server';
import { useRebar } from '@Server/index.js';
import { Character } from '@Shared/types/character.js';
import { HudEvents } from '../shared/events.js';
import { Vehicle } from '@Shared/types/vehicle.js';

const Rebar = useRebar();
const api = Rebar.useApi();

const allowedPlayerKeys: (keyof Character)[] = [
    'armour',
    'food',
    'water',
    'health',
    'voiceRange',
    'isDead',
    'weapon'
];

const allowedVehicleKeys: (keyof Vehicle)[] = [
    'speed',
    'gear',
    'maxSpeed',
    'fuel',
    'rpm',
    'stateProps',
];

alt.on('rebar:playerCharacterUpdated', (player: alt.Player, key: keyof Character, value: any) => {
    if (!player || !player.valid) return;
    if (!allowedPlayerKeys.includes(key)) return;

    Rebar.player.useWebview(player).emit(HudEvents.toClient.updatePlayer, { key, value });
});

alt.on('rebar:vehicleUpdated', (vehicle: alt.Vehicle, key: keyof Vehicle, value: any) => {
    if (!vehicle || !vehicle.valid) return;
    if (!allowedVehicleKeys.includes(key)) return;

    const driver = vehicle.driver;
    if (!driver || !driver.valid) return;

    Rebar.player.useWebview(driver).emit(HudEvents.toClient.updateVehicle, { key, value });
});

alt.on('playerEnteredVehicle', (player: alt.Player, vehicle: alt.Vehicle, seat: number) => {
    if (seat !== 0) return;
    Rebar.player.useWebview(player).emit(HudEvents.toClient.toggleVehicle, true);
});

alt.on('playerLeftVehicle', (player: alt.Player, vehicle: alt.Vehicle, seat: number) => {
    if (seat !== 0) return;    
    Rebar.player.useWebview(player).emit(HudEvents.toClient.toggleVehicle, false);
});

alt.on('playerWeaponChange', async (player: alt.Player, oldWeapon: number, newWeapon: number) => {
    const document = Rebar.document.character.useCharacter(player);
    if (!document.isValid) return;

    const weapon: alt.IWeapon & { ammo: number; totalAmmo: number } =  {
        hash: newWeapon,
        ammo: player.getAmmo(newWeapon),
        totalAmmo: player.getAmmoMax(newWeapon),
        components: player.currentWeaponComponents,
        tintIndex: player.currentWeaponTintIndex
    };

    await document.set('weapon', weapon);
});

alt.on('playerDamage', async (victim: alt.Player, attacker: alt.Entity, healthDamage: number, armourDamage: number, weaponHash: number) => {
    
    const document = Rebar.document.character.useCharacter(victim);
    if (!document.isValid) return;

    await document.setBulk({
        health: Math.max(99, victim.health - healthDamage),
        armour: Math.max(0, victim.armour - armourDamage),
    });
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

function handleSkipCreate(player: alt.Player): void {
    Rebar.player.useWebview(player).show('MainHud', 'overlay');
    const document = Rebar.document.character.useCharacter(player);
    if (!document.isValid) return;
    const character = document.get();
    Object.keys(character).forEach(key => Rebar.player.useWebview(player).emit(HudEvents.toClient.updatePlayer, { key, value: character[key] }));
}

async function init() {
    await alt.Utils.waitFor(() => api.isReady('character-creator-api'), 30000);
    const charCreatorApi = api.get('character-creator-api');
    charCreatorApi.onSkipCreate(handleSkipCreate);
}

init();

declare module '@Shared/types/character.js' {
    export interface Character {
        voiceRange?: number;
        weapon?: (alt.IWeapon & { ammo: number; totalAmmo: number; });
    }
}

declare module '@Shared/types/vehicle.js' {
    export interface Vehicle {
        speed?: number;
        maxSpeed?: number;
        rpm?: number;
        gear?: number;
    }
}
