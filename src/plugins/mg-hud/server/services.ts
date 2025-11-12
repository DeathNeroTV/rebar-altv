import * as alt from 'alt-server';
import { useServiceRegister } from "@Server/services/index.js";
import { useWebview } from '@Server/player/webview.js';
import { Character, Vehicle } from '@Shared/types/index.js';
import { HudEvents } from '../shared/events.js';
import { HudConfig } from '../shared/config.js';

export interface HudService {
    updatePlayer<K extends keyof Character>(player:alt.Player, key: K, value: Character[K]): Promise<void>;
    updateVehicle<K extends keyof Vehicle>(player:alt.Player, key: K, value: Vehicle[K]): Promise<void>;
    updateTime(player:alt.Player, hour: number, minute: number, second: number): Promise<void>;
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
    }
}

export function useHudService() {
    return {
        updatePlayer(...args: Parameters<HudService['updatePlayer']>) {
            if (!HudConfig.CharKeys.includes(args[1])) return;

            const service = useServiceRegister().get('hudService');
            if (service && service.updatePlayer) 
                service.updatePlayer(...args);

            if (useWebview(args[0]).isReady('Hud', 'overlay'))
                useWebview(args[0]).emit(HudEvents.toWebview.updatePlayer, { key: args[1], value: args[2] });
        },
        updateVehicle(...args: Parameters<HudService['updateVehicle']>) {
            if (!HudConfig.VehKeys.includes(args[1])) return;

            const service = useServiceRegister().get('hudService');
            if (service && service.updateVehicle) 
                service.updateVehicle(...args);
            
            if (useWebview(args[0]).isReady('Hud', 'overlay'))
                useWebview(args[0]).emit(HudEvents.toWebview.updateVehicle, { key: args[1], value: args[2] });
        },
        updateTime(...args: Parameters<HudService['updateTime']>) {
            const service = useServiceRegister().get('hudService');
            if (service && service.updateTime) 
                service.updateTime(...args);
            
            if (useWebview(args[0]).isReady('Hud', 'overlay'))
                useWebview(args[0]).emit(HudEvents.toWebview.syncTime, args[1], args[2], args[3]);
        }
    };
}