import * as alt from 'alt-server';
import { useServiceRegister } from "@Server/services/index.js";
import { Character, Vehicle } from '@Shared/types/index.js';

import { HudConfig } from '../shared/interfaces.js';

export interface HudService {
    updateConfig<K extends keyof HudConfig>(player:alt.Player, key: K, value: HudConfig[K]): Promise<void>;
    updatePlayer<K extends keyof Character>(player:alt.Player, key: K, value: Character[K]): void;
    updateVehicle<K extends keyof Vehicle>(player:alt.Player, key: K, value: Vehicle[K]): void;
    updateTime(player:alt.Player, hour: number, minute: number, second: number): void;
}

declare global {
    interface RebarServices {
        hudService: HudService;
    }
}

declare module 'alt-server' {
    export interface ICustomEmitEvent {
        'mg-hud:playerUpdated': (...args: Parameters<HudService['updatePlayer']>) => void;
        'mg-hud:vehicleUpdated': (...args: Parameters<HudService['updateVehicle']>) => void;
        'mg-hud:timeUpdated': (...args: Parameters<HudService['updateTime']>) => void;
        'mg-hud:configUpdated': (...args: Parameters<HudService['updateConfig']>) => void;
    }
}

export function useHudService() {
    return {
        async updateConfig(...args: Parameters<HudService['updateConfig']>) {
             const service = useServiceRegister().get('hudService');
            if (service && service.updateConfig) 
                service.updateConfig(...args);

            alt.emit('mg-hud:configUpdated', ...args);
        },        
        async updatePlayer(...args: Parameters<HudService['updatePlayer']>) {
            const service = useServiceRegister().get('hudService');
            if (service && service.updatePlayer) 
                service.updatePlayer(...args);

            alt.emit('mg-hud:playerUpdated', ...args);
        },
        async updateVehicle(...args: Parameters<HudService['updateVehicle']>) {
            const service = useServiceRegister().get('hudService');
            if (service && service.updateVehicle) 
                service.updateVehicle(...args);

            alt.emit('mg-hud:vehicleUpdated', ...args);
        },
        async updateTime(...args: Parameters<HudService['updateTime']>) {
            const service = useServiceRegister().get('hudService');
            if (service && service.updateTime) 
                service.updateTime(...args);

                alt.emit('mg-hud:timeUpdated', ...args);
        }
    };
}