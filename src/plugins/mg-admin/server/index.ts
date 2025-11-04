import * as alt from 'alt-server';
import { GuildMember } from 'discord.js';
import { useRebar } from '@Server/index.js';
import { getUserGuildMember } from '@Plugins/mg-discord-auth/server/requests.js';
import { NotificationTypes } from '@Plugins/mg-notify/shared/interface.js';
import { useTranslate } from '@Shared/translate.js';

import { AdminEvents } from '../shared/events.js';
import { AdminConfig } from '../shared/config.js';
import '../translate/index.js';

const { t }  = useTranslate(AdminConfig.language);
const Rebar = useRebar();
const notifyApi = await Rebar.useApi().getAsync('notify-api');

alt.onClient(AdminEvents.toServer.login, async (player: alt.Player) => {
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
    
    const permissions = document.permissions;
    const roles = Object.keys(AdminConfig.discordRoles).map(key => key);

    alt.log('Admin-Perms:', JSON.stringify(roles));
    alt.log('Char-Perms:', JSON.stringify(permissions.list()));

    if (!permissions.hasAnyOf(roles)) { 
        return notifyApi.general.send(player, {
            icon: NotificationTypes.ERROR,
            title: 'Admin-System',
            message: t('admin.panel.noRights'),
            oggFile: 'systemfault',
            duration: 5000,
        });
    }

    Rebar.player.useWebview(player).show('Admin', 'page');
});