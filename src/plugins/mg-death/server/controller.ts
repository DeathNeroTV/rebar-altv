import * as alt from 'alt-server';
import { useRebar } from "@Server/index.js";
import { reachGoal } from './functions.js';
import { HeliMission } from '../shared/interfaces.js';

const Rebar =  useRebar();

export function useHelicopter(player: alt.Player, pilot: alt.Ped, helicopter: alt.Vehicle, pedCtrl: ReturnType<typeof Rebar.controllers.usePed>, natives: ReturnType<typeof Rebar.player.useNative>) {
    return {
        async getIn(maxAttempts: number) { 
            if (!pilot || !pilot.valid || !helicopter || !helicopter.valid || !player || !player.valid) return false; 
            player.frozen = false; 
            player.clearTasks(); 
            await alt.Utils.wait(100);
            Rebar.player.useWorld(player).setScreenFade(0); 
            await alt.Utils.wait(500);
            player.setIntoVehicle(helicopter, 4); 
            await alt.Utils.wait(1000); 
            Rebar.player.useWorld(player).clearScreenFade(3000); 
            await alt.Utils.wait(1500);
            for (let attempt = 0; attempt < maxAttempts; attempt++) { 
                if (!pilot || !pilot.valid || !helicopter || !helicopter.valid || !player || !player.valid) return false; 
                const isInVehicle = await pedCtrl.invokeRpc('isPedInAnyVehicle', false); 
                if (isInVehicle) return true; 
                pedCtrl.invoke('taskEnterVehicle', helicopter, -1, -1, 1.0, 1, undefined, 0); 
                await alt.Utils.wait(100); 
            } 
            if (!pilot || !pilot.valid || !helicopter || !helicopter.valid || !player || !player.valid) return false; 
            pedCtrl.invoke('taskWarpPedIntoVehicle', helicopter, -1); 
            return true; 
        }, 

        async takeoff(z: number, mission: HeliMission) { 
            if (!pilot || !pilot.valid || !helicopter || !helicopter.valid) return false; 
            pedCtrl.invoke('taskHeliMission', helicopter, 0, 0, helicopter.pos.x, helicopter.pos.y, z, mission.missionType, mission.speed, mission.radius, mission.heading, mission.maxHeight, mission.minHeight, mission.slowDistance, mission.missionFlags); 
            await reachGoal({ ...helicopter.pos, z }, helicopter, mission.radius);  
            return true; 
        }, 

        async climb(z: number, mission: HeliMission) { 
            if (!pilot || !pilot.valid || !helicopter || !helicopter.valid) return false;
            pedCtrl.invoke('taskHeliMission', helicopter, 0, 0, helicopter.pos.x, helicopter.pos.y, z, mission.missionType, mission.speed, mission.radius, mission.heading, mission.maxHeight, mission.minHeight, mission.slowDistance, mission.missionFlags); 
            await reachGoal({ ...helicopter.pos, z }, helicopter, mission.radius); 
            return true; 
        },

        async cruise(x: number, y: number, z: number, mission: HeliMission) { 
            if (!pilot || !pilot.valid || !helicopter || !helicopter.valid) return false;
            pedCtrl.invoke('taskHeliMission', helicopter, 0, 0, x, y, z, mission.missionType, mission.speed, mission.radius, mission.heading, mission.maxHeight, mission.minHeight, mission.slowDistance, mission.missionFlags);
            await reachGoal({ x, y, z }, helicopter, mission.radius); 
            return true; 
        }, 

        async descend(x: number, y: number, z: number, mission: HeliMission) { 
            if (!pilot || !pilot.valid || !helicopter || !helicopter.valid) return false;
            alt.log('taskHeliMission -> descend');
            pedCtrl.invoke('taskHeliMission', helicopter, 0, 0, x, y, z, mission.missionType, mission.speed, mission.radius, mission.heading, mission.maxHeight, mission.minHeight, mission.slowDistance, mission.missionFlags); 
            await reachGoal({ x, y, z }, helicopter, mission.radius); 
            return true;
        }, 

        async land(x: number, y: number, z: number, mission: HeliMission) { 
            if (!pilot || !pilot.valid || !helicopter || !helicopter.valid) return false;
            alt.log('taskHeliMission -> land');
            pedCtrl.invoke('taskHeliMission', helicopter, 0, 0, x, y, z, mission.missionType, mission.speed, mission.radius, mission.heading, mission.maxHeight, mission.minHeight, mission.slowDistance, mission.missionFlags); 
            await reachGoal({ x, y, z }, helicopter, mission.radius); 
            return true; 
        }, 

        async getOut(maxAttempts: number) { 
            if (!pilot || !pilot.valid || !helicopter || !helicopter.valid || !player || !player.valid) return false;
            alt.log('taskHeliMission -> get out');
            for (let attempt = 0; attempt < maxAttempts; attempt++) { 
                if (!pilot || !pilot.valid || !helicopter || !helicopter.valid || !player || !player.valid) return false;
                const isPlayerInVehicle = await natives.invokeWithResult('isPedInAnyVehicle', player, false); 
                const isPedInVehicle = await pedCtrl.invokeRpc('isPedInAnyVehicle', false); 
                if (!isPedInVehicle && !isPlayerInVehicle) return true;
                if (isPedInVehicle) pedCtrl.invoke('taskLeaveVehicle', helicopter, 1); 
                if (isPlayerInVehicle) natives.invoke('taskLeaveVehicle', player, helicopter, 1); 
                await alt.Utils.wait(150); 
            } 
            if (!pilot || !pilot.valid || !helicopter || !helicopter.valid || !player || !player.valid) return false;
            return true; 
        }, 
    };
}