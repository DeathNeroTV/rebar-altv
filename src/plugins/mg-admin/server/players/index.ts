import alt from 'alt-server';

import { AdminAction, PlayerStats } from '@Plugins/mg-admin/shared/interfaces.js';
import { ActionType, TeleportType } from '@Plugins/mg-admin/shared/enums.js';
import { AdminEvents } from '@Plugins/mg-admin/shared/events.js';
import { useRebar } from '@Server/index.js';

const Rebar = useRebar();

alt.onRpc(AdminEvents.toServer.request.player, (player: alt.Player) => {
    const players: PlayerStats[] = [];
    for (const p of alt.Player.all) {
        players.push({
            health: p.health,
            id: p.id,
            name: p.name,
            ping: p.ping,
            pos: { 
                x: player.pos.x, 
                y: player.pos.y, 
                z: player.pos.z 
            }
        });
    }
    return players;
});

alt.onClient(AdminEvents.toServer.action, async (admin: alt.Player, data: AdminAction) => {
    const notifyApi = await useRebar().useApi().getAsync('notify-api');

    const target = alt.Player.all.find(p => p.id === data.playerId);
    if (!target || !target.valid) return;

    const documentAcc = Rebar.document.account.useAccount(target);
    const documentChar = Rebar.document.character.useCharacter(target);

    switch (data.type) {
        case ActionType.KICK:
            target.kick(`Sie wurden von einem Teammitglied gebannt. Grund:  ${data.reason}`);
            break;
        case ActionType.BAN:
            if (!documentAcc.isValid()) return;
            await documentAcc.setBulk({ banned: true, reason: data.reason });
            target.kick(`Sie wurden von einem Teammitglied gebannt. Grund: ${data.reason}`);
            break;
        case ActionType.HEAL:
            target.health = 200;
            Rebar.player.useState(target).apply({ health: 200 });
            if (!documentChar.isValid()) return;
            await documentChar.setBulk({ health: 200, food: 100, water: 100 });
            break;
        case ActionType.TELEPORT:
            const radius = 5.0;
            const angle = Math.random() * Math.PI * 2; // zufällige Richtung
            const offsetX = Math.cos(angle) * radius;
            const offsetY = Math.sin(angle) * radius;
            if (data.teleportType === TeleportType.GO_TO) {
                admin.pos = new alt.Vector3(target.pos.x + offsetX, target.pos.y + offsetY, target.pos.z);
                notifyApi.general.send(admin, {
                    icon: notifyApi.general.getTypes().SUCCESS,
                    title: 'Admin-System',
                    subtitle: 'Teleportierung',
                    message: `📍 Du wurdest zu ${target.name} teleportiert.`,
                    oggFile: 'notification'
                });
            } else if (data.teleportType === TeleportType.GET_HERE) {
                target.pos = new alt.Vector3(admin.pos.x + offsetX, admin.pos.y + offsetY, admin.pos.z);
                notifyApi.general.send(admin, {
                    icon: notifyApi.general.getTypes().SUCCESS,
                    title: 'Admin-System',
                    subtitle: 'Teleportierung',
                    message: `📍 ${target.name} wurde zu dir teleportiert.`,
                    oggFile: 'notification'
                });
            }
            break;
        case ActionType.SPECTATE:
            break;
    }
});