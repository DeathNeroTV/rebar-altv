import * as alt from 'alt-server';
import * as Utility from '@Shared/utility/index.js';
import { useNative } from '@Server/player/native.js';
import { usePed } from '@Server/controllers/ped.js';

import { DeathConfig } from '../shared/config.js';
import { useHelicopter } from './controller.js';
import { MissionFlag, MissionType } from '../shared/enums.js';
import { HeliMission } from '../shared/interfaces.js';

const getFreeHelipad = (name: string, radius: number = 5): { name: string; pos: alt.IVector3; rot: alt.IVector3; inUse: boolean } => {
    return DeathConfig.helipads.find((x) => x.name.includes(name) && isHelipadClear(x.pos, 5) && !x.inUse);
};

const isHelipadClear = (pos: alt.IVector3, radius: number) => {
    for (const entity of alt.Entity.all) {
        if (!entity || !entity.valid) continue;
        const dist = Utility.vector.distance(pos, entity.pos);
        if (dist <= radius) return false;
    }
    return true;
};

const setHelipadUsage = (name: string, value: boolean) => {
    const padIndex = DeathConfig.helipads.findIndex((x) => x.name === name);
    if (padIndex !== -1) DeathConfig.helipads[padIndex].inUse = value;
};

const reachGoal = async (pos: alt.IVector3, vehicle: alt.Vehicle, distance: number = 5) => {
    while (vehicle && vehicle.valid && vehicle.pos.distanceTo(pos) > distance) 
        await alt.Utils.wait(50);
    return;
};

const isLandingSafe = async (pos: alt.IVector3, model: string, natives: ReturnType<typeof useNative>, extraRadius: number, reservedSpots: alt.IVector3[]) => {
    const posZ = await getSafeGroundZ(pos.x, pos.y, pos.z, natives);
    const landingCenter = { ...pos, z: posZ + 1.5 };
    const [_, hMin, hMax] = await natives.invokeWithResult('getModelDimensions', alt.hash(model));
    const heliSize = new alt.Vector3(hMax).sub(new alt.Vector3(hMin));
    const heliRadius = heliSize.length / 2;

    for (const spot of reservedSpots) {
        if (Utility.vector.distance(landingCenter, spot) <= heliRadius + extraRadius) return false;
    }

    const start = { ...landingCenter, z: posZ };
    const end = { ...landingCenter , z: posZ + 300 };
    const hit = await natives.invokeWithResult('startShapeTestSweptSphere', start.x, start.y, start.z, end.x, end.y, end.z, heliRadius + extraRadius, 1 | 2 | 8 | 16 | 32 | 128 | 256, 0, 7);
    const [didHit] = await natives.invokeWithResult('getShapeTestResult', hit);

    return !didHit;
};

const findSafeLanding = async (center: alt.IVector3, model: string, natives: ReturnType<typeof useNative>, extraRadius: number = 5, step: number = 5, ringStep: number = 20, reservedSpots: alt.IVector3[] = []) => {
    if (await isLandingSafe(center, model, natives, extraRadius, reservedSpots)) return center;
    let radius = ringStep;
    while (true) {
        for (let dx = -radius; dx <= radius; dx += step) {
            for (let dy = -radius; dy <= radius; dy += step) {
                const distToRing = Math.abs(Math.sqrt(dx * dx + dy * dy) - radius);
                if (distToRing > step * 1.5) continue;

                const testPos = new alt.Vector3(center.x + dx, center.y + dy, center.z);
                if (await isLandingSafe(testPos, model, natives, extraRadius, reservedSpots)) return testPos;
            }
        }
        radius += ringStep;
        await new Promise(r => alt.nextTick(r));
    }
};

const getSafeGroundZ = async (x: number, y: number, z: number, natives: ReturnType<typeof useNative>) => {
    let groundZ = 0;
    const [found, ground] = await natives.invokeWithResult('getGroundZFor3dCoord', x, y, z, groundZ, false, false);
    if (!found) {
        let safeZ = z;
        for (let i = 0; i < 20; i++) {
            safeZ += 5;
            const [found2, rz] = await natives.invokeWithResult('getGroundZFor3dCoord', x, y, safeZ, groundZ, false, false);
            if (found2) return rz;
        }
        return z + 1.5;
    }
    return found && ground > 0 ? ground : z;
};

const circleUntilFree = async (flyCtrl: ReturnType<typeof useHelicopter>, hospitalName: string, hospitalPos: alt.IVector3, checkInterval: number = 3000) => {
    const mission: HeliMission = {
        missionType: MissionType.Circle,
        missionFlags: MissionFlag.CircleOppositeDirection,
        radius: 100,
        speed: 12,
        heading: -1,
        minHeight: hospitalPos.z + 60,
        maxHeight: hospitalPos.z + 70,
        slowDistance: -1,
    };

    let helipad = getFreeHelipad(hospitalName, 10);
    while (!helipad) {
        const success = flyCtrl.circle({ ...hospitalPos, z: hospitalPos.z + 65 }, mission);
        if (!success) return null;
        await alt.Utils.wait(checkInterval);
        helipad = getFreeHelipad(hospitalName, 10);
    }

    return helipad;
};

async function monitorHeliMovement(helicopter: alt.Vehicle, mission: HeliMission, target: alt.IVector3, pedCtrl: ReturnType<typeof usePed>) {
    let lastPos = helicopter.pos;
    let stuckTime = 0;
    const maxStuckDuration = 6000;
    const checkInterval = 1000;
    const minMovement = 3.0;
    const goalThreshold = Math.max(15, mission.radius * 1.5);

    while (true) {
        await new Promise(res => alt.setTimeout(res, checkInterval));
        if (!helicopter || !helicopter.valid || Utility.vector.distance(helicopter.pos, target) <= goalThreshold) return;
        const distToLast = Utility.vector.distance(helicopter.pos, lastPos);
        lastPos = helicopter.pos;

        if (distToLast < minMovement) stuckTime += checkInterval;
        else stuckTime = 0;

        if (stuckTime >= maxStuckDuration) {
            pedCtrl.invoke('taskHeliMission', helicopter, 0, 0, target.x, target.y, target.z, mission.missionType, mission.speed, mission.radius, mission.heading, mission.maxHeight, mission.minHeight, mission.slowDistance, mission.missionFlags);
            stuckTime = 0;
        }
    }            
}

async function isVerticalPathFree(pos: alt.IVector3, targetZ: number, heliRadius: number, natives: ReturnType<typeof useNative>): Promise<boolean> {
    const start = { ...pos, z: pos.z };
    const end = { ...pos, z: targetZ };
    const hit = await natives.invokeWithResult('startShapeTestSweptSphere', start.x, start.y, start.z, end.x, end.y, end.z, heliRadius, 1 | 2 | 8 | 16 | 32 | 128 | 256, 0, 7);
    const [didHit] = await natives.invokeWithResult('getShapeTestResult', hit);
    return !didHit;
}

async function findFreePos(startPos: alt.IVector3, model: string, targetZ: number, natives: ReturnType<typeof useNative>, maxAttempts = 10): Promise<alt.IVector3> {
    const [_, hMin, hMax] = await natives.invokeWithResult('getModelDimensions', alt.hash(model));
    const heliSize = new alt.Vector3(hMax).sub(new alt.Vector3(hMin));
    const heliRadius = heliSize.length / 2;

    let pos = { ...startPos };
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        const free = await isVerticalPathFree(pos, targetZ, heliRadius, natives);
        if (free) return pos;
        pos.x += (Math.random() - 0.5) * 5;
        pos.y += (Math.random() - 0.5) * 5;
    }

    return startPos;
}

export { 
    setHelipadUsage, isHelipadClear, getFreeHelipad, 
    getSafeGroundZ, findSafeLanding, isLandingSafe, 
    reachGoal, circleUntilFree, findFreePos, 
    monitorHeliMovement 
};
