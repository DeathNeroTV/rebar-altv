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
import { getDrainMultiplier, Config } from '../shared/config.js';
import { ActionModifiers, HudConfig, VitalCoolDowns } from '../shared/interfaces.js';
import { useHudService } from './services.js';
import { useConfigService } from '@Plugins/mg-configs/server/service.js';
import { DefaultConfig } from '@Plugins/mg-configs/shared/interfaces.js';

const Rebar = useRebar();
const db = Rebar.database.useDatabase();
const notifyApi = await Rebar.useApi().getAsync('notify-api');
const vitalWarnings: Map<string, VitalCoolDowns> = new Map();
let config: Record<string, any> = Config;

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
        garageId?: string;
    }
}

Rebar.services.useServiceRegister().register('hudService', {
    async updateConfig(player, key, value) {
        config[key] = value;
        const success = await db.update<HudConfig>(config, 'Configs');
        const icon = success ? notifyApi.general.getTypes().SUCCESS : notifyApi.general.getTypes().ERROR;
        const message = success ? 'Datensatz wurde aktualisiert' : 'Datensatz wurde nicht geändert';
        const oggFile = success ? 'notification' : 'systemfault';
        notifyApi.general.send(player, { icon, title: 'Hud-Manager', subtitle: 'Konfiguration', message, oggFile });
    },
    updatePlayer(player, key, value) {
        if (!config.CharKeys.includes(key)) return;        
        Rebar.player.useWebview(player).emit(HudEvents.toWebview.updatePlayer, { key, value });
    },
    updateTime(player, hour, minute, second) {
        Rebar.player.useWebview(player).emit(HudEvents.toWebview.syncTime, hour, minute, second);
    },
    updateVehicle(player, key, value) {
        if (!config.VehKeys.includes(key)) return;
        Rebar.player.useWebview(player).emit(HudEvents.toWebview.updateVehicle, { key, value });
    },
});

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

alt.on('rebar:playerCharacterUpdated', (player: alt.Player, key: keyof Character, value: any) => {
    if (!player || !player.valid || !config.CharKeys.includes(key)) return;
    useHudService().updatePlayer(player, key, value);
});

alt.on('rebar:vehicleUpdated', (vehicle: alt.Vehicle, key: keyof Vehicle, value: any) => {
    if (!vehicle || !vehicle.valid || !vehicle.driver || !vehicle.driver.valid || !config.VehKeys.includes(key)) return;
    useHudService().updateVehicle(vehicle.driver, key, value);
});

alt.on('playerEnteredVehicle', (player: alt.Player, vehicle: alt.Vehicle, seat: number) => 
    Rebar.player.useWebview(player).emit(HudEvents.toWebview.toggleVehicle, true)
);

alt.on('playerLeftVehicle', (player: alt.Player, vehicle: alt.Vehicle, seat: number) => 
    Rebar.player.useWebview(player).emit(HudEvents.toWebview.toggleVehicle, false)
);

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

alt.on('mg-config:createdConfig', async (_id: string) => {
    const cfg = await useConfigService().get(_id);
    if (cfg.name !== 'HUD-Einstellungen') return;
    if (cfg && cfg.data) config = cfg.data;
    else config = Config;
});

alt.on('mg-config:changedConfig', (changed: boolean, _id: string, key: keyof DefaultConfig, value: DefaultConfig[keyof DefaultConfig]) => {
    if (!changed) return;
    if (key === 'name' || key === '_id') return;
    if (!(key in config)) return;
    config[key] = value;
});

alt.onClient(HudEvents.toServer.updateFuel, async (player: alt.Player, data: { rpm: number; gear: number; speed: number; maxSpeed: number; }) => {
    if (!player.vehicle) return;
    const vehicleData = Rebar.document.vehicle.useVehicle(player.vehicle);
    if (!vehicleData.isValid()) return;

    let fuel = vehicleData.getField('fuel') ?? 100;
    let consumption = 0.0002;

    const rpmFactor = Math.min(1.0, Math.max(0.3, data.rpm));
    const gearFactor = Math.max(0.8, 1.5 - data.gear * 0.1);
    const speedFactor = 1 + Math.pow(data.speed / data.maxSpeed, 2) * 0.3;
    consumption *= rpmFactor * gearFactor * speedFactor;

    const intervalSeconds = 0.1;
    const fuelUsed = consumption * intervalSeconds * 10;

    fuel = Math.max(0, fuel - fuelUsed);

    await vehicleData.setBulk({ fuel, rpm: data.rpm, gear: data.gear, speed: data.speed, maxSpeed: data.maxSpeed });
});

alt.onClient(HudEvents.toServer.updateStats, async(player: alt.Player, data: ActionModifiers) => {
    const document = Rebar.document.character.useCharacter(player);
    if (!document.isValid() || document.getField('isDead')) return;

    const charId = document.getField('_id');
    let food = document.getField('food') || 100;
    let water = document.getField('water') || 100;
    let health = document.getField('health') || player.health;
    let activityFactor = 0;
    
    // === Aktivitätsfaktor dynamisch berechnen ===
    for (const [action, active] of Object.entries(data)) {
        if (!active) continue;
        if (action in config.factors) {
            activityFactor += getDrainMultiplier(action as keyof typeof config.factors);
        }
    }

    const multiplier = 1 + activityFactor;

     // === Verbrauch berechnen ===
    const foodDrain = config.baseDrain.food * multiplier;
    const waterDrain = config.baseDrain.water * multiplier;

    food = Math.max(food - foodDrain, 0);
    water = Math.max(water - waterDrain, 0);

    // === Gesundheit nur bei Unterversorgung reduzieren ===
    let healthLoss = 0;
    if (food <= config.lowThreshold.food)
        healthLoss += config.baseDrain.health * ((config.lowThreshold.food - food) / config.lowThreshold.food);

    if (water <= config.lowThreshold.water)
        healthLoss += config.baseDrain.health * ((config.lowThreshold.water - water) / config.lowThreshold.water);

    health = Math.max(health - healthLoss, 99);

    // === Cooldown-System für Warnmeldungen ===
    const now = Date.now();
    const cooldowns = vitalWarnings.get(charId) ?? {};

    // Food-Warnung
    if (food <= config.lowThreshold.food && (!cooldowns.food || now >= cooldowns.food)) {
        notifyApi.general.send(player, {
            title: 'Vital-Monitor',
            subtitle: 'Ernährung kritisch',
            icon: notifyApi.general.getTypes().WARNING,
            message: `Aktueller Wert: ${food.toFixed(1)} %`,
            oggFile: 'systemfault'
        });
        cooldowns.food = now + config.warnDelayInSeconds * 1000;
    }

    // Water-Warnung
    if (water <= config.lowThreshold.water && (!cooldowns.water || now >= cooldowns.water)) {
        notifyApi.general.send(player, {
            title: 'Vital-Monitor',
            subtitle: 'Hydration kritisch',
            icon: notifyApi.general.getTypes().WARNING,
            message: `Aktueller Wert: ${water.toFixed(1)} %`,
            oggFile: 'systemfault'
        });
        cooldowns.water = now + config.warnDelayInSeconds * 1000;
    }

    // Health-Warnung
    if (health <= config.lowThreshold.health && (!cooldowns.health || now >= cooldowns.health)) {
        notifyApi.general.send(player, {
            title: 'Vital-Monitor',
            subtitle: 'Gesundheit kritisch',
            icon: notifyApi.general.getTypes().WARNING,
            message: `Aktueller Wert: ${(Math.max(health - 99, 0)).toFixed(1)} %`,
            oggFile: 'systemfault'
        });
        cooldowns.health = now + config.warnDelayInSeconds * 1000;
    }

    vitalWarnings.set(charId, cooldowns);

    const isDead = health === 99;
    await document.setBulk({ food, water, health, ...(isDead ? { isDead } : {}) });

    alt.nextTick(() => Rebar.player.useWebview(player).emit(HudEvents.toWebview.updatePlayer, { key: 'id', value: document.getField('id') }));
});

alt.setInterval(() => {
    const timeService = Rebar.services.useTimeService();
    const time = timeService.getTime();
    let totalSeconds = time.second + time.minute * 60 + time.hour * 3600;
    totalSeconds += config.timePerSecond;

    const ingameHours = Math.floor(totalSeconds / 3600) % 24;
    const ingameMinutes = Math.floor((totalSeconds % 3600) / 60);
    const ingameSeconds = Math.floor(totalSeconds % 60);

    timeService.setTime(ingameHours, ingameMinutes, ingameSeconds);
}, 1000);

const handleHudView = (player: alt.Player) => {
    if (!player || !player.valid) return;
    Rebar.player.useWebview(player).show('Hud', 'overlay');
};

async function init() {
    const charEditorApi = await Rebar.useApi().getAsync('character-creator-api');
    if (!charEditorApi) {
        alt.logError('[mg-hud]', 'character-creator-api not found');
        return;
    }

    charEditorApi.onCreate(handleHudView);
    charEditorApi.onSkipCreate(handleHudView);

    Config.CharKeys.forEach(Rebar.systems.useStreamSyncedBinder().syncCharacterKey);
    Config.VehKeys.forEach(Rebar.systems.useStreamSyncedBinder().syncVehicleKey);

    await useConfigService().create('HUD-Einstellungen', Config);
}
init();