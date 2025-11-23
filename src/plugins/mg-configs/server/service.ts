import { useServiceRegister } from '@Server/services/index.js';
import * as alt from 'alt-server';
import { DefaultConfig } from '../shared/interfaces.js';

export interface ConfigService {
    create: (name: string, data: Record<string, any>) => Promise<void>;
    change: <K extends keyof DefaultConfig>(_id: string, key: K, value: DefaultConfig[K] ) => Promise<boolean>;
}

declare module 'alt-server' {
    export interface ICustomEmitEvent {
        'mg-config:createdConfig': (...args: Parameters<ConfigService['create']>) => void;
        'mg-config:changedConfig': (...args: Parameters<ConfigService['change']>) => void;
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
            if (service && service.create) 
                await service.create(...args);
            alt.emit('mg-config:createdConfig', ...args);
        },

        async change(...args: Parameters<ConfigService['change']>) {
            const service = useServiceRegister().get('configService');
            if (!service || !service.change) return false;
            const result = await service.change(...args);
            if (result) alt.emit('mg-config:changedConfig', ...args);
            return result;
        }
    }
}