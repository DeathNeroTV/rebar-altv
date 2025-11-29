import * as alt from 'alt-server';
import { useRebar } from '@Server/index.js';
import { invokeAddZone } from '@Plugins/mg-target/server/api.js';
import { AdminEvents } from '@Plugins/mg-admin/shared/events.js';
import { TargetOption } from '@Plugins/mg-target/shared/interfaces.js';

const Rebar = useRebar();
const facilityLifts = [
    { 
        id: 'facility_lift_up',
        position: { x: 482.9407, y: 4812.6460, z: -58.3898 },
        radius: 20,
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
        radius: 20,
        options: [{ 
            label: 'Nach unten', 
            event: AdminEvents.toServer.teleport, 
            type: 'server', 
            icon: 'angles-down', 
            data: { teleportTo: { x: 482.9407, y: 4812.6460, z: -58.3898, heading: 0.0 }, vehicle: true } 
        }] as TargetOption[]
    },
]; 

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

    alt.onClient(AdminEvents.toServer.teleport, handleTeleportServer);
    facilityLifts.forEach(lift => invokeAddZone(lift.id, lift.position, lift.radius, lift.options));
}
init();