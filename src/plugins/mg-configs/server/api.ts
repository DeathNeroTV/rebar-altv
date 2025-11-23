import * as alt from 'alt-server';
import { useRebar } from "@Server/index.js";
import { useConfigService } from './service.js';
import { DefaultConfig } from '../shared/interfaces.js';

const Rebar = useRebar();
const db = Rebar.database.useDatabase();
const API_NAME = 'mg-config-api';

export function useConfigApi() {

    async function onConfigCreate(name: string, data: Record<string, any>) {
        const _id = await db.create<DefaultConfig>({ name, data }, 'Configs');
        if (!_id) return;

        await useConfigService().create(name, data);
    }

    async function onConfigChange<K extends keyof DefaultConfig>(_id: string, key: K, value: DefaultConfig[K]) {
        return await useConfigService().change(_id, key, value);
    }
    
    return {
        onConfigCreate,
        onConfigChange
    }
}

declare global {
    export interface ServerPlugin {
        [API_NAME]: ReturnType<typeof useConfigApi>;
    }
}

Rebar.useApi().register(API_NAME, useConfigApi());