import * as alt from 'alt-server';
import { useRebar } from '@Server/index.js';
import { invokeAddZone } from '@Plugins/mg-target/server/api.js';
import { AdminEvents } from '@Plugins/mg-admin/shared/events.js';
import { TargetOption } from '@Plugins/mg-target/shared/interfaces.js';
import { useInventoryService } from '@Plugins/mg-inventory/server/itemService.js';
import { TlrpItem } from '@Plugins/mg-inventory/shared/interfaces.js';

const Rebar = useRebar();
const db = Rebar.database.useDatabase();
const notifyApi = await Rebar.useApi().getAsync('notify-api');
const facilityLifts = [
    { 
        id: 'facility_lift_up',
        position: { x: 482.9407, y: 4812.6460, z: -58.3898 },
        radius: 10,
        options: [{ 
            label: 'Nach oben', 
            event: AdminEvents.toServer.teleport, 
            type: 'server', 
            icon: 'angles-up', 
            data: { teleportTo: { x: 1874.1890, y: 284.0835, z: 164.2975, heading: 180.0 }, vehicle: true } 
        }] as TargetOption[]
    },
    { 
        id: 'facility_lift_down',
        position: { x: 1874.1890, y: 284.0835, z: 164.2975 },
        radius: 10,
        options: [{ 
            label: 'Nach unten', 
            event: AdminEvents.toServer.teleport, 
            type: 'server', 
            icon: 'angles-down', 
            data: { teleportTo: { x: 482.9407, y: 4812.6460, z: -58.3898, heading: 0.0 }, vehicle: true } 
        }] as TargetOption[]
    },
]; 

const facilityMenus = [
    { 
        id: 'support-1',
        position: { x: 344.0439, y: 4853.5649, z: -62.8103 },
        radius: 2,
        options: [
            { 
                label: 'Ausweis geben', 
                event: AdminEvents.toClient.give.license, 
                type: 'client', 
                icon: 'id_card', 
                data: { item: 'id_card', quantity: 1 }  
            },
            { 
                label: 'Waffenlizenz geben', 
                event: AdminEvents.toClient.give.license, 
                type: 'client', 
                icon: 'id-card', 
                data: { item: 'weapon_license', quantity: 1 } 
            },
            { 
                label: 'Führerschein geben', 
                event: AdminEvents.toClient.give.license, 
                type: 'client', 
                icon: 'id-card', 
                data: { item: 'driver_license', quantity: 1 } 
            },
        ] as TargetOption[]
    },
    { 
        id: 'support-2',
        position: { x: 346.8528, y: 4858.4702, z: -62.8103 },
        radius: 2,
        options: [
            { 
                label: 'Ausweis geben', 
                event: AdminEvents.toClient.give.license, 
                type: 'client', 
                icon: 'id_card', 
                data: { item: 'id_card', quantity: 1 }  
            },
            { 
                label: 'Waffenlizenz geben', 
                event: AdminEvents.toClient.give.license, 
                type: 'client', 
                icon: 'id-card', 
                data: { item: 'weapon_license', quantity: 1 } 
            },
            { 
                label: 'Führerschein geben', 
                event: AdminEvents.toClient.give.license, 
                type: 'client', 
                icon: 'id-card', 
                data: { item: 'driver_license', quantity: 1 } 
            },
        ] as TargetOption[]
    },
    { 
        id: 'support-3',
        position: { x: 355.2396, y: 4847.9736, z: -62.8103 },
        radius: 2,
        options: [
            { 
                label: 'Ausweis geben', 
                event: AdminEvents.toClient.give.license, 
                type: 'client', 
                icon: 'id_card', 
                data: { item: 'id_card', quantity: 1 }  
            },
            { 
                label: 'Waffenlizenz geben', 
                event: AdminEvents.toClient.give.license, 
                type: 'client', 
                icon: 'id-card', 
                data: { item: 'weapon_license', quantity: 1 } 
            },
            { 
                label: 'Führerschein geben', 
                event: AdminEvents.toClient.give.license, 
                type: 'client', 
                icon: 'id-card', 
                data: { item: 'driver_license', quantity: 1 } 
            },
        ] as TargetOption[]
    },
    { 
        id: 'support-4',
        position: { x: 357.5209, y: 4853.1958, z: -62.8103 },
        radius: 2,
        options: [
            { 
                label: 'Ausweis geben', 
                event: AdminEvents.toClient.give.license, 
                type: 'client', 
                icon: 'id_card', 
                data: { item: 'id_card', quantity: 1 }  
            },
            { 
                label: 'Waffenlizenz geben', 
                event: AdminEvents.toClient.give.license, 
                type: 'client', 
                icon: 'id-card', 
                data: { item: 'weapon_license', quantity: 1 } 
            },
            { 
                label: 'Führerschein geben', 
                event: AdminEvents.toClient.give.license, 
                type: 'client', 
                icon: 'id-card', 
                data: { item: 'driver_license', quantity: 1 } 
            },
        ] as TargetOption[]
    },
    { 
        id: 'support-5',
        position: { x: 380.1626, y: 4840.7075, z: -62.8103 },
        radius: 2,
        options: [
            { 
                label: 'Ausweis geben', 
                event: AdminEvents.toClient.give.license, 
                type: 'client', 
                icon: 'id_card', 
                data: { item: 'id_card', quantity: 1 }  
            },
            { 
                label: 'Waffenlizenz geben', 
                event: AdminEvents.toClient.give.license, 
                type: 'client', 
                icon: 'id-card', 
                data: { item: 'weapon_license', quantity: 1 } 
            },
            { 
                label: 'Führerschein geben', 
                event: AdminEvents.toClient.give.license, 
                type: 'client', 
                icon: 'id-card', 
                data: { item: 'driver_license', quantity: 1 } 
            },
        ] as TargetOption[]
    },
    { 
        id: 'support-6',
        position: { x: 380.9407, y: 4845.9824, z: -62.8103 },
        radius: 2,
        options: [
            { 
                label: 'Ausweis geben', 
                event: AdminEvents.toClient.give.license, 
                type: 'client', 
                icon: 'id_card', 
                data: { item: 'id_card', quantity: 1 }  
            },
            { 
                label: 'Waffenlizenz geben', 
                event: AdminEvents.toClient.give.license, 
                type: 'client', 
                icon: 'id-card', 
                data: { item: 'weapon_license', quantity: 1 } 
            },
            { 
                label: 'Führerschein geben', 
                event: AdminEvents.toClient.give.license, 
                type: 'client', 
                icon: 'id-card', 
                data: { item: 'driver_license', quantity: 1 } 
            },
        ] as TargetOption[]
    },
    { 
        id: 'support-7',
        position: { x: 391.6220, y: 4839.9297, z: -62.8103 },
        radius: 2,
        options: [
            { 
                label: 'Ausweis geben', 
                event: AdminEvents.toClient.give.license, 
                type: 'client', 
                icon: 'id_card', 
                data: { item: 'id_card', quantity: 1 }  
            },
            { 
                label: 'Waffenlizenz geben', 
                event: AdminEvents.toClient.give.license, 
                type: 'client', 
                icon: 'id-card', 
                data: { item: 'weapon_license', quantity: 1 } 
            },
            { 
                label: 'Führerschein geben', 
                event: AdminEvents.toClient.give.license, 
                type: 'client', 
                icon: 'id-card', 
                data: { item: 'driver_license', quantity: 1 } 
            },
        ] as TargetOption[]
    },
    { 
        id: 'support-8',
        position: { x: 391.5428, y: 4845.2573, z: -62.8103 },
        radius: 2,
        options: [
            { 
                label: 'Ausweis geben', 
                event: AdminEvents.toClient.give.license, 
                type: 'client', 
                icon: 'id_card', 
                data: { item: 'id_card', quantity: 1 }  
            },
            { 
                label: 'Waffenlizenz geben', 
                event: AdminEvents.toClient.give.license, 
                type: 'client', 
                icon: 'id-card', 
                data: { item: 'weapon_license', quantity: 1 } 
            },
            { 
                label: 'Führerschein geben', 
                event: AdminEvents.toClient.give.license, 
                type: 'client', 
                icon: 'id-card', 
                data: { item: 'driver_license', quantity: 1 } 
            },
        ] as TargetOption[]
    },
    { 
        id: 'support-9',
        position: { x: 400.7736, y: 4840.0088, z: -62.8103 },
        radius: 2,
        options: [
            { 
                label: 'Ausweis geben', 
                event: AdminEvents.toClient.give.license, 
                type: 'client', 
                icon: 'id_card', 
                data: { item: 'id_card', quantity: 1 }  
            },
            { 
                label: 'Waffenlizenz geben', 
                event: AdminEvents.toClient.give.license, 
                type: 'client', 
                icon: 'id-card', 
                data: { item: 'weapon_license', quantity: 1 } 
            },
            { 
                label: 'Führerschein geben', 
                event: AdminEvents.toClient.give.license, 
                type: 'client', 
                icon: 'id-card', 
                data: { item: 'driver_license', quantity: 1 } 
            },
        ] as TargetOption[]
    },
    { 
        id: 'support-10',
        position: { x: 400.5758, y: 4845.6396, z: -62.8103 },
        radius: 2,
        options: [
            { 
                label: 'Ausweis geben', 
                event: AdminEvents.toClient.give.license, 
                type: 'client', 
                icon: 'id_card', 
                data: { item: 'id_card', quantity: 1 }  
            },
            { 
                label: 'Waffenlizenz geben', 
                event: AdminEvents.toClient.give.license, 
                type: 'client', 
                icon: 'id-card', 
                data: { item: 'weapon_license', quantity: 1 } 
            },
            { 
                label: 'Führerschein geben', 
                event: AdminEvents.toClient.give.license, 
                type: 'client', 
                icon: 'id-card', 
                data: { item: 'driver_license', quantity: 1 } 
            },
        ] as TargetOption[]
    },
    { 
        id: 'support-11',
        position: { x: 410.5450, y: 4840.0088, z: -62.8103 },
        radius: 2,
        options: [
            { 
                label: 'Ausweis geben', 
                event: AdminEvents.toClient.give.license, 
                type: 'client', 
                icon: 'id_card', 
                data: { item: 'id_card', quantity: 1 }  
            },
            { 
                label: 'Waffenlizenz geben', 
                event: AdminEvents.toClient.give.license, 
                type: 'client', 
                icon: 'id-card', 
                data: { item: 'weapon_license', quantity: 1 } 
            },
            { 
                label: 'Führerschein geben', 
                event: AdminEvents.toClient.give.license, 
                type: 'client', 
                icon: 'id-card', 
                data: { item: 'driver_license', quantity: 1 } 
            },
        ] as TargetOption[]
    },
    { 
        id: 'support-12',
        position: { x: 410.1626, y: 4845.5078, z: -62.8103 },
        radius: 2,
        options: [
            { 
                label: 'Ausweis geben', 
                event: AdminEvents.toClient.give.license, 
                type: 'client', 
                icon: 'id_card', 
                data: { item: 'id_card', quantity: 1 }  
            },
            { 
                label: 'Waffenlizenz geben', 
                event: AdminEvents.toClient.give.license, 
                type: 'client', 
                icon: 'id-card', 
                data: { item: 'weapon_license', quantity: 1 } 
            },
            { 
                label: 'Führerschein geben', 
                event: AdminEvents.toClient.give.license, 
                type: 'client', 
                icon: 'id-card', 
                data: { item: 'driver_license', quantity: 1 } 
            },
        ] as TargetOption[]
    }
];

async function handleGiveLicense(player: alt.Player, target: alt.Player, data: { item: string; quantity: number }) {
    if (!player?.valid || !target?.valid) return;
    const charDocument = Rebar.document.character.useCharacter(target);

    if (!charDocument || !charDocument.isValid()) return;
    if (data.item === 'id_card') {
        const item = await db.get<TlrpItem>({uid: data.item }, 'Items');
        const [forName, surName] = charDocument.getField('name').split('_', 2);
        const success = await useInventoryService().add(target, data.item, data.quantity, { forName, surName });
        if (success) {
            notifyApi.general.send(target, {
                title: 'Stadtverwaltung',
                icon: notifyApi.general.getTypes().SUCCESS,
                message: `Sie haben 1x ${item.name} erhalten`,
            });            
            notifyApi.general.send(player, {
                title: 'Stadtverwaltung',
                icon: notifyApi.general.getTypes().SUCCESS,
                message: `Sie haben 1x ${item.name} vergeben`,
            });
        }
        return;
    }
    if (data.item === 'weapon_license') {
        const item = await db.get<TlrpItem>({uid: data.item }, 'Items');
        const [forName, surName] = charDocument.getField('name').split('_', 2);
        const success = await useInventoryService().add(target, data.item, data.quantity, { forName, surName, types: { classA: true, classB: true, classC: true } });
        if (success) {
            notifyApi.general.send(target, {
                title: 'Stadtverwaltung',
                icon: notifyApi.general.getTypes().SUCCESS,
                message: `Sie haben 1x ${item.name} erhalten`,
            });            
            notifyApi.general.send(player, {
                title: 'Stadtverwaltung',
                icon: notifyApi.general.getTypes().SUCCESS,
                message: `Sie haben 1x ${item.name} vergeben`,
            });
        }
        return;
    }
    if (data.item === 'driver_license') {
        const item = await db.get<TlrpItem>({uid: data.item }, 'Items');
        const [forName, surName] = charDocument.getField('name').split('_', 2);
        const success = await useInventoryService().add(target, data.item, data.quantity, { forName, surName, types: { pkw: true, motorcycle: true, lkw: true, plane: true, boat: true, helicopter: true } });
        if (success) {
            notifyApi.general.send(target, {
                title: 'Stadtverwaltung',
                icon: notifyApi.general.getTypes().SUCCESS,
                message: `Sie haben 1x ${item.name} erhalten`,
            });            
            notifyApi.general.send(player, {
                title: 'Stadtverwaltung',
                icon: notifyApi.general.getTypes().SUCCESS,
                message: `Sie haben 1x ${item.name} vergeben`,
            });
        }
        return;
    }
}

async function handleTeleportServer(player: alt.Player, data: { teleportTo: { x: number; y: number; z: number; heading: number }, vehicle: boolean }) {
    if (!player || !player.valid) return;
    
    const playerWorld = Rebar.player.useWorld(player);
    const playerNatives = Rebar.player.useNative(player);
    playerWorld.setScreenFade(500);
    await alt.Utils.wait(500);

    if (player.vehicle?.valid && data.vehicle) {
        player.vehicle.frozen = true;
        player.vehicle.pos = new alt.Vector3(data.teleportTo.x, data.teleportTo.y, data.teleportTo.z);
        player.vehicle.rot = new alt.Vector3(0, 0, degToRadians(data.teleportTo.heading));
        await alt.Utils.wait(500);
        playerWorld.clearScreenFade(500);
        player.vehicle.frozen = false;
        playerNatives.invoke('placeObjectOnGroundProperly', player.vehicle);
    } else {
        player.frozen = true;
        player.pos = new alt.Vector3(data.teleportTo.x, data.teleportTo.y, data.teleportTo.z);
        player.rot = new alt.Vector3(0, 0, degToRadians(data.teleportTo.heading));
        await alt.Utils.wait(500);
        playerWorld.clearScreenFade(500);
        player.frozen = false;
        playerNatives.invoke('placeObjectOnGroundProperly', player);
    }
}

function degToRadians(degrees: number): number {
    return (degrees * Math.PI) / 180;
}

async function init() {
    const targetApi = await Rebar.useApi().getAsync('mg-target-api');
    if (!targetApi) {
        alt.logError('[mg-admin]', 'mg-target-api not found');
        return;
    }

    alt.onClient(AdminEvents.toServer.give.license, handleGiveLicense);
    alt.onClient(AdminEvents.toServer.teleport, handleTeleportServer);
    facilityLifts.forEach(lift => invokeAddZone(lift.id, lift.position, lift.radius, lift.options));
    facilityMenus.forEach(menu => invokeAddZone(menu.id, menu.position, menu.radius, menu.options));
}
init();