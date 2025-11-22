import alt from 'alt-server';
import { useRebar } from '@Server/index.js';
import { Character, Account, Vehicle } from '@Shared/types/index.js';

import { PlayerLog, PlayerStats } from '../../shared/interfaces.js';
import { AdminEvents } from '../../shared/events.js';

const Rebar = useRebar();
const db = Rebar.database.useDatabase();
const notifyApi = await useRebar().useApi().getAsync('notify-api');

const CollectionNames = { ...Rebar.database.CollectionNames, ...{ Logs: 'Logs' } };

alt.onRpc(AdminEvents.toServer.request.player, async (player: alt.Player) => {
    const players: PlayerStats[] = [];
    const accounts = await db.getAll<Account>(CollectionNames.Accounts);
    const filteredPlayers = alt.Player.all.filter(x => !x.hasMeta('can-change-appearance') && !x.hasMeta('can-select-character') && !x.hasMeta('can-auth-account')&& !x.hasMeta('can-see-intro'));
    for (const acc of accounts) {
        const target = filteredPlayers.find(x => Rebar.document.account.useAccount(x).isValid() && Rebar.document.account.useAccount(x).getField('_id') === acc._id);
        if (target) players.push({ 
            id: target.id, 
            account_id: 
            acc._id, 
            name: target.name, 
            ping: target.ping, 
            health: target.health, 
            armour: target.armour, 
            pos: { x: target.pos.x, y: target.pos.y, z: target.pos.z }, 
            rot: { x: target.rot.x, y: target.rot.y, z: target.rot.z } 
        });
        else players.push({ account_id: acc._id, id: acc.id, name: acc.username });
    }
    return players;
});

alt.onRpc(AdminEvents.toServer.request.user.account, async (player: alt.Player, _id: string) => {
    return await db.get<Account>({ _id }, CollectionNames.Accounts);
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