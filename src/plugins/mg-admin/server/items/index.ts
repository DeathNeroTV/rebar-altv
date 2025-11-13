import * as alt from 'alt-server';
import { useRebar } from '@Server/index.js';
import { AdminEvents } from '@Plugins/mg-admin/shared/events.js';
import { Item } from '@Shared/types/items.js';

const Rebar = useRebar();
const db = Rebar.database.useDatabase(); 
const notifyApi = await Rebar.useApi().getAsync('notify-api');

alt.onRpc(AdminEvents.toServer.request.items, async() => {
    const items = await db.getAll<Item & { _id: string }>('Items') ?? [];
    return items;
});

alt.onClient(AdminEvents.toServer.item.create, async (player: alt.Player, item: Item) => {
    const identifier = await Rebar.database.useIncrementalId('items');
    const id = await identifier.getNext();
    item.id = id;
    const _id = await db.create<Item>(item, 'Items');
});