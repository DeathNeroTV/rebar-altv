import * as alt from 'alt-server';
import { useRebar } from '@Server/index.js';
import { Character } from '@Shared/types/character.js';
import { HudEvents } from '../shared/events.js';
import { Vehicle } from '@Shared/types/vehicle.js';
import { DateTimeDay } from 'alt-server';
import { DateTimeMonth } from 'alt-server';
import { DateTimeHour } from 'alt-server';
import { DateTimeMinute } from 'alt-server';
import { DateTimeSecond } from 'alt-server';
import { HudConfig } from '../shared/config.js';

const Rebar = useRebar();
const api = Rebar.useApi();

const allowedPlayerKeys: (keyof Character)[] = [
    'id',
    'armour',
    'food',
    'water',
    'health',
    'voiceRange',
    'isDead',
    'weapon',
];

const allowedVehicleKeys: (keyof Vehicle)[] = [
    'speed',
    'gear',
    'maxSpeed',
    'fuel',
    'rpm',
    'stateProps',
];

alt.onRpc(HudEvents.toServer.fetchId, (player: alt.Player) => {
    return Rebar.document.character.useCharacter(player)?.getField('id') ?? 0;
});

alt.on('rebar:timeChanged', (hour: number, minute: number, second: number) => {
    const players: alt.Player[] = alt.Player.all.filter((player: alt.Player) => Rebar.document.character.useCharacter(player).isValid());
    players.forEach((player: alt.Player) => {
        const now: Date = new Date(Date.now()); 
        const day: DateTimeDay = now.getDay() as DateTimeDay;
        const month: DateTimeDay = now.getDay() as DateTimeMonth;
        const year: number = now.getFullYear();
        const h: DateTimeHour = hour as DateTimeHour;
        const m: DateTimeMinute = minute as DateTimeMinute;
        const s: DateTimeSecond = second as DateTimeSecond;
        player.setDateTime(day, month, year, h, m, s);
        Rebar.player.useWebview(player).emit(HudEvents.toWebview.syncTime, hour, minute, second);
    });
});

alt.on('rebar:playerCharacterUpdated', (player: alt.Player, key: keyof Character, value: any) => {
    if (!allowedPlayerKeys.includes(key)) return;
    const document = Rebar.document.character.useCharacter(player);
    if (!document.isValid()) return;

    Rebar.player.useWebview(player).emit(HudEvents.toWebview.updatePlayer, { key, value });

    if (key !== 'isDead') return;
    Rebar.player.useWebview(player).emit(HudEvents.toWebview.updateDead, value);
});

alt.on('rebar:vehicleUpdated', (vehicle: alt.Vehicle, key: keyof Vehicle, value: any) => {
    if (!vehicle || !vehicle.valid) return;
    if (!allowedVehicleKeys.includes(key)) return;

    const driver = vehicle.driver;
    if (!driver || !driver.valid) return;

    Rebar.player.useWebview(driver).emit(HudEvents.toWebview.updateVehicle, { key, value });
});

alt.on('playerEnteredVehicle', (player: alt.Player, vehicle: alt.Vehicle, seat: number) => {
    if (seat !== 0) return;
    Rebar.player.useWebview(player).emit(HudEvents.toWebview.toggleVehicle, true);
});

alt.on('playerLeftVehicle', (player: alt.Player, vehicle: alt.Vehicle, seat: number) => {
    if (seat !== 0) return;    
    Rebar.player.useWebview(player).emit(HudEvents.toWebview.toggleVehicle, false);
});

alt.on('playerWeaponChange', async(player: alt.Player, oldWeapon: number, newWeapon: number) => {
    const document = Rebar.document.character.useCharacter(player);
    if (!document.isValid()) return;

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
    if (!document.isValid() || document.getField('isDead')) return;

    await document.setBulk({ health: Math.max(99, victim.health), armour: Math.max(0, victim.armour) });
    alt.log('[PlayerDamage]', `${document.getField('name').replaceAll('_', ' ')} hat Schaden erlitten.`);
});

alt.onClient(HudEvents.toServer.updateFuel, async (player: alt.Player, data: { rpm: number; gear: number; speed: number; maxSpeed: number; }) => {
    const vehicleData = Rebar.document.vehicle.useVehicle(player.vehicle);
    if (!vehicleData.isValid()) return;

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

alt.onClient(HudEvents.toServer.updateStats, async (player: alt.Player, data: { isSprinting: boolean, isMoving: boolean, isJumping: boolean, isShooting: boolean }) => {
    const document = Rebar.document.character.useCharacter(player);
    if (!document.isValid()) return;

    let food = document.getField('food') || 100;
    let water = document.getField('water') || 100;
    let health = document.getField('health') || 200;
    let multiplier = 1;

    if (data.isSprinting || data.isMoving || data.isJumping || data.isShooting) {
        multiplier += (data.isSprinting ? HudConfig.actionMultipliers.sprinting : 0);
        multiplier += (data.isMoving ? HudConfig.actionMultipliers.moving : 0);
        multiplier += (data.isJumping ? HudConfig.actionMultipliers.jumping : 0);
        multiplier += (data.isShooting ? HudConfig.actionMultipliers.shooting : 0);
    }

    const foodDrain = document.getField('isDead') ? 0 : HudConfig.baseDrain * multiplier;
    const waterDrain = document.getField('isDead') ? 0 : HudConfig.baseDrain * multiplier;

    food = Math.max(food - foodDrain, 0);
    water = Math.max(water - waterDrain, 0);
    
    if (food <= 0) {
        const damage = 0.25;
        health = Math.max(health - damage, 0);
    }

    if (water <= 0) {
        const damage = 0.25;
        health = Math.max(health - damage, 99);
    }

    await document.setBulk({ food, water, health });
});

function handleSkipCreate(player: alt.Player): void {
    const document = Rebar.document.character.useCharacter(player);
    if (!document.isValid()) return;
    Rebar.player.useWebview(player).show('Hud', 'overlay');
}

async function init() {
    const charCreatorApi = await api.getAsync('character-creator-api');
    charCreatorApi.onSkipCreate(handleSkipCreate);
}

alt.setInterval(() => {
    const timeService = Rebar.services.useTimeService();
    const time = timeService.getTime();
    let totalSeconds = time.second + time.minute * 60 + time.hour * 3600;
    totalSeconds += HudConfig.timePerSecond;

    const ingameHours = Math.floor(totalSeconds / 3600) % 24;
    const ingameMinutes = Math.floor((totalSeconds % 3600) / 60);
    const ingameSeconds = Math.floor(totalSeconds % 60);

    timeService.setTime(ingameHours, ingameMinutes, ingameSeconds);
}, 1000);

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
