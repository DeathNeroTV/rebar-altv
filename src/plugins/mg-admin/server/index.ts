import * as alt from 'alt-server';
import { useRebar } from '@Server/index.js';
import { useTranslate } from '@Shared/translate.js';

import { NotificationTypes } from '@Plugins/mg-notify/shared/interface.js';

import { AdminEvents } from '../shared/events.js';
import { AdminConfig } from '../shared/config.js';
import { DashboardStat, WhitelistRequest } from '../shared/interfaces.js';
import { handleNoClipRequest, handleNoClipToggle, isMemberOfAllowedGroups } from './functions.js';

import '../translate/index.js';
import './whitelist/index.js';
import './players/index.js';
import './items/index.js';

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
    Rebar.player.useWorld(player).disableCameraControls(true);
});

alt.onClient(AdminEvents.toServer.logout, (player: alt.Player) => {
    Rebar.player.useWebview(player).hide('Admin');
    Rebar.player.useWorld(player).enableControls();
    Rebar.player.useWorld(player).disableCameraControls(false);
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

    const items = await db.getAll('Items') ?? [];
    const itemIndex = stats.findIndex(data => data.id === 'items');
    if (itemIndex !== -1) stats[itemIndex].value = items.length;
    
    return AdminConfig.useWhitelist ? stats : stats.filter(data => data.id !== 'whitelist');
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

function handleWhitelistRequest(player: alt.Player, request: WhitelistRequest) {
    if (!player || !player.valid) return;
    if (!isMemberOfAllowedGroups(player)) return;
    alt.emitAllClients(AdminEvents.toClient.whitelist.add, request);
}

async function init() {
    const discordAuthApi = await Rebar.useApi().getAsync('discord-auth-api');
    discordAuthApi.onWhitelistRequest(handleWhitelistRequest);

    alt.onRpc(AdminEvents.toServer.ghosting.toggle, handleNoClipToggle);
    alt.onRpc(AdminEvents.toServer.ghosting.request, handleNoClipRequest);
}
init();