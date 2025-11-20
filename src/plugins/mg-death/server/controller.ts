import * as alt from 'alt-server';
import { useRebar } from "@Server/index.js";
import { reachGoal } from './functions.js';

const Rebar =  useRebar();

export function useHelicopter(player: alt.Player, pilot: alt.Ped, helicopter: alt.Vehicle, pedCtrl: ReturnType<typeof Rebar.controllers.usePed>, natives: ReturnType<typeof Rebar.player.useNative>) {
    return {
        async getIn(maxAttempts: number) { 
            if (!pilot || !pilot.valid || !helicopter || !helicopter.valid) return; 
            for (let attempt = 0; attempt < maxAttempts; attempt++) { 
                const isInVehicle = await pedCtrl.invokeRpc('isPedInAnyVehicle', false); 
                if (isInVehicle) return; 
                pedCtrl.invoke('taskEnterVehicle', helicopter, 0, -1, 1.0, 1, undefined, 0); 
                await alt.Utils.wait(100); 
            } 
        }, 

        async takeoff(z: number) { 
            if (!pilot || !pilot.valid || !helicopter || !helicopter.valid) return; 
            pedCtrl.invoke('taskHeliMission', helicopter, 0, 0, helicopter.pos.x, helicopter.pos.y, z, 4, 15, 3, -1, z, 0, 20, 128); 
            await reachGoal({ ...helicopter.pos, z }, helicopter, 8); 
        }, 

        async climb(z: number) { 
            if (!pilot || !pilot.valid || !helicopter || !helicopter.valid) return; 
            pedCtrl.invoke('taskHeliMission', helicopter, 0, 0, helicopter.pos.x, helicopter.pos.y, z, 4, 12, 5, -1, z, 0, 20, 0); 
            await reachGoal({ ...helicopter.pos, z }, helicopter, 5); 
        },

        async cruise(x: number, y: number, z: number) { 
            if (!pilot || !pilot.valid || !helicopter || !helicopter.valid) return; 
            pedCtrl.invoke('taskHeliMission', helicopter, 0, 0, x, y, z, 4, 20, 5, -1, 400, z, 20, 0); 
            await reachGoal({ x, y, z }, helicopter, 8); 
        }, 

        async descend(x: number, y: number, z: number) { 
            if (!pilot || !pilot.valid || !helicopter || !helicopter.valid) return; 
            pedCtrl.invoke('taskHeliMission', helicopter, 0, 0, x, y, z, 19, 8, 5, -1, 400, z, 20, 0); 
            await reachGoal({ x, y, z }, helicopter, 5); 
        }, 

        async land(x: number, y: number, z: number) { 
            if (!pilot || !pilot.valid || !helicopter || !helicopter.valid) return; 
            pedCtrl.invoke('taskHeliMission', helicopter, 0, 0, x, y, z, 20, 5, 5, -1, 400, z, 20, 32); 
            await reachGoal({ x, y, z }, helicopter, 5); 
        }, 

        async getOut(maxAttempts: number) { 
            if (!pilot || !pilot.valid || !helicopter || !helicopter.valid) return; 
            for (let attempt = 0; attempt < maxAttempts; attempt++) { 
                const isPlayerInVehicle = await natives.invokeWithResult('isPedInAnyVehicle', player, false); 
                const isPedInVehicle = await pedCtrl.invokeRpc('isPedInAnyVehicle', false); 
                if (!isPedInVehicle && !isPlayerInVehicle) return; 
                if (isPedInVehicle) pedCtrl.invoke('taskLeaveVehicle', helicopter, 1); 
                if (isPlayerInVehicle) natives.invoke('taskLeaveVehicle', player, helicopter, 1); 
                await alt.Utils.wait(150); 
            } 
        }, 
    };
}