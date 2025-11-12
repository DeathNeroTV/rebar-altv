import { Character } from "@Shared/types/character.js";
import { Vehicle } from "@Shared/types/vehicle.js";

export const HudConfig = {
    language: 'de',
    timePerSecond: 30,
    ticksInMS: 100,
    baseDrain: {
        food: 0.002,
        water: 0.004,
        health: 0.005,
    },
    lowThreshold: 20,
    warnDelayInSeconds: 300,
    actionMultipliers: {
        sprinting: 2.0,
        moving: 1.2,
        jumping: 1.5,
        shooting: 1.3
    },
    CharKeys: [ 'id', 'armour', 'food', 'water', 'health', 'voiceRange', 'isDead', 'weapon' ] as (keyof Character)[],
    VehKeys: [ 'speed', 'gear', 'maxSpeed', 'fuel', 'rpm', 'stateProps' ] as (keyof Vehicle)[],
};