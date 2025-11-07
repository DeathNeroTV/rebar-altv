import { useTranslate } from "@Shared/translate.js";
import { DashboardStat } from "./interfaces.js";
import '../translate/index.js';

const { t } = useTranslate('de');

export const AdminConfig = {
    language: 'de',
    useWhitelist: true,
    infos: [
        { id: 'whitelist', title: t('admin.panel.dashboard.whitelist.title'), icon: 'id-card', value: 0 },
        { id: 'players', title: t('admin.panel.dashboard.players.title'), icon: 'users', value: 0 },
        { id: 'vehicles', title: t('admin.panel.dashboard.vehicles.title'), icon: 'car', value: 0 },
        { id: 'jobs', title: t('admin.panel.dashboard.jobs.title'), icon: 'briefcase', value: 0 },
        { id: 'doors', title: t('admin.panel.dashboard.doors.title'), icon: 'door-closed', value: 0 },
        { id: 'garages', title: t('admin.panel.dashboard.garages.title'), icon: 'car-tunnel', value: 0 },
        { id: 'shops', title: t('admin.panel.dashboard.shops.title'), icon: 'shop', value: 0 },
        { id: 'houses', title: t('admin.panel.dashboard.houses.title'), icon: 'house', value: 0 },
    ] as DashboardStat[],
    discordRoles: {
        owner: '1284164190008901765',
        admin: '1304085187927216240',
        moderator: '1304085950405677076',
        supporter: '1435181489515003937',
    },
};