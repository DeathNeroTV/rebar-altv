import * as alt from 'alt-server';
import { useRebar } from '@Server/index.js';
import { DefaultConfig } from '../shared/interfaces.js';

const Rebar = useRebar();
const db = Rebar.database.useDatabase();

Rebar.services.useServiceRegister().register('configService', {
    async change(_id, key, value) {
        const cfg = await db.get<DefaultConfig>({ _id }, 'Configs');
        if (!cfg) return false;
        if (key === 'name' || key === '_id') return false;

        cfg.data[key] = value;
        const success = await db.update<DefaultConfig>(cfg, 'Configs');
        return success;
    },
    async create(name, data) {
        const cfg = await db.get<DefaultConfig>({ name }, 'Configs');
        if (cfg) return cfg._id;
        const _id = await db.create<DefaultConfig>({ name, data }, 'Configs');
        return _id.toString();
    },
    async get(_id) {
        return await db.get<DefaultConfig>({ _id }, 'Configs');
    },
});