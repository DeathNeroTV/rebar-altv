import * as alt from 'alt-server';
import { useRebar } from '@Server/index.js';
import { AdminEvents } from '@Plugins/mg-admin/shared/events.js';
import { Item } from '@Shared/types/items.js';

const Rebar = useRebar();
const db = Rebar.database.useDatabase(); 

alt.onRpc(AdminEvents.toServer.request.items, async() => {
    const items = await db.getAll<Item & { _id: string }>('Items') ?? [];
    return items;
});