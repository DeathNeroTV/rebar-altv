import * as alt from 'alt-server';
import { GuildMember } from 'discord.js';
import { useRebar } from '@Server/index.js';
import { getUserGuildMember } from '@Plugins/mg-discord-auth/server/requests.js';
import { Notification, NotificationTypes } from '@Plugins/mg-notify/shared/interface.js';
import { useTranslate } from '@Shared/translate.js';

import { AdminEvents } from '../shared/events.js';
import { AdminConfig } from '../shared/config.js';
import '../translate/index.js';

const { t }  = useTranslate(AdminConfig.language);
const Rebar = useRebar();
const roles = AdminConfig.discordRoles;
const notifyApi = await Rebar.useApi().getAsync('notify-api');

alt.onClient(AdminEvents.toServer.login, async (player: alt.Player) => {
    const accDocument = Rebar.document.account.useAccount(player);
    if(!accDocument.isValid()) { 
        const notify: Notification = {
            icon: NotificationTypes.ERROR,
            title: 'Admin-System',
            message: t('admin.panel.noAccount'),
            oggFile: 'systemfault',
            duration: 5000,
        };
        notifyApi.general.send(player, notify);
        return;
    };

    const document = Rebar.document.character.useCharacter(player);
    if(!document.isValid()) {
        const notify: Notification = {
            icon: NotificationTypes.ERROR,
            message: t('admin.panel.noCharacter'),
            title: 'Admin-System',
            oggFile: 'systemfault',
            duration: 5000,
        };
        notifyApi.general.send(player, notify);
        return;
    }

    const discordId: string = accDocument.getField('discord');
    const member: GuildMember = await getUserGuildMember(discordId);
    if (!member) {
        const notify: Notification = {
            icon: NotificationTypes.ERROR,
            message: t('admin.panel.noMember'),
            title: 'Admin-System',
            oggFile: 'systemfault',
            duration: 5000,
        };
        notifyApi.general.send(player, notify);
        return;
    }

    const memberRoleIds = member.roles.cache.map(role => role.id);
    const assignedRoles: string[] = Object.keys(roles).filter(roleId => memberRoleIds.includes(roleId));

    if (!Rebar.permissions.usePermissions(player).character.permissions.hasAnyOf(assignedRoles)) { 
        const notify: Notification = {
            icon: NotificationTypes.ERROR,
            message: t('admin.panel.noRights'),
            title: 'Admin-System',
            oggFile: 'systemfault',
            duration: 5000,
        };
        notifyApi.general.send(player, notify);
        return;
    }

    Rebar.player.useWebview(player).show('Admin', 'page');
});