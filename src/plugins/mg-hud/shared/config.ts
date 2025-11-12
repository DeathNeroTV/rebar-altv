import { Character } from "@Shared/types/character.js";
import { Vehicle } from "@Shared/types/vehicle.js";
import { HudConfig } from "./interfaces.js";

export const Config: HudConfig = {
    language: 'de',
    timePerSecond: 30,
    ticksInMS: 100,
    baseDrain: {
        food: 0.0015,   // geringer Grundverbrauch, ~1,5% pro 10 min bei Ruhe
        water: 0.0035,  // höherer Grundverbrauch, ~3,5% pro 10 min bei Ruhe
        health: 0.004,  // Health sinkt nur bei Unterversorgung, langsam
    },
    lowThreshold:  {
        food: 20,       // in %
        water: 20,      // in %
        health: 119     // absolute Health-Grenze (99 - 200)
    },
    warnDelayInSeconds: 300,
    factors: {
        isSprinting: { multiplier: 1.4, weight: 1.0 },  // Hohe Belastung, Hauptursache für Drain
        isMoving: { multiplier: 1.0, weight: 0.5 },     // Normales Gehen – leichter Verbrauch
        isJumping: { multiplier: 1.2, weight: 0.6 },    // Kleine Zusatzbelastung
        isClimbing: { multiplier: 1.6, weight: 1.2 },   // Sehr anstrengend, aber selten
        isShooting: { multiplier: 1.1, weight: 0.7 },   // Puls & Stress steigen
        isSwimming: { multiplier: 1.5, weight: 1.0 },   // Mittel-hohe Belastung, Wasserverlust realistisch
    },
    CharKeys: [ 'id', 'armour', 'food', 'water', 'health', 'voiceRange', 'isDead', 'weapon' ] as (keyof Character)[],
    VehKeys: [ 'speed', 'gear', 'maxSpeed', 'fuel', 'rpm', 'stateProps' ] as (keyof Vehicle)[],
};

export function getDrainMultiplier(activity: keyof typeof Config.factors): number {
    const { multiplier, weight } = Config.factors[activity];
    return multiplier * weight;
}