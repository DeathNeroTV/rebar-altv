import { Character } from "@Shared/types/character.js";
import { Vehicle } from "@Shared/types/vehicle.js";

type HudAction = 'isSprinting' | 'isMoving' | 'isJumping' | 'isClimbing' | 'isShooting' | 'isSwimming';
type HudFactor = { multiplier: number; weight: number; };

export interface VitalCoolDowns {
    food?: number;
    water?: number;
    health?: number;
}
export interface HudConfig {
    _id?: string;
    name?: string;
    language: string;
    timePerSecond: number;
    ticksInMS: number;
    baseDrain: Record<'food' | 'water' | 'health', number>;
    lowThreshold: Record<'food' | 'water' | 'health', number>;
    warnDelayInSeconds: number;
    factors: Record<HudAction, HudFactor>;
    CharKeys: (keyof Character)[];
    VehKeys: (keyof Vehicle)[];
}

export interface ActionModifiers {
    isSprinting: boolean; 
    isMoving: boolean; 
    isJumping: boolean; 
    isShooting: boolean; 
    isClimbing: boolean;
    isSwimming: boolean;
}