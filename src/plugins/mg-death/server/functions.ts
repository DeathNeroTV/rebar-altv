import * as alt from 'alt-server';
import * as Utility from '@Shared/utility/index.js';
import { useNative } from '@Server/player/native.js';
import { usePed } from '@Server/controllers/ped.js';

import { DeathConfig } from '../shared/config.js';
import { useHelicopter } from './controller.js';
import { MissionFlag, MissionType } from '../shared/enums.js';
import { HeliMission } from '../shared/interfaces.js';

const getFreeHelipad = (name: string, radius: number = 10) =>
    DeathConfig.helipads.find(x => x.name.includes(name) && isHelipadClear(x.pos, radius) && !x.inUse);

const isHelipadClear = (pos: alt.IVector3, radius: number) => {
    for (const entity of alt.Entity.all) {
        if (!entity?.valid) continue;
        if (Utility.vector.distance(pos, entity.pos) <= radius) return false;
    }
    return true;
};

const setHelipadUsage = (name: string, value: boolean) => {
    const pad = DeathConfig.helipads.find(x => x.name === name);
    if (pad) pad.inUse = value;
};

const reachGoal = async (pos: alt.IVector3, vehicle: alt.Vehicle, distance: number = 5) => {
    while (vehicle?.valid && vehicle.pos.distanceTo(pos) > distance) await alt.Utils.wait(50);
};

const getSafeGroundZ = async (x: number, y: number, z: number, natives: ReturnType<typeof useNative>): Promise<number | null> => {
    let groundZ = 0;
    const [found, rz] = await natives.invokeWithResult('getGroundZFor3dCoord', x, y, z, groundZ, false, false);
    if (found) return rz;

    // Schrittweise höher suchen
    let probeZ = z;
    for (let i = 0; i < 20; i++) {
        probeZ += 5;
        const [found2, rz2] = await natives.invokeWithResult('getGroundZFor3dCoord', x, y, probeZ, groundZ, false, false);
        if (found2) return rz2;
    }
    return null;
};

const isLandingSafe = async (
    pos: alt.IVector3,
    model: string,
    natives: ReturnType<typeof useNative>,
    extraRadius: number
): Promise<boolean> => {

    const posZ = await getSafeGroundZ(pos.x, pos.y, pos.z, natives);
    if (posZ === null) return false;

    const landingCenter = { ...pos, z: posZ + 1.5 };
    const [_, min, max] = await natives.invokeWithResult('getModelDimensions', alt.hash(model));
    const size = new alt.Vector3(max).sub(new alt.Vector3(min));
    const radiusXY = Math.max(size.x, size.y) / 2;
    const heightZ = size.z;
    const mask = 1 | 2 | 8 | 16 | 32 | 128 | 256;

    // Quick-Check: Startpunkt in Geometrie?
    {
        const sZ = landingCenter.z - 0.1;
        const eZ = landingCenter.z + 0.1;
        const probe = await natives.invokeWithResult(
            'startShapeTestCapsule',
            landingCenter.x, landingCenter.y, sZ,
            landingCenter.x, landingCenter.y, eZ,
            Math.max(0.2, radiusXY * 0.5),
            mask, 0, 4
        );
        const [hit] = await natives.invokeWithResult('getShapeTestResult', probe);
        if (hit) return false;
    }

    // Sampling-Punkte prüfen (Body-Volumen)
    const offsets = [
        new alt.Vector3(0, 0, 0),
        new alt.Vector3(radiusXY, radiusXY, 0),
        new alt.Vector3(-radiusXY, radiusXY, 0),
        new alt.Vector3(radiusXY, -radiusXY, 0),
        new alt.Vector3(-radiusXY, -radiusXY, 0),
        new alt.Vector3(radiusXY, 0, 0),
        new alt.Vector3(-radiusXY, 0, 0),
        new alt.Vector3(0, radiusXY, 0),
        new alt.Vector3(0, -radiusXY, 0)
    ];

    const zStart = landingCenter.z - heightZ / 2;
    const zEnd = landingCenter.z + heightZ / 2;

    for (const off of offsets) {
        const s = { x: landingCenter.x + off.x, y: landingCenter.y + off.y, z: zStart };
        const e = { x: s.x, y: s.y, z: zEnd };
        const handle = await natives.invokeWithResult('startShapeTestCapsule', s.x, s.y, s.z, e.x, e.y, e.z, radiusXY + extraRadius, mask, 0, 4);
        const [hit] = await natives.invokeWithResult('getShapeTestResult', handle);
        if (hit) return false;
    }

    // Vertikale Clearance prüfen
    return await isVerticalPathFree(landingCenter, landingCenter.z + 300, radiusXY, natives, extraRadius);
};

const isVerticalPathFree = async (from: alt.IVector3, targetZ: number, radius: number, natives: ReturnType<typeof useNative>, extraRadius: number = 8): Promise<boolean> => {
    const r = radius + extraRadius;
    const mask = 1 | 2 | 8 | 16 | 32 | 128 | 256;

    const offsets = [
        new alt.Vector3(0, 0, 0),
        new alt.Vector3(r, r, 0),
        new alt.Vector3(-r, r, 0),
        new alt.Vector3(r, -r, 0),
        new alt.Vector3(-r, -r, 0),
        new alt.Vector3(r, 0, 0),
        new alt.Vector3(-r, 0, 0),
        new alt.Vector3(0, r, 0),
        new alt.Vector3(0, -r, 0)
    ];

    for (const off of offsets) {
        const s = { x: from.x + off.x, y: from.y + off.y, z: from.z };
        const e = { x: s.x, y: s.y, z: targetZ };
        const handle = await natives.invokeWithResult('startShapeTestCapsule', s.x, s.y, s.z, e.x, e.y, e.z, r, mask, 0, 4);
        const [hit] = await natives.invokeWithResult('getShapeTestResult', handle);
        if (hit) return false;
    }

    return true;
}

const findFreePosition = async (
    center: alt.IVector3,
    model: string,
    natives: ReturnType<typeof useNative>,
    reservedSpots: alt.IVector3[] = [],
    extraRadius: number = 5,
    step: number = 5,
    ringStep: number = 20,
    maxRings: number = 10
): Promise<alt.IVector3 | null> => {
    reservedSpots = Array.isArray(reservedSpots) ? reservedSpots : [];

    const [_, min, max] = await natives.invokeWithResult('getModelDimensions', alt.hash(model));
    const size = new alt.Vector3(max).sub(new alt.Vector3(min));
    const radiusXY = Math.max(size.x, size.y) / 2 + extraRadius;

    for (let ring = 0; ring <= maxRings; ring++) {
        const r = ring * ringStep;
        const candidates: alt.IVector3[] = [];

        for (let dx = -r; dx <= r; dx += step) {
            for (let dy = -r; dy <= r; dy += step) {
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (Math.abs(dist - r) > step * 1.5) continue;

                const testPos = { x: center.x + dx, y: center.y + dy, z: center.z };
                const collides = reservedSpots.some(spot => {
                    const d = Math.hypot(spot.x - testPos.x, spot.y - testPos.y);
                    return d < radiusXY;
                });
                if (collides) continue;

                candidates.push(testPos);
            }
        }

        // Parallel prüfen
        const results = await Promise.all(candidates.map(async pos => {
            const [found, groundZ] = await natives.invokeWithResult('getGroundZFor3dCoord', pos.x, pos.y, pos.z + 10, pos.z - 10, false, false);
            if (!found) return null;
            const foundPos = { ...pos, z: groundZ };
            if (await isLandingSafe(foundPos, model, natives, extraRadius)) return foundPos;
            return null;
        }));

        const valid = results.find(r => r !== null);
        if (valid) return valid;

        await new Promise(r => alt.nextTick(r));
    }

    return null;
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

const monitorHeliMovement = async (helicopter: alt.Vehicle, mission: HeliMission, target: alt.IVector3, pedCtrl: ReturnType<typeof usePed>) => {
    if (!helicopter?.valid) return;
    let lastPos = helicopter.pos;
    let stuckTime = 0;
    const maxStuckDuration = 6000;
    const checkInterval = 1000;
    const minMovement = 3.0;
    const goalThreshold = Math.max(15, mission.radius * 1.5);

    while (true) {
        await alt.Utils.wait(checkInterval);
        if (!helicopter?.valid || Utility.vector.distance(helicopter.pos, target) <= goalThreshold) return;
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

export {
    setHelipadUsage,
    isHelipadClear,
    getFreeHelipad,
    getSafeGroundZ,
    isLandingSafe,
    reachGoal,
    circleUntilFree,
    findFreePosition,
    monitorHeliMovement
};
