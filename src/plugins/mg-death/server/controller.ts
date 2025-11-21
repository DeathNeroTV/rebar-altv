import * as alt from 'alt-server';
import { useRebar } from "@Server/index.js";
import { reachGoal } from './functions.js';

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

        async takeoff(z: number) { 
            if (!pilot || !pilot.valid || !helicopter || !helicopter.valid) return false; 
            pedCtrl.invoke('taskHeliMission', helicopter, 0, 0, helicopter.pos.x, helicopter.pos.y, z, 4, 15, 3, -1, -1, -1, 20, 128); 
            await reachGoal({ ...helicopter.pos, z }, helicopter, 8);  
            return true; 
        }, 

        async climb(z: number) { 
            if (!pilot || !pilot.valid || !helicopter || !helicopter.valid) return false;
            pedCtrl.invoke('taskHeliMission', helicopter, 0, 0, helicopter.pos.x, helicopter.pos.y, z, 4, 12, 5, -1, -1, -1, 20, 0); 
            await reachGoal({ ...helicopter.pos, z }, helicopter, 5); 
            return true; 
        },

        async cruise(x: number, y: number, z: number) { 
            if (!pilot || !pilot.valid || !helicopter || !helicopter.valid) return false;
            pedCtrl.invoke('taskHeliMission', helicopter, 0, 0, x, y, z, 4, 50, 20, -1, -1, -1, 50, 0); 
            await reachGoal({ x, y, z }, helicopter, 50); 
            return true; 
        }, 

        async descend(x: number, y: number, z: number, radius: number) { 
            if (!pilot || !pilot.valid || !helicopter || !helicopter.valid) return false;
            alt.log('taskHeliMission -> descend');
            pedCtrl.invoke('taskHeliMission', helicopter, 0, 0, x, y, z, 19, 8, radius, -1, -1, -1, 20, 0); 
            await reachGoal({ x, y, z }, helicopter, radius); 
            return true;
        }, 

        async land(x: number, y: number, z: number) { 
            if (!pilot || !pilot.valid || !helicopter || !helicopter.valid) return false;
            pedCtrl.invoke('taskHeliMission', helicopter, 0, 0, x, y, z, 20, 5, 0, -1, -1, -1, 20, 32); 
            await reachGoal({ x, y, z }, helicopter, 1.5); 
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