declare global {
    export interface KeyBindRestrictions {
        isOnFoot?: boolean;
        isVehicle?: boolean;
        isVehiclePassenger?: boolean;
        isVehicleDriver?: boolean;
        isAiming?: boolean;
        isSwimming?: boolean;
        vehicleModels?: Array<number>;
        weaponModels?: Array<number>;
    }

    export interface KeyInfo extends BaseKeyInfo {
        keyDown?: Function;
        keyUp?: Function;
        whilePressed?: Function;
        disabled?: boolean;
        delayedKeyDown?: {
            callback: Function;
            msToTrigger?: number;
        };
    }

    export interface BaseKeyInfo {
        key: number;
        description: string;
        identifier: string;
        keyUp?: Function;
        whilePressed?: Function;
        modifier?: 'shift' | 'ctrl' | 'alt';
        allowInAnyMenu?: true;
        allowIfDead?: true;
        allowInSpecificPage?: string;
        spamPreventionInMs?: number;
        restrictions?: KeyBindRestrictions;
        doNotAllowRebind?: boolean;
        delayedKeyDown?: {
            msToTrigger?: number;
        }
    }
}