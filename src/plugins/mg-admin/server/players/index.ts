import alt from 'alt-server';
import { useRebar } from '@Server/index.js';
import { useMedicalService } from '@Plugins/mg-death/server/services.js';
import { useInventoryService } from '@Plugins/mg-inventory/server/itemService.js';

import { AdminAction } from '../../shared/interfaces.js';
import { ActionType, GiveType, TeleportType } from '../../shared/enums.js';
import { AdminEvents } from '../../shared/events.js';
import { AdminConfig } from '../../shared/config.js';

import './rpcEvents.js';

const Rebar = useRebar();
const medicalService = useMedicalService();
const notifyApi = await useRebar().useApi().getAsync('notify-api');

alt.onClient(AdminEvents.toServer.request.user.create.character, (player: alt.Player, account_id: string, name: string) => {});

alt.onClient(AdminEvents.toServer.request.user.create.vehicle, (player: alt.Player, character_id: string, name: string) => {});

alt.onClient(AdminEvents.toServer.action, async (admin: alt.Player, data: AdminAction) => {
    const target = alt.Player.all.find(p => p.id === data.playerId);
    if (!target || !target.valid) return;
    const vehicle = target.vehicle ?? undefined;

    const documentAcc = Rebar.document.account.useAccount(target);
    const documentChar = Rebar.document.character.useCharacter(target);
    const name = alt.getVehicleModelInfoByHash(vehicle?.model).title ?? documentChar?.getField('name').replaceAll('_', ' ') ?? target.name;
    const reason = AdminConfig.kickAndBanReasons.find(x => x.value === data.reason)?.label ?? data.reason;

    switch (data.type) {
        case ActionType.KILL:
            if (target.id === admin.id) {
                Rebar.player.useWebview(admin).hide('Admin');
                Rebar.player.useWorld(admin).enableControls();
                Rebar.player.useWorld(admin).disableCameraControls(false);
            }
            await useMedicalService().unconscious(target);
            notifyApi.general.send(admin, {
                title: 'Admin-System',
                icon: notifyApi.general.getTypes().INFO,
                message: `${name} wurde getötet`,
                oggFile: 'notification'
            });
            break;
        case ActionType.KICK:
            target.kick(`Sie wurden von einem Teammitglied gekickt. Grund:  ${reason}`);
            notifyApi.general.send(admin, {
                title: 'Admin-System',
                subtitle: `${name} wurde gekickt`,
                icon: notifyApi.general.getTypes().INFO,
                message: reason,
                oggFile: 'notification'
            });
            break;
        case ActionType.BAN:
            if (!documentAcc.isValid()) return;
            await documentAcc.setBulk({ banned: true, reason });
            target.kick(`Sie wurden von einem Teammitglied gebannt. Grund: ${reason}`);
            notifyApi.general.send(admin, {
                title: 'Admin-System',
                subtitle: `${name} wurde gebannt`,
                icon: notifyApi.general.getTypes().INFO,
                message: reason,
                oggFile: 'notification'
            });
            break;
        case ActionType.HEAL:
            if (documentChar.getField('isDead')) 
                medicalService?.respawn(target, target.pos);
            
            await documentChar.setBulk({ food: 100, water: 100, health: 200 });
            
            notifyApi.general.send(admin, {
                icon: notifyApi.general.getTypes().SUCCESS,
                title: 'Admin-System',
                subtitle: 'Medizinisch',
                message: `${target.name} wurde geheilt.`,
                oggFile: 'notification'
            });
            break;
        case ActionType.TELEPORT:
            switch(data.teleportType) {
                case TeleportType.GET_HERE:
                case TeleportType.GO_TO:
                    const radius = 3.0;
                    const angle = Math.random() * Math.PI * 2; // zufällige Richtung
                    const offsetX = Math.cos(angle) * radius;
                    const offsetY = Math.sin(angle) * radius;
                    if (data.teleportType === TeleportType.GO_TO) {
                        admin.pos = new alt.Vector3(target.pos.x + offsetX, target.pos.y + offsetY, target.pos.z);
                        admin.dimension = target.dimension;
                        notifyApi.general.send(admin, {
                            icon: notifyApi.general.getTypes().SUCCESS,
                            title: 'Admin-System',
                            subtitle: 'Teleportierung',
                            message: `📍 Du wurdest zu ${target.name} teleportiert.`,
                            oggFile: 'notification'
                        });
                    } else if (data.teleportType === TeleportType.GET_HERE) {
                        target.pos = new alt.Vector3(admin.pos.x + offsetX, admin.pos.y + offsetY, admin.pos.z);
                        target.dimension = admin.dimension;
                        notifyApi.general.send(admin, {
                            icon: notifyApi.general.getTypes().SUCCESS,
                            title: 'Admin-System',
                            subtitle: 'Teleportierung',
                            message: `📍 ${target.name} wurde zu dir teleportiert.`,
                            oggFile: 'notification'
                        });
                    }
                    break;
                case TeleportType.COORDS:
                    if (!data.coords) return;
                    const coords = new alt.Vector3(data.coords);
                    admin.pos = coords; 
                    notifyApi.general.send(admin, {
                        icon: notifyApi.general.getTypes().SUCCESS,
                        title: 'Admin-System',
                        subtitle: 'Teleportierung',
                        message: `📍 Du wurdest zu den Koordinaten teleportiert.`,
                        oggFile: 'notification'
                    });
                    break;
                case TeleportType.WAYPOINT:
                    const waypoint: alt.Vector3 = await admin.emitRpc(AdminEvents.toClient.waypoint);
                    if (!waypoint) return;
                    const natives = Rebar.player.useNative(admin);
                    let foundZ = false;
                    let groundZ = waypoint.z;
                    let checkZ = waypoint.z + 1000;
                    const step = 5; // Schrittweite runter
                    const maxAttempts = 200; // maximale Versuche, um Endlosschleife zu vermeiden
                    let attempts = 0;
                    while (!foundZ && attempts < maxAttempts) {
                        const [found, ground] = await natives.invokeWithResult('getGroundZFor3dCoord', waypoint.x, waypoint.y, checkZ, checkZ, false, false);
                        foundZ = found;
                        if (foundZ) groundZ = ground + 1;
                        else checkZ -= step;
                        attempts++;
                    }
                    if (!foundZ) groundZ = waypoint.z;

                    admin.pos = new alt.Vector3({ x: waypoint.x, y: waypoint.y, z: groundZ });
                    notifyApi.general.send(admin, {
                        icon: notifyApi.general.getTypes().SUCCESS,
                        title: 'Admin-System',
                        subtitle: 'Teleportierung',
                        message: `📍 Du wurdest zum Wegpunkt teleportiert.`,
                        oggFile: 'notification'
                    });
                    break;
            }
            break;
        case ActionType.SPECTATE:
            const world = Rebar.player.useWorld(admin);
            admin.collision = !admin.collision;
            admin.visible = !admin.visible;
            admin.invincible = !admin.invincible;
            world.disableAttackControls(admin.collision);
            
            if (admin.visible) admin.detach();
            else admin.attachTo(target, 0, 0, new alt.Vector3(0), new alt.Vector3(0), false, true);
            break;
        case ActionType.GIVE:
            await handleGiveAction(target, data.giveType, data.itemId!, data.amount);
            break;
        case ActionType.TAKE:
            await handleTakeAction(target, data.giveType, data.itemId!, data.amount);
            break;
        case ActionType.FREEZE:
            if (vehicle) vehicle.frozen = !vehicle.frozen;
            else target.frozen = !target.frozen;
            notifyApi.general.send(admin, {
                title: 'Admin-System',
                subtitle: `${target.frozen ? 'Eingefroren' : 'Aufgetaut'}`,
                icon: notifyApi.general.getTypes().INFO,
                message: name,
                oggFile: 'notification'
            });
            break;
    }
});

async function handleGiveAction(player: alt.Player, type: GiveType, id: string, amount: number) {
    if (type === GiveType.ITEM || type === GiveType.WEAPON) {
        const success = await useInventoryService().add(player, id, amount);
        if (!success) return;

        notifyApi.general.send(player, {
            title: 'Admin-System',
            subtitle: 'Gegeben',
            icon: notifyApi.general.getTypes().INFO,
            message: `${Math.abs(amount)} x ${id} erhalten`,
            oggFile: 'notification',
        });
        return;
    }

    const success = await Rebar.services.useCurrencyService().add(player, type, amount);
    if (!success) return;

    notifyApi.general.send(player, {
        title: 'Admin-System',
        subtitle: 'Gegeben',
        icon: notifyApi.general.getTypes().INFO,
        message: `Sie haben $ ${amount} erhalten (${GiveType.BANK ? 'Bankkonto' : 'Bargeld'})`,
        oggFile: 'notification',
    });
}

async function handleTakeAction(player: alt.Player, type: GiveType, id: string, amount: number) {
    if (type === GiveType.ITEM || type === GiveType.WEAPON) {
        const success = await useInventoryService().sub(player, id, amount);
        if (!success) return;

        notifyApi.general.send(player, {
            title: 'Admin-System',
            subtitle: 'Abgenommen',
            icon: notifyApi.general.getTypes().INFO,
            message: `${Math.abs(amount)} x ${id} abgenommen`,
            oggFile: 'notification',
        });
        return;
    }

    const success = await Rebar.services.useCurrencyService().sub(player, type, amount);
    if (!success) return;

    notifyApi.general.send(player, {
        title: 'Admin-System',
        subtitle: 'Gegeben',
        icon: notifyApi.general.getTypes().INFO,
        message: `Es wurden Ihnen $ ${amount} abgenommen (${GiveType.BANK ? 'Bankkonto' : 'Bargeld'})`,
        oggFile: 'notification',
    });
}