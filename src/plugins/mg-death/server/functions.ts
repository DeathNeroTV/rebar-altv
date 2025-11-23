import * as alt from 'alt-server';
import { useRebar } from '@Server/index.js';
import * as Utility from '@Shared/utility/index.js';

import { DeathConfig } from '../shared/config.js';
import { useHelicopter } from './controller.js';
import { MissionFlag, MissionType } from '../shared/enums.js';
import { HeliMission } from '../shared/interfaces.js';

const Rebar = useRebar();

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
    while (vehicle && vehicle.valid && vehicle.pos.distanceTo(pos) > distance) await alt.Utils.wait(100);
};

const isLandingSafe = async (pos: alt.IVector3, extraRadius: number, natives: ReturnType<typeof Rebar.player.useNative>) => {
    const posZ = await getSafeGroundZ(pos.x, pos.y, pos.z, natives);
    const landingCenter = { ...pos, z: posZ + 1.5 };
    const [_, hMin, hMax] = await natives.invokeWithResult('getModelDimensions', alt.hash('polmav'));
    const heliSize = new alt.Vector3(hMax - hMin);
    const heliRadius = heliSize.length / 2;
 
    for (const entity of alt.Entity.all) {
        if (!entity.valid) continue;
        const entityPos = entity.pos;
        const [__, eMin, eMax] = await natives.invokeWithResult('getModelDimensions', entity.model);
        if (!eMin || !eMax) continue;
        const eSize = new alt.Vector3(eMax - eMin);
        const eRadius = eSize.length / 2;

        const dist = Utility.vector.distance(landingCenter, { ...entityPos, z: posZ });
        if (dist <= eRadius + heliRadius + extraRadius) return false;
    }
    return true;
};

const findSafeLanding = async (center: alt.IVector3, natives: ReturnType<typeof Rebar.player.useNative>, step: number = 5, ringStep: number = 20) => {
    if (await isLandingSafe(center, 5, natives)) return center;
    let radius = 0;
    while (true) {
        radius += ringStep;
        for (let dx = -radius; dx <= radius; dx += step) {
            for (let dy = -radius; dy <= radius; dy += step) {
                const distToRing = Math.abs(Math.sqrt(dx * dx + dy * dy) - radius);
                if (distToRing > step * 1.5) continue;

                const testPos = new alt.Vector3(center.x + dx, center.y + dy, center.z);
                if (await isLandingSafe(testPos, 5, natives)) return testPos;
            }
        }
        await new Promise(r => alt.nextTick(r));
    }
};

const ensureValidation = async (ped: alt.Ped, vehicle: alt.Vehicle, natives: ReturnType<typeof Rebar.player.useNative>, maxAttempts: number = 10, delay: number = 500) => {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        if (ped && ped.valid && vehicle && vehicle.valid) {
            natives.invoke('placeObjectOnGroundProperly', vehicle);
            natives.invoke('placeObjectOnGroundProperly', ped);
            return true;
        }
        await alt.Utils.wait(delay);
    }
    return false;
};

const getSafeGroundZ = async (x: number, y: number, z: number, natives: ReturnType<typeof Rebar.player.useNative>) => {
    const [found, ground] = await natives.invokeWithResult('getGroundZFor3dCoord', x, y, z, 0, false, false);
    return found && ground > 0 ? ground : z;
};

const circleUntilFree = async (flyCtrl: ReturnType<typeof useHelicopter>, hospitalName: string, hospitalPos: alt.IVector3, checkInterval: number = 3000) => {
    const mission: HeliMission = {
        missionType: MissionType.Circle,
        missionFlags: MissionFlag.None,
        radius: 40,
        speed: 12,
        heading: -1,
        minHeight: hospitalPos.z + 40,
        maxHeight: hospitalPos.z + 50,
        slowDistance: -1,
    };

    let helipad = getFreeHelipad(hospitalName, 5);
    while (!helipad) {
        const success = flyCtrl.circle(hospitalPos, mission);
        if (!success) return null;
        await alt.Utils.wait(checkInterval);
        helipad = getFreeHelipad(hospitalName, 5);
    }

    return helipad;
};

export { setHelipadUsage, isHelipadClear, getFreeHelipad, getSafeGroundZ, ensureValidation, findSafeLanding, isLandingSafe, reachGoal, circleUntilFree };
