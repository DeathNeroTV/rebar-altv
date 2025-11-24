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
    while (vehicle && vehicle.valid && vehicle.pos.distanceTo(pos) > distance) 
        await new Promise(r => alt.nextTick(r));
};

const isLandingSafe = async (pos: alt.IVector3, model: string, natives: ReturnType<typeof Rebar.player.useNative>, extraRadius: number, reservedSpots: alt.IVector3[]) => {
    const posZ = await getSafeGroundZ(pos.x, pos.y, pos.z, natives);
    const landingCenter = { ...pos, z: posZ + 1.5 };
    const [_, hMin, hMax] = await natives.invokeWithResult('getModelDimensions', alt.hash(model));
    const heliSize = new alt.Vector3(hMax).sub(new alt.Vector3(hMin));
    const heliRadius = heliSize.length / 2;

    for (const entity of alt.Entity.all) {
        if (!entity.valid) continue;
        const entityPos = entity.pos;

        const [__, eMin, eMax] = await natives.invokeWithResult('getModelDimensions', entity.model);
        if (!eMin || !eMax) continue;

        const eSize = new alt.Vector3(eMax).sub(new alt.Vector3(eMin));
        const eRadius = eSize.length / 2;

        const dist = Utility.vector.distance(landingCenter, { ...entityPos, z: posZ });
        if (dist <= eRadius + heliRadius + extraRadius) return false;
    }

    for (const spot of reservedSpots) {
        if (Utility.vector.distance(landingCenter, spot) <= heliRadius + extraRadius) return false;
    }

    const tempVehicle = new alt.Vehicle(model, pos, { x: 0, y: 0, z: 0});
    tempVehicle.frozen = true;
    const blocked = await natives.invokeWithResult('isHeliLandingAreaBlocked', tempVehicle);
    tempVehicle.destroy();
    return !blocked;
};

const findSafeLanding = async (center: alt.IVector3, model: string, natives: ReturnType<typeof Rebar.player.useNative>, extraRadius: number = 5, step: number = 5, ringStep: number = 20, reservedSpots: alt.IVector3[] = []) => {
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
        await new Promise(r => alt.nextTick(r)); // Event loop nicht blockieren
    }
};

const getSafeGroundZ = async (x: number, y: number, z: number, natives: ReturnType<typeof Rebar.player.useNative>) => {
    const [found, ground] = await natives.invokeWithResult('getGroundZFor3dCoord', x, y, z, 0, false, false);
    return found && ground > 0 ? ground : z;
};

const circleUntilFree = async (flyCtrl: ReturnType<typeof useHelicopter>, hospitalName: string, hospitalPos: alt.IVector3, checkInterval: number = 3000) => {
    const mission: HeliMission = {
        missionType: MissionType.Circle,
        missionFlags: MissionFlag.None,
        radius: 20,
        speed: 12,
        heading: -1,
        minHeight: hospitalPos.z + 60,
        maxHeight: hospitalPos.z + 70,
        slowDistance: -1,
    };

    let helipad = getFreeHelipad(hospitalName, 10);
    while (!helipad) {
        const success = flyCtrl.circle(hospitalPos, mission);
        if (!success) return null;
        await alt.Utils.wait(checkInterval);
        helipad = getFreeHelipad(hospitalName, 10);
    }

    return helipad;
};

export { setHelipadUsage, isHelipadClear, getFreeHelipad, getSafeGroundZ, findSafeLanding, isLandingSafe, reachGoal, circleUntilFree };
