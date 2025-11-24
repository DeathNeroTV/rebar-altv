import { useServiceRegister } from '@Server/services/index.js';
import * as alt from 'alt-server';
import { DefaultConfig } from '../shared/interfaces.js';

export interface ConfigService {
    create: (name: string, data: Record<string, any>) => Promise<string>;
    change: <K extends keyof DefaultConfig>(_id: string, key: K, value: DefaultConfig[K]) => Promise<boolean>;
    get: (_id: string) => Promise<DefaultConfig>;
}

declare module 'alt-server' {
    export interface ICustomEmitEvent {
        'mg-config:createdConfig': (_id: string) => void;
        'mg-config:changedConfig': (changed: boolean, ...args: Parameters<ConfigService['change']>) => void;
    }
}

declare global {
    interface RebarServices {
        configService: ConfigService;
    }
}

export function useConfigService() : ConfigService {
    return {
        async create(...args: Parameters<ConfigService['create']>) {
            const service = useServiceRegister().get('configService');
            const result = await service.create(...args);
            alt.emit('mg-config:createdConfig', result);
            return result;
        },

        async change(...args: Parameters<ConfigService['change']>) {
            const service = useServiceRegister().get('configService');
            if (!service || !service.change) return false;
            const result = await service.change(...args);
            alt.emit('mg-config:changedConfig', result, ...args);
            return result;
        },

        async get(...args: Parameters<ConfigService['get']>) {
            const service = useServiceRegister().get('configService');
            return await service.get(...args);
        }
    }
}