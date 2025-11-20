import alt from 'alt-server';
import { useRebar } from '@Server/index.js';
import { Character, Account, Vehicle } from '@Shared/types/index.js';

import { PlayerLog, PlayerStats } from '../../shared/interfaces.js';
import { AdminEvents } from '../../shared/events.js';

const Rebar = useRebar();
const db = Rebar.database.useDatabase();
const notifyApi = await useRebar().useApi().getAsync('notify-api');

const CollectionNames = { ...Rebar.database.CollectionNames, ...{ Logs: 'Logs' } };

alt.onRpc(AdminEvents.toServer.request.player, (player: alt.Player) => {
    const players: PlayerStats[] = [];
    for (const p of alt.Player.all.filter(x => 
        !x.hasMeta('can-change-appearance') && 
        !x.hasMeta('can-select-character') && 
        !x.hasMeta('can-auth-account')&& 
        !x.hasMeta('can-see-intro')
    )) {
        const account_id = Rebar.document.account.useAccount(player)?.getField('_id') ?? undefined;
        players.push({
            health: p.health,
            account_id,
            id: p.id,
            name: p.name,
            ping: p.ping,
            armour: p.armour,
            pos: { 
                x: player.pos.x, 
                y: player.pos.y, 
                z: player.pos.z 
            },
            rot: { 
                x: player.rot.x, 
                y: player.rot.y, 
                z: player.rot.z 
            },
        });
    }
    return players;
});

alt.onRpc(AdminEvents.toServer.request.user.unban, async (player: alt.Player, _id: string) => {
    const account = await db.get<Account>({ _id }, CollectionNames.Accounts);
    if (!account) return null;

    delete account.banned;
    delete account.reason;
    const updated = await db.update<Account>(account, CollectionNames.Accounts);
    const icon = updated ? notifyApi.general.getTypes().SUCCESS: notifyApi.general.getTypes().ERROR;
    const oggFile = updated ? 'notification' : 'systemfault';
    const message = updated ? 'Der Spieler wurde entbannt' : 'Der ban wurde nicht gelöscht';
    notifyApi.general.send(player, {
        icon,
        title: 'Entbannungsauftrag',
        message,
        oggFile
    });
    return account;
});

alt.onRpc(AdminEvents.toServer.request.user.characters, async (player: alt.Player, _id: string) => {
    return await db.getMany<Character>({ account_id: _id }, CollectionNames.Characters);
});

alt.onRpc(AdminEvents.toServer.request.user.vehicles, async (player: alt.Player, _id: string) => {
    return await db.getMany<Vehicle>({ owner: _id }, CollectionNames.Vehicles);
});

alt.onRpc(AdminEvents.toServer.request.user.logs, async (player: alt.Player, _id: string) => {
    return await db.getMany<PlayerLog>({ character_id: _id }, CollectionNames.Logs);
});