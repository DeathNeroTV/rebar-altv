import * as alt from 'alt-server';
import { useRebar } from '@Server/index.js';
import { AdminEvents } from '@Plugins/mg-admin/shared/events.js';
import { Item } from '@Shared/types/items.js';
import { useInventoryService } from '@Plugins/mg-inventory/server/itemService.js';

const Rebar = useRebar();
const db = Rebar.database.useDatabase(); 
const notifyApi = await Rebar.useApi().getAsync('notify-api');
const inventoryService = useInventoryService();

alt.onRpc(AdminEvents.toServer.request.items, async() => {
    const items = await db.getAll<Item & { _id: string }>('Items') ?? [];
    return items;
});

alt.onRpc(AdminEvents.toServer.item.save, async (player: alt.Player, item: Item) => {
    const document = await db.get<Item & { _id: string }>({ uid: item.uid }, 'Items');
    if (!document) {
        const success = await inventoryService.itemCreate(item);
        const icon = success ? notifyApi.general.getTypes().SUCCESS : notifyApi.general.getTypes().ERROR;
        const message = success ? 'Der Gegenstand wurde erstellt.' : 'Der Gegenstand wurde nicht erstellt.';
        const oggFile = success ? 'notification' : 'systemfault';
        notifyApi.general.send(player, { icon, title: 'Admin-System', subtitle: 'Item-Manager', message, oggFile });
        return success;
    }
    
    const success = await db.update<Item>(item, 'Items');
    const icon = success ? notifyApi.general.getTypes().SUCCESS : notifyApi.general.getTypes().ERROR;
    const message = success ? 'Der Gegenstand wurde erstellt.' : 'Der Gegenstand wurde nicht erstellt.';
    const oggFile = success ? 'notification' : 'systemfault';
    notifyApi.general.send(player, { icon, title: 'Admin-System', subtitle: 'Item-Manager', message, oggFile });
    return success;
});

alt.onRpc(AdminEvents.toServer.item.delete, async (player: alt.Player, id: number) => {
    const document = await db.get<Item & { _id: string }>({ id }, 'Items');
    if (!document) {
        notifyApi.general.send(player, { 
            icon: notifyApi.general.getTypes().ERROR, 
            title: 'Admin-System', 
            subtitle: 'Item-Manager', 
            message: 'Der Gegenstand wurde nicht gefunden', 
            oggFile: 'systemfault'
        });
        return false;
    }
    
    const success = await inventoryService.itemRemove(document.uid);
    const icon = success ? notifyApi.general.getTypes().SUCCESS : notifyApi.general.getTypes().ERROR;
    const message = success ? 'Der Gegenstand wurde gelöscht.' : 'Der Gegenstand wurde nicht gelöscht.';
    const oggFile = success ? 'notification' : 'systemfault';
    notifyApi.general.send(player, { icon, title: 'Admin-System', subtitle: 'Item-Manager', message, oggFile });
    return success;
});