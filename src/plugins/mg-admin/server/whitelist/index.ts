import * as alt from 'alt-server';
import { useRebar } from '@Server/index.js';
import { NotificationTypes } from '@Plugins/mg-notify/shared/interface.js';
import { DiscordAuthConfig } from '@Plugins/mg-discord-auth/server/config.js';

import { AdminEvents } from "../../shared/events.js";
import { WhitelistRequest } from '../../shared/interfaces.js';

const Rebar = useRebar();
const db = Rebar.database.useDatabase();

declare module '@Shared/types/account.js' {
    export interface Account {
        time: number;
    }
}

alt.onRpc(AdminEvents.toServer.request.whitelist, async() => {
    const requests = await db.getAll<WhitelistRequest & { _id: string }>('WhitelistRequests') ?? []; 
    return requests;
});

alt.onClient(AdminEvents.toServer.whitelist.approve, async (player: alt.Player, _id: string) => {
    const notifyApi = await Rebar.useApi().getAsync('notify-api');
    const entry: WhitelistRequest = await db.get<WhitelistRequest>({ _id }, 'WhitelistRequests');
    if (!entry) {
        notifyApi.general.send(player, {
            icon: NotificationTypes.ERROR,
            title: 'Admin-System',
            subtitle: 'Rollenvergabe',
            message: 'Der Whitelisteintrag ist nicht verfügbar',
            oggFile: 'systemfault',
        });   
        return;
    }

    entry.state = 'approved';
    await db.update<WhitelistRequest>(entry, 'WhitelistRequests');

    const discordApi = await Rebar.useApi().getAsync('discord-api');
    if (!discordApi) {
        alt.logError('[mg-admin]', 'discord-api not found');
        return;
    }
    const member = await discordApi.getDiscordMember(entry.discordId);

    if (!member) {
        notifyApi.general.send(player, {
            icon: NotificationTypes.ERROR,
            title: 'Admin-System',
            subtitle: 'Rollenvergabe',
            message: 'Der Spieler ist nicht auf dem Discord vorhanden.',
            oggFile: 'systemfault',
        });
        return;
    }

    if (member.roles.cache.has(DiscordAuthConfig.WHITELIST_ROLE_ID)) {
        notifyApi.general.send(player, {
            icon: NotificationTypes.INFO,
            title: 'Admin-System',
            subtitle: 'Rollenvergabe',
            message: 'Dem Spieler wurde bereits die Whitelist gegeben',
            oggFile: 'notification',
        });
        return;
    }
    
    await member.roles.add(DiscordAuthConfig.WHITELIST_ROLE_ID);
    alt.emitAllClients(AdminEvents.toClient.whitelist.update, entry);
    
    notifyApi.general.send(player, {
        icon: NotificationTypes.SUCCESS,
        title: 'Admin-System',
        subtitle: 'Rollenvergabe',
        message: 'Dem Spieler wurde die Whitelist gegeben',
        oggFile: 'notification',
    });
});

alt.onClient(AdminEvents.toServer.whitelist.reject, async (player: alt.Player, _id: string) => {
    const notifyApi = await Rebar.useApi().getAsync('notify-api');
    const entry: WhitelistRequest = await db.get<WhitelistRequest>({ _id }, 'WhitelistRequests');
    if (!entry) {
        notifyApi.general.send(player, {
            icon: NotificationTypes.ERROR,
            title: 'Admin-System',
            subtitle: 'Rollenentzug',
            message: 'Whitelisteintrag ist nicht verfügbar',
            oggFile: 'systemfault',
        });
        return;
    }

    entry.state = 'rejected';
    await db.update<WhitelistRequest>(entry, 'WhitelistRequests');

    const discordApi = await Rebar.useApi().getAsync('discord-api');
    if (!discordApi) {
        alt.logError('[mg-admin]', 'discord-api not found');
        return;
    }
    const member = await discordApi.getDiscordMember(entry.discordId);

    if (!member) {
        notifyApi.general.send(player, {
            icon: NotificationTypes.ERROR,
            title: 'Admin-System',
            subtitle: 'Rollenentzug',
            message: 'Der Spieler ist nicht auf dem Discord vorhanden.',
            oggFile: 'notification',
        });
        return;
    } 
    
    if (!member.roles.cache.has(DiscordAuthConfig.WHITELIST_ROLE_ID)) {
        notifyApi.general.send(player, {
            icon: NotificationTypes.INFO,
            title: 'Admin-System',
            subtitle: 'Rollenentzug',
            message: 'Dem Spieler wurde bereits die Whitelist entzogen',
            oggFile: 'notification',
        });
        return;
    }

    await member.roles.remove(DiscordAuthConfig.WHITELIST_ROLE_ID);
    alt.emitAllClients(AdminEvents.toClient.whitelist.update, entry);

    notifyApi.general.send(player, {
        icon: NotificationTypes.SUCCESS,
        title: 'Admin-System',
        subtitle: 'Rollenentzug',
        message: 'Dem Spieler wurde die Whitelist entzogen',
        oggFile: 'notification',
    });
});