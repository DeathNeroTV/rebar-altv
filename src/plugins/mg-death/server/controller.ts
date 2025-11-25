import * as alt from 'alt-server';
import { usePed } from '@Server/controllers/ped.js';

import { monitorHeliMovement, reachGoal } from './functions.js';
import { HeliMission } from '../shared/interfaces.js';
import { MissionFlag } from '../shared/enums.js';
import { useNative } from '@Server/player/native.js';

export function useHelicopter(player: alt.Player, pilot: alt.Ped, helicopter: alt.Vehicle, pedCtrl: ReturnType<typeof usePed>, natives: ReturnType<typeof useNative>) {
    return {
        async getIn(maxAttempts: number = 15) { 
            if (!pilot || !pilot.valid || !helicopter || !helicopter.valid || !player || !player.valid) return false; 
            for (let attempt = 0; attempt < maxAttempts; attempt++) { 
                if (!pilot || !pilot.valid || !helicopter || !helicopter.valid || !player || !player.valid) return false; 
                const isInVehicle = await pedCtrl.invokeRpc('isPedInAnyVehicle', false); 
                if (isInVehicle) return true; 
                pedCtrl.invoke('taskEnterVehicle', helicopter, -1, -1, 1.0, 1, undefined, 0); 
                await alt.Utils.wait(150);
            } 
            if (!pilot || !pilot.valid || !helicopter || !helicopter.valid || !player || !player.valid) return false; 
            pedCtrl.invoke('taskWarpPedIntoVehicle', helicopter, -1); 
            return true; 
        }, 

        async takeoff(x: number, y: number, z: number, mission: HeliMission) {
            if (!pilot?.valid || !helicopter?.valid) return false;

            pedCtrl.invoke('taskHeliMission', helicopter, 0, 0, x, y, z,
                mission.missionType, mission.speed, mission.radius, mission.heading,
                mission.maxHeight, mission.minHeight, mission.slowDistance, mission.missionFlags
            );
            pedCtrl.invoke('setPedKeepTask', true);
            monitorHeliMovement(helicopter, mission, { x, y, z }, pedCtrl);
            await reachGoal({ x, y, z }, helicopter, mission.radius);
            return true;
        },

        async climb(x: number, y: number, z: number, mission: HeliMission) {
            if (!pilot?.valid || !helicopter?.valid) return false;

            pedCtrl.invoke('taskHeliMission', helicopter, 0, 0, x, y, z,
                mission.missionType, mission.speed, mission.radius, mission.heading,
                mission.maxHeight, mission.minHeight, mission.slowDistance, mission.missionFlags
            );
            pedCtrl.invoke('setPedKeepTask', true);
            monitorHeliMovement(helicopter, mission, { x, y, z }, pedCtrl);
            await reachGoal({ x, y, z }, helicopter, mission.radius);
            return true;
        },

        async circle(center: alt.IVector3, mission: HeliMission) {
            if (!pilot || !pilot.valid || !helicopter || !helicopter.valid) return false;

            const radius = mission.radius ?? 20;
            const speed = mission.speed ?? 10;
            const minHeight = mission.minHeight ?? center.z;
            const maxHeight = mission.maxHeight ?? center.z + 5;

            const stepCount = 36;
            const stepAngle = (2 * Math.PI) / stepCount;

            let step = 0;
            while (true) {
                if (!pilot || !pilot.valid || !helicopter || !helicopter.valid) return false;

                const angle = stepAngle * step;
                const targetX = center.x + radius * Math.cos(angle);
                const targetY = center.y + radius * Math.sin(angle);
                const targetZ = minHeight + (maxHeight - minHeight) * 0.5;

                pedCtrl.invoke(
                    'taskHeliMission',
                    helicopter,
                    0, 0,
                    targetX, targetY, targetZ,
                    mission.missionType,
                    speed,
                    5,
                    mission.heading ?? -1,
                    maxHeight,
                    minHeight,
                    mission.slowDistance ?? -1,
                    mission.missionFlags ?? MissionFlag.None
                );
                pedCtrl.invoke('setPedKeepTask', true);

                step = (step + 1) % stepCount;
                await alt.Utils.wait(500); // Zeit zwischen den einzelnen Wegpunkten
            }
        },

        async cruise(x: number, y: number, z: number, mission: HeliMission) { 
            if (!pilot || !pilot.valid || !helicopter || !helicopter.valid) return false;

            pedCtrl.invoke('taskHeliMission', helicopter, 0, 0, x, y, z, mission.missionType, mission.speed, mission.radius, mission.heading, mission.maxHeight, mission.minHeight, mission.slowDistance, mission.missionFlags);
            pedCtrl.invoke('setPedKeepTask', true);

            monitorHeliMovement(helicopter, mission, { x, y, z }, pedCtrl);

            await reachGoal({ x, y, z }, helicopter, mission.radius);            
            return true; 
        }, 

        async descend(x: number, y: number, z: number, mission: HeliMission) { 
            if (!pilot || !pilot.valid || !helicopter || !helicopter.valid) return false;
            pedCtrl.invoke('taskHeliMission', helicopter, 0, 0, x, y, z, mission.missionType, mission.speed, mission.radius, mission.heading, mission.maxHeight, mission.minHeight, mission.slowDistance, mission.missionFlags); 
            pedCtrl.invoke('setPedKeepTask', true);
            await reachGoal({ x, y, z }, helicopter, mission.radius); 
            return true;
        }, 

        async land(x: number, y: number, z: number, mission: HeliMission) { 
            if (!pilot || !pilot.valid || !helicopter || !helicopter.valid) return false;
            pedCtrl.invoke('taskHeliMission', helicopter, 0, 0, x, y, z, mission.missionType, mission.speed, mission.radius, mission.heading, mission.maxHeight, mission.minHeight, mission.slowDistance, mission.missionFlags); 
            pedCtrl.invoke('setPedKeepTask', true);
            await reachGoal({ x, y, z }, helicopter, mission.radius); 
            return true; 
        }, 

        async getOut(maxAttempts: number = 15) { 
            if (!pilot || !pilot.valid || !helicopter || !helicopter.valid || !player || !player.valid) return false;
            for (let attempt = 0; attempt < maxAttempts; attempt++) { 
                if (!pilot || !pilot.valid || !helicopter || !helicopter.valid || !player || !player.valid) return false;
                const isPedInVehicle = await pedCtrl.invokeRpc('isPedInAnyVehicle', false); 
                if (!isPedInVehicle) return true;
                pedCtrl.invoke('taskLeaveVehicle', helicopter, 1); 
                await alt.Utils.wait(150); 
            }
            return true; 
        }, 
    };
}