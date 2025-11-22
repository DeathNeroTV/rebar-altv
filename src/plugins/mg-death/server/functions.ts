import * as alt from 'alt-server';
import { useRebar } from '@Server/index.js';
import * as Utility from '@Shared/utility/index.js';

import { DeathConfig } from '../shared/config.js';
import { useHelicopter } from './controller.js';
import { MissionFlag, MissionType } from '../shared/enums.js';
import { HeliMission } from '../shared/interfaces.js';

const Rebar = useRebar();

const getFreeHelipad = (name: string, radius: number = 5): { name: string; pos: alt.IVector3; rot: alt.IVector3; inUse: boolean } => {
    return DeathConfig.helipads.find((x) => x.name.includes(name) && isHelipadClear(x.pos, 5));
};

const isHelipadClear = (pos: alt.IVector3, radius: number) => {
    for (const entity of alt.Entity.all) {
        if (!entity || !entity.valid) continue;
        const dist = Utility.vector.distance(pos, entity.pos);
        if (dist <= radius) return false;
    }
    return true;
};

const setHelipadUsage = (name: string, isInUse: boolean) => {
    const padIndex = DeathConfig.helipads.findIndex((x) => x.name === name);
    DeathConfig.helipads[padIndex].isInUse = isInUse;
};

const reachGoal = async (pos: alt.IVector3, vehicle: alt.Vehicle, distance: number = 5) => {
    while (vehicle && vehicle.valid && vehicle.pos.distanceTo(pos) > distance) await alt.Utils.wait(100);
};

const isLandingSafe = async (pos: alt.IVector3, rot: alt.IVector3, natives: ReturnType<typeof Rebar.player.useNative>) => {
    const posZ = await getSafeGroundZ(pos.x, pos.y, pos.z, natives);
    const tempHeli = new alt.Vehicle('polmav', { ...pos, z: posZ + 1.5 }, rot);
    tempHeli.frozen = true;
    const blocked = await natives.invokeWithResult('isHeliLandingAreaBlocked', tempHeli);
    tempHeli.destroy();
    return !blocked;
};

const findSafeLanding = async (center: alt.IVector3, rot: alt.IVector3, radius: number = 30, step: number = 3, natives: ReturnType<typeof Rebar.player.useNative>) => {
    if (await isLandingSafe(center, rot, natives)) return { pos: center, rot };

    for (let dx = -radius; dx <= radius; dx += step) {
        for (let dy = -radius; dy <= radius; dy += step) {
            const testPos = new alt.Vector3(center.x + dx, center.y + dy, center.z);
            const isSafe = await isLandingSafe(testPos, rot, natives);
            if (isSafe) return { pos: testPos, rot };
        }
    }
    return { pos: center, rot };
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
    while (!helipad || helipad.inUse) {
        const success = flyCtrl.circle(hospitalPos, mission);
        if (!success) return null;
        await alt.Utils.wait(checkInterval);
        helipad = getFreeHelipad(hospitalName, 5);
    }

    return helipad;
};

export { setHelipadUsage, isHelipadClear, getFreeHelipad, getSafeGroundZ, ensureValidation, findSafeLanding, isLandingSafe, reachGoal, circleUntilFree };
