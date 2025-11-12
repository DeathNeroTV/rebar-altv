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
import { VitalCoolDowns } from '../shared/interfaces.js';
import { useHudService } from './services.js';

const Rebar = useRebar();
const notifyApi = await Rebar.useApi().getAsync('notify-api');
const vitalWarnings: Map<string, VitalCoolDowns> = new Map();

alt.on('rebar:timeChanged', (hour: number, minute: number, second: number) => {
    const players: alt.Player[] = alt.Player.all.filter((player: alt.Player) => Rebar.document.character.useCharacter(player).isValid());
    const now: Date = new Date(Date.now()); 
    const day: DateTimeDay = now.getDay() as DateTimeDay;
    const month: DateTimeDay = now.getDay() as DateTimeMonth;
    const year: number = now.getFullYear();
    const h: DateTimeHour = hour as DateTimeHour;
    const m: DateTimeMinute = minute as DateTimeMinute;
    const s: DateTimeSecond = second as DateTimeSecond;

    players.forEach(player => {
        player.setDateTime(day, month, year, h, m, s);
        useHudService().updateTime(player, h, m, s);
    });
    
});

alt.on('rebar:playerCharacterBound', (player: alt.Player, character: Character) => {
    Rebar.player.useWebview(player).show('Hud', 'overlay');
    Object.keys(character).map(key => key).forEach(key => useHudService().updatePlayer(player, key as keyof Character, character[key]));
});

alt.on('rebar:playerCharacterUpdated', (player: alt.Player, key: keyof Character, value: any) => {
    if (!player || !player.valid) return;
    useHudService().updatePlayer(player, key, value);
});

alt.on('rebar:vehicleUpdated', (vehicle: alt.Vehicle, key: keyof Vehicle, value: any) => {
    if (!vehicle || !vehicle.valid) return;
    const driver = vehicle.driver;
    if (!driver || !driver.valid) return;

    useHudService().updateVehicle(driver, key, value);
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

    await document.setBulk({ health: Math.max(99, Math.min(200, victim.health)), armour: Math.max(0, Math.min(100, victim.armour)) });
    Rebar.player.useState(victim).apply({ health: Math.max(99, Math.min(200, victim.health)), armour: Math.max(0, Math.min(100, victim.armour)) });
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
    if (!document.isValid() || document.getField('isDead')) return;

    const charId = document.getField('_id');
    let food = document.getField('food') ?? 100;
    let water = document.getField('water') ?? 100;
    let health = document.getField('health') ?? 200;

    // Multiplier basierend auf Aktionen
    const multiplier =
        1 +
        (data.isSprinting ? HudConfig.actionMultipliers.sprinting * 0.5 : 0) +
        (data.isMoving ? HudConfig.actionMultipliers.moving * 0.5 : 0) +
        (data.isJumping ? HudConfig.actionMultipliers.jumping * 0.7 : 0) +
        (data.isShooting ? HudConfig.actionMultipliers.shooting * 0.5 : 0);

    // Food & Water Verbrauch
    const foodDrain = HudConfig.baseDrain * multiplier;
    const waterDrain = HudConfig.baseDrain * multiplier;

    food = Math.max(food - foodDrain, 0);
    water = Math.max(water - waterDrain, 0);

    // Health nur verringern, wenn Werte unter Threshold fallen
    let healthLoss = 0;
    if (food <= HudConfig.lowThreshold)
        healthLoss += HudConfig.healthDrain * ((HudConfig.lowThreshold - food) / HudConfig.lowThreshold);

    if (water <= HudConfig.lowThreshold)
        healthLoss += HudConfig.healthDrain * ((HudConfig.lowThreshold - water) / HudConfig.lowThreshold);

    health = Math.max(health - healthLoss, 99);

    const isDead = health === 99;
    const now = Date.now();
    const cooldowns = vitalWarnings.get(charId) ?? {};

    // Food-Warnung
    if (food <= HudConfig.lowThreshold && (!cooldowns.food || now >= cooldowns.food)) {
        notifyApi.general.send(player, {
            title: 'Vital-Monitor',
            subtitle: 'Ernährung kritisch',
            icon: notifyApi.general.getTypes().WARNING,
            message: `Aktueller Wert: ${food.toFixed(1)} %`,
            oggFile: 'systemfault'
        });
        cooldowns.food = now + HudConfig.warnDelayInSeconds * 1000;
    }

    // Water-Warnung
    if (water <= HudConfig.lowThreshold && (!cooldowns.water || now >= cooldowns.water)) {
        notifyApi.general.send(player, {
            title: 'Vital-Monitor',
            subtitle: 'Hydration kritisch',
            icon: notifyApi.general.getTypes().WARNING,
            message: `Aktueller Wert: ${water.toFixed(1)} %`,
            oggFile: 'systemfault'
        });
        cooldowns.water = now + HudConfig.warnDelayInSeconds * 1000;
    }

    // Health-Warnung
    if (health <= HudConfig.lowThreshold && (!cooldowns.health || now >= cooldowns.health)) {
        notifyApi.general.send(player, {
            title: 'Vital-Monitor',
            subtitle: 'Elektrolythaushalt kritisch',
            icon: notifyApi.general.getTypes().WARNING,
            message: `Aktueller Wert: ${health.toFixed(1)} %`,
            oggFile: 'systemfault'
        });
        cooldowns.health = now + HudConfig.warnDelayInSeconds * 1000;
    }

    // Cooldowns zurück in Map speichern
    vitalWarnings.set(charId, cooldowns);

    await document.setBulk({ food, water, health, ...(isDead ? { isDead } : {}) });
});

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