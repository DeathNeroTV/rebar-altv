import * as alt from 'alt-server';
import { useRebar } from '@Server/index.js';
import { useTranslate } from '@Shared/translate.js';

import { NotificationTypes } from '@Plugins/mg-notify/shared/interface.js';
import { DiscordAuthConfig } from '@Plugins/mg-discord-auth/server/config.js';

import { AdminEvents } from '../shared/events.js';
import { AdminConfig } from '../shared/config.js';
import { DashboardStat, WhitelistRequest } from '../shared/interfaces.js';
import '../translate/index.js';

import * as os from 'os';
import * as disk from 'diskusage';

const { t }  = useTranslate(AdminConfig.language);
const Rebar = useRebar();
const db = Rebar.database.useDatabase();

const stats: DashboardStat[] = AdminConfig.useWhitelist ? AdminConfig.infos : AdminConfig.infos.filter(data => data.id !== 'whitelist');

alt.onClient(AdminEvents.toServer.login, async (player: alt.Player) => {    
    const notifyApi = await Rebar.useApi().getAsync('notify-api');
    const accDocument = Rebar.document.account.useAccount(player);
    if(!accDocument.isValid()) { 
        return notifyApi.general.send(player, {
            icon: NotificationTypes.ERROR,
            title: 'Admin-System',
            message: t('admin.panel.noAccount'),
            oggFile: 'systemfault',
            duration: 5000,
        });
    };

    const document = Rebar.document.character.useCharacter(player);

    if(!document.isValid()) {
        return notifyApi.general.send(player, {
            icon: NotificationTypes.ERROR,
            title: 'Admin-System',
            message: t('admin.panel.noCharacter'),
            oggFile: 'systemfault',
            duration: 5000,
        });
    }

    if (!isMemberOfAllowedGroups(player)) { 
        return notifyApi.general.send(player, {
            icon: NotificationTypes.ERROR,
            title: 'Admin-System',
            message: t('admin.panel.noRights'),
            oggFile: 'systemfault',
            duration: 5000,
        });
    }

    Rebar.player.useWebview(player).show('Admin', 'page');
    Rebar.player.useWorld(player).disableControls();
    Rebar.player.useWorld(player).freezeCamera(true);
});

alt.onClient(AdminEvents.toServer.logout, (player: alt.Player) => {
    Rebar.player.useWebview(player).hide('Admin');
    Rebar.player.useWorld(player).enableControls();
    Rebar.player.useWorld(player).freezeCamera(false);
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

alt.onRpc(AdminEvents.toServer.request.stats, async () => {
    if (AdminConfig.useWhitelist) {        
        const requests = await db.getAll('WhitelistRequests') ?? [];
        const whitelistIndex = stats.findIndex(data => data.id === 'whitelist');
        if (whitelistIndex !== -1) stats[whitelistIndex].value = requests.length;
    }

    const accounts = await db.getAll(Rebar.database.CollectionNames.Accounts) ?? [];
    const playerIndex = stats.findIndex(data => data.id === 'players');
    if (playerIndex !== -1) stats[playerIndex].value = accounts.length;

    const vehicles = await db.getAll(Rebar.database.CollectionNames.Vehicles) ?? [];
    const vehicleIndex = stats.findIndex(data => data.id === 'vehicles');
    if (vehicleIndex !== -1) stats[vehicleIndex].value = vehicles.length;
    
    return AdminConfig.useWhitelist ? stats : stats.filter(data => data.id !== 'whitelist');
});

alt.onRpc(AdminEvents.toServer.request.whitelist, async () => {
    const requests = await db.getAll<WhitelistRequest & { _id: string }>('WhitelistRequests') ?? []; 
    return requests;
});

alt.onRpc(AdminEvents.toServer.request.usage, async () => {
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const ramUsage = ((1 - freeMem / totalMem) * 100).toFixed(2);

    const cpuLoad = os.loadavg()[0] * 10;
    const cpuUsage = Math.min(Math.max(cpuLoad, 0), 100);

    const drivePath = os.platform() === 'win32' ? 'C:' : '/';

    let diskUsage = '0';
    try {
        const { available, total } = await disk.check(drivePath);
        diskUsage = ((1 - available / total) * 100).toFixed(2);
    } catch (err) {
        alt.logWarning(`[Admin] Fehler beim Abrufen der Festplattennutzung: ${err.message}`);
        diskUsage = '0';
    }

    return {
        cpuUsage: Number(cpuUsage),
        ramUsage: Number(ramUsage),
        diskUsage: Number(diskUsage),
    };
});

function isMemberOfAllowedGroups(player: alt.Player) {
    const document = Rebar.document.character.useCharacter(player);
    if (!document.isValid()) return false;

    for (const key in AdminConfig.discordRoles) {
        if (!document.groups.memberOf(key)) continue;
        return true;
    }

    return false;
}

function handleWhitelistRequest(player: alt.Player, request: WhitelistRequest) {
    if (!player || !player.valid) return;
    if (!isMemberOfAllowedGroups(player)) return;
    alt.emitAllClients(AdminEvents.toClient.whitelist.add, request);
}

async function init() {
    const discordAuthApi = await Rebar.useApi().getAsync('discord-auth-api');
    discordAuthApi.onWhitelistRequest(handleWhitelistRequest);
}

init();