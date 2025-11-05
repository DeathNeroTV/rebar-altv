import * as alt from 'alt-server';
import { useRebar } from '@Server/index.js';
import { NotificationTypes } from '@Plugins/mg-notify/shared/interface.js';
import { useTranslate } from '@Shared/translate.js';

import { AdminEvents } from '../shared/events.js';
import { AdminConfig } from '../shared/config.js';
import '../translate/index.js';
import { CollectionNames } from '@Server/document/shared.js';

import * as os from 'os';
import * as disk from 'diskusage';
import * as path from 'path';
import { DashboardStat } from '../shared/interfaces.js';


const { t }  = useTranslate(AdminConfig.language);
const Rebar = useRebar();
const notifyApi = await Rebar.useApi().getAsync('notify-api');

const stats: DashboardStat[] = AdminConfig.infos;

alt.onClient(AdminEvents.toServer.login, (player: alt.Player) => {
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

alt.onRpc(AdminEvents.toServer.request.stats, async () => {
    const db = Rebar.database.useDatabase();
    const accounts = await db.getAll(CollectionNames.Accounts);
    const vehicles = await db.getAll(CollectionNames.Vehicles);
    
    const playerIndex = stats.findIndex(data => data.id === 'players');
    const vehicleIndex = stats.findIndex(data => data.id === 'vehicles');
    if (playerIndex !== -1) stats[playerIndex].value = accounts.length;
    if (vehicleIndex !== -1) stats[vehicleIndex].value = vehicles.length;
    return stats;
});

alt.onRpc(AdminEvents.toServer.request.whitelist, () => {
    return {};
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

    for (const key in AdminConfig.discordRoles) {
        if (!document.groups.memberOf(key)) continue;
        return true;
    }

    return false;
}