import * as alt from 'alt-server';
import { useRebar } from '@Server/index.js';
import { NotificationTypes } from '@Plugins/mg-notify/shared/interface.js';
import { useTranslate } from '@Shared/translate.js';

import { AdminEvents } from '../shared/events.js';
import { AdminConfig } from '../shared/config.js';
import '../translate/index.js';
import { CollectionNames } from '@Server/document/shared.js';

const { t }  = useTranslate(AdminConfig.language);
const Rebar = useRebar();
const notifyApi = await Rebar.useApi().getAsync('notify-api');

const stats = {
    whitelist: 0,
    accounts: 0,
    players: 0,
    vehicles: 0,
    jobs: 0,
};

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
    
    stats.players = accounts.length;
    stats.vehicles = vehicles.length;

    return stats;
});

alt.onRpc(AdminEvents.toServer.request.whitelist, () => {
    return {};
});

function isMemberOfAllowedGroups(player: alt.Player) {
    const document = Rebar.document.character.useCharacter(player);

    for (const key in AdminConfig.discordRoles) {
        if (!document.groups.memberOf(key)) continue;
        return true;
    }

    return false;
}