import * as alt from 'alt-server';
import { useRebar } from '@Server/index.js';
import { DeathConfig } from '../shared/config.js';

const Rebar = useRebar();

const reachGoal = async (pos: alt.IVector3, vehicle: alt.Vehicle, distance: number = 5) => { 
    while (vehicle && vehicle.valid && vehicle.pos.distanceTo(pos) > distance)
        await alt.Utils.wait(100); 
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

const findHospitalHelipad = async (center: alt.Vector3, natives: ReturnType<typeof Rebar.player.useNative>) => { 
    const nearbyPads = DeathConfig.helipads.filter((pad) => center.distanceTo(pad.pos) <= 50); 
    for (const pad of nearbyPads) { 
        const tempHeli = new alt.Vehicle('polmav', pad.pos, pad.rot, 2500); 
        tempHeli.frozen = true; 
        const blocked = await natives.invokeWithResult('isHeliLandingAreaBlocked', tempHeli); 
        tempHeli.destroy(); 
        if (!blocked) return { pos: pad.pos, rot: pad.rot }; 
    } 
    return await findSafeLanding(center, new alt.Vector3(0), 1, 0.5, natives); 
}; 

const ensureValidation = async (ped: alt.Ped, vehicle: alt.Vehicle, maxAttempts: number = 10, delay: number = 500) => { 
    for (let attempt = 0; attempt < maxAttempts; attempt++) { 
        if (ped && ped.valid && vehicle && vehicle.valid) return true; 
        await alt.Utils.wait(delay); 
    } 
    return false;
}; 

const getSafeGroundZ = async (x: number, y: number, z: number, natives: ReturnType<typeof Rebar.player.useNative>) => { 
    const [found, ground] = await natives.invokeWithResult('getGroundZFor3dCoord', x, y, z, 0, false, false); return found && ground > 0 ? ground : z; 
};

export {
    getSafeGroundZ,
    ensureValidation,
    findHospitalHelipad,
    findSafeLanding,
    isLandingSafe,
    reachGoal,
}