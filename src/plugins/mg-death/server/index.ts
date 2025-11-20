import * as alt from 'alt-server';

import { useRebar } from '@Server/index.js';
import * as Utility from '@Shared/utility/index.js';

import { DeathConfig } from '../shared/config.js';
import { DeathEvents } from '../shared/events.js';
import { useMedicalService } from './services.js';

const Rebar = useRebar();
const notifyApi = await Rebar.useApi().getAsync('notify-api');
const TimeOfDeath: Map<string, number> = new Map();
const ActiveTasks: Map<string, number> = new Map();
const ActiveRescue: Map<string, { pilot: alt.Ped, helicopter: alt.Vehicle }> = new Map();
const ActiveLabels: Map<string, any> = new Map();

const handleRescue = async (player: alt.Player) => {
    const document = Rebar.document.character.useCharacter(player);
    if (!document.isValid()) return;
    const charId = document.getField('_id');
    player.emit(DeathEvents.toClient.toggleControls, false);

    const natives = Rebar.player.useNative(player);

    notifyApi.general.send(player, {
        icon: notifyApi.general.getTypes().INFO,
        title: 'Rettungsdienst',
        subtitle: 'Notruf',
        message: 'Es wurde ein Rettungshelikopter entsendet',
        oggFile: 'notification',
    });

    // --- Utility: Check if Area is blocked
    const isLandingSafe = async (pos: alt.IVector3, rot: alt.IVector3) => {
        const tempHeli = new alt.Vehicle('polmav', pos, rot, 5000);
        tempHeli.setNetOwner(player);
        tempHeli.frozen = true;
        const blocked = await natives.invokeWithResult('isHeliLandingAreaBlocked', tempHeli);
        tempHeli.destroy();
        return !blocked;
    };

    // --- Utility: Search position in radius for landing
    const findSafeLanding = async (center: alt.IVector3, rot: alt.IVector3, radius = 30, step = 3) => {
        // Prüfe zuerst Zentrum
        if (await isLandingSafe(center, rot)) return { pos: center, rot };

        // Spiral- oder Raster-Suche
        for (let dx = -radius; dx <= radius; dx += step) {
            for (let dy = -radius; dy <= radius; dy += step) {
                const testPos = new alt.Vector3(center.x + dx, center.y + dy, center.z);
                const isSafe = await isLandingSafe(testPos, rot);
                if (isSafe) return { pos: testPos, rot };
            }
        }

        // Fallback: Originalposition, selbst wenn blockiert
        return { pos: center, rot };
    };

    const reachGoal = (entity: alt.Entity, target: alt.IVector3, distance: number = 5, timeoutMs: number = 8000, checkRateMs: number = 100): Promise<boolean> => {
        return new Promise((resolve) => {
            if (!entity || !entity.valid) return resolve(false);

            const start = Date.now();

            const interval = alt.setInterval(() => {
                if (!entity || !entity.valid) {
                    alt.clearInterval(interval);
                    return resolve(false);
                }

                const dist = entity.pos.distanceTo(target);
                if (dist <= distance) {
                    alt.clearInterval(interval);
                    return resolve(true);
                }

                if (Date.now() - start >= timeoutMs) {
                    alt.clearInterval(interval);
                    return resolve(false);
                }
            }, checkRateMs);
        });
    };

    // --- Utility: Safe Ground Z
    const getSafeGroundZ = async (x: number, y: number, z: number) => {
        const [found, ground] = await natives.invokeWithResult('getGroundZFor3dCoord', x, y, z, 0, false, false);
        return found && ground > 0 ? ground : z;
    };

    const flyEMS = (pilot: alt.Ped, heli: alt.Vehicle, ped: ReturnType<typeof Rebar.controllers.usePed>) => ({
        async getIn(timeout = 7000) {
            if (!pilot?.valid || !heli?.valid) return false;

            const start = Date.now();

            while (Date.now() - start < timeout) {
                const inside = await ped.invokeRpc("isPedInAnyVehicle", false);
                if (inside) return true;

                ped.invoke("taskEnterVehicle", heli, 0, -1, 1.0, 1, undefined, 0);
                await alt.Utils.wait(250);
            }
            return false;
        },

        async goTo(x: number, y: number, z: number, style = 4) {
            if (!pilot?.valid || !heli?.valid) return false;

            ped.invoke(
                "taskHeliMission",
                heli,
                0, 0,
                x, y, z,
                style,
                20, // speed
                3,  // radius
                -1, 400, 0, 20, 0
            );

            const ok = await reachGoal(
                heli,
                { x, y, z },
                7,
                10000,
                150
            );

            return ok;
        },

        async takeoff(targetHeight = 25) {
            const z = heli.pos.z + targetHeight;
            return await this.goTo(heli.pos.x, heli.pos.y, z, 6);
        },

        async climbTo(z: number) {
            return await this.goTo(heli.pos.x, heli.pos.y, z, 4);
        },

        async cruiseTo(x: number, y: number, z: number) {
            return await this.goTo(x, y, z, 4);
        },

        async descendTo(x: number, y: number, finalZ: number) {
            return await this.goTo(x, y, finalZ, 20);
        },

        async land(x: number, y: number, z: number) {
            return await this.goTo(x, y, z, 21);
        },

        async getOut(timeout = 5000) {
            if (!pilot?.valid || !heli?.valid) return false;

            const start = Date.now();

            while (Date.now() - start < timeout) {
                const inside = await ped.invokeRpc("isPedInAnyVehicle", false);
                if (!inside) return true;

                ped.invoke("taskLeaveVehicle", heli, 1);
                await alt.Utils.wait(200);
            }
            return false;
        }
    });

    const getStartPositions = async (player: alt.Player) => {
        const headingRad = player.rot.z * (Math.PI / 180);

        const heliOffset = {
            x: Math.cos(headingRad + Math.PI / 2) * 1.5,
            y: Math.sin(headingRad + Math.PI / 2) * 1.5,
        };

        const pilotOffset = {
            x: Math.cos(headingRad + Math.PI / 2) * 2.5,
            y: Math.sin(headingRad + Math.PI / 2) * 2.5,
        };

        const baseZ = player.pos.z + 1.5;

        const startPos = {
            x: player.pos.x + heliOffset.x,
            y: player.pos.y + heliOffset.y,
            z: baseZ,
        };

        const pilotPos = {
            x: player.pos.x + pilotOffset.x,
            y: player.pos.y + pilotOffset.y,
            z: player.pos.z + 1,
        };

        return { startPos, pilotPos };
    };

    const getFinalLandingPos = async (player: alt.Player, natives) => {
        const { pos: hospitalPos, rot: hospitalRot } = useMedicalService().hospital(player.pos);

        const nearbyPads = DeathConfig.helipads.filter(
            (pad) => new alt.Vector3(hospitalPos).distanceTo(pad.pos) <= 50
        );

        for (const pad of nearbyPads) {
            const temp = new alt.Vehicle("polmav", pad.pos, pad.rot, 2500);
            temp.frozen = true;

            const blocked = await natives.invokeWithResult("isHeliLandingAreaBlocked", temp);
            temp.destroy();

            if (!blocked) {
                const finalZ = await getSafeGroundZ(pad.pos.x, pad.pos.y, pad.pos.z);
                return { finalPos: { ...pad.pos, z: finalZ }, finalRot: pad.rot };
            }
        }

        const safe = await findSafeLanding(hospitalPos, hospitalRot, 12, 1.5);
        const finalZ = await getSafeGroundZ(safe.pos.x, safe.pos.y, safe.pos.z);

        return {
            finalPos: { ...safe.pos, z: finalZ },
            finalRot: safe.rot,
        };
    };

    const { startPos, pilotPos } = await getStartPositions(player);
    const { finalPos, finalRot } = await getFinalLandingPos(player, natives);

    const world = Rebar.player.useWorld(player);
    world.setScreenFade(1000); 
    player.frozen = true;
    await alt.Utils.wait(1200);

    // --- PILOT & HELI SPAWN ---
    const helicopter = new alt.Vehicle('polmav', startPos, player.rot);
    const pilot = new alt.Ped('s_m_m_pilot_02', pilotPos, player.rot);

    // Entitäten validieren
    for (let i = 0; i < 10; i++) {
        if (helicopter?.valid && pilot?.valid) break;
        await alt.Utils.wait(100);
    }

    if (!helicopter || !helicopter.valid || !pilot || !pilot.valid) {
        alt.logError("Rescue Spawn: Pilot oder Heli ungültig.");
        return;
    }

    helicopter.setNetOwner(player);
    pilot.setNetOwner(player);
    helicopter.livery = 2;

    const ped = Rebar.controllers.usePed(pilot);
    ped.setOption('makeStupid', true);

    // --- SPIELER IN DEN HELI SETZEN ---
    player.clearTasks();
    player.setIntoVehicle(helicopter, 4); // Sitz hinter Pilot

    await alt.Utils.wait(800);

    // --- SCREENFADE ZURÜCK ---
    world.clearScreenFade(1000);
    await alt.Utils.wait(1000);

    player.frozen = false;

    // --- EMS Flug zum Spieler ---
    const pilotCtrl = flyEMS(pilot, helicopter, ped);
    await pilotCtrl.getIn();
    await pilotCtrl.takeoff(20);
    await pilotCtrl.climbTo(startPos.z + 45);
    await pilotCtrl.cruiseTo(finalPos.x, finalPos.y, finalPos.z + 40);
    await pilotCtrl.descendTo(finalPos.x, finalPos.y, finalPos.z + 8);
    await pilotCtrl.descendTo(finalPos.x, finalPos.y, finalPos.z + 2);
    await pilotCtrl.land(finalPos.x, finalPos.y, finalPos.z);
    await pilotCtrl.getOut();
    
    if (player && player.valid) {
        player.playAnimation('missfinale_c1@', 'lying_dead_player0', 8.0, 8.0, -1, 1);
        await useMedicalService().respawn(player);
    }

    try { helicopter.destroy(); } catch {}
    try { pilot.destroy(); } catch {}
};

const handleDeathScreen = (player: alt.Player) => {
    Rebar.player.useWebview(player).show('DeathScreen', 'overlay');
    Rebar.player.useClothing(player).sync();
    Rebar.player.useWeapon(player).sync();
    Rebar.player.useState(player).sync();
};

Rebar.services.useServiceRegister().register('medicalService', {
    hospital(pos: alt.IVector3) {
        const sorted = DeathConfig.hospitals.slice().sort((a, b) => {
            const distA = Utility.vector.distance(pos, a.pos);
            const distB = Utility.vector.distance(pos, b.pos);
            return distA - distB;
        });
        return { pos: sorted[0].pos, rot: sorted[0].rot };
    },

    async unconscious(player: alt.Player) {
        if (!player || !player.valid) return;

        const document = Rebar.document.character.useCharacter(player);
        if (!document.isValid()) return;

        await document.setBulk({ isDead: true, health: 99, food: 100, water: 100, armour: 0, pos: player.pos, rot: player.rot });

        const charId = document.getField('_id');
        const savedPos = document.getField('pos') ?? player.pos;
        player.spawn(savedPos);
        player.pos = new alt.Vector3(savedPos);
        player.health = 124;
        player.playAnimation('missfinale_c1@', 'lying_dead_player0', 8.0, 8.0, -1, 1);
        alt.setTimeout(() => (player.frozen = true), 2000);

        const label = Rebar.controllers.useTextLabelGlobal(
            {
                pos: savedPos,
                text: '[H] - Person stabilisieren',
                dimension: player.dimension,
                uid: `reanimate-${charId}`,
            },
            3.0,
        );
        ActiveLabels.set(charId, label);

        // TTL setzen
        const respawnAt = Date.now() + DeathConfig.respawnTime;
        TimeOfDeath.set(charId, respawnAt);
        player.emit(DeathEvents.toClient.startTimer, respawnAt - Date.now());

        if (ActiveTasks.has(charId)) 
            alt.clearTimeout(ActiveTasks.get(charId)!);

        const timeout = alt.setTimeout(() => {
            if (player && player.valid) player.emit(DeathEvents.toClient.stopTimer);

            alt.clearTimeout(timeout);
            ActiveTasks.delete(charId);
        }, DeathConfig.respawnTime);
        ActiveTasks.set(charId, timeout);
    },

    async revive(reviver: alt.Player, victim: alt.Player) {
        if (!reviver || !victim || !reviver.valid || !victim.valid) return;
        //TODO: Abfrage ob Mediziner im Dienst sind, sende Dispatch zu diesen!

        const natives = Rebar.player.useNative(reviver);
        const victimDoc = Rebar.document.character.useCharacter(victim);
        if (!victimDoc.isValid() || !victimDoc.getField('isDead')) return;
        victim.frozen = true;

        // Zielposition leicht vor dem Opfer
        const chestPos = await natives.invokeWithResult('getPedBoneCoords', victim, 24816, 0, 0, 0);
        const offsetDistance = 0.5; // Abstand vor dem Opfer

        const victimHeading = (await natives.invokeWithResult('getEntityHeading', victim)) * (Math.PI / 180);
        const targetX = chestPos.x - Math.sin(victimHeading) * offsetDistance;
        const targetY = chestPos.y + Math.cos(victimHeading) * offsetDistance;

        let targetZ = chestPos.z;
        const [found, groundZ] = await natives.invokeWithResult('getGroundZFor3dCoord', targetX, targetY, targetZ, targetZ, false, false);
        if (found) targetZ = groundZ;

        // Spieler zum Ziel bewegen, dabei Collision berücksichtigen
        natives.invoke('taskGoStraightToCoord', reviver, targetX, targetY, targetZ, 1.2, -1, 0.0, 0.0);

        // Warten, bis Spieler ungefähr am Ziel ist (max. 5 Sekunden)
        const startTime = Date.now();
        while (reviver.pos.distanceTo({ x: targetX, y: targetY, z: targetZ }) > 0.3 && Date.now() - startTime < 5000) {
            await alt.Utils.wait(1);
        }

        // Spieler korrekt zum Opfer drehen
        natives.invoke('taskTurnPedToFaceCoord', reviver, chestPos.x, chestPos.y, chestPos.z, 1000);

        // Warten, bis Spieler auf das Ziel schaut (max. 2 Sekunden)
        const turnStart = Date.now();
        while (!(await natives.invokeWithResult('isPedFacingPed', reviver, victim, 10)) && Date.now() - turnStart < 2000) {
            await alt.Utils.wait(1);
        }

        reviver.clearTasks();
        victim.clearTasks();
        reviver.playAnimation('mini@cpr@char_a@cpr_def', 'cpr_intro', 8.0, 8.0, 5000, 1);
        victim.playAnimation('mini@cpr@char_b@cpr_def', 'cpr_intro', 8.0, 8.0, 5000, 1);

        await alt.Utils.wait(5000);

        reviver.clearTasks();
        victim.clearTasks();
        reviver.emit(DeathEvents.toClient.startRevive, true);
        victim.emit(DeathEvents.toClient.startRevive, false);
        reviver.playAnimation('mini@cpr@char_a@cpr_str', 'cpr_pumpchest', 8.0, 8.0, -1, 1);
        victim.playAnimation('mini@cpr@char_b@cpr_str', 'cpr_pumpchest', 8.0, 8.0, -1, 1);
    },

    async revived(player: alt.Player, isReviver: boolean) {
        if (!player || !player.valid) return;
        alt.setTimeout(() => player.clearTasks(), DeathConfig.coolDown);
        if (isReviver) return;

        const document = Rebar.document.character.useCharacter(player);
        if (!document.isValid() || !document.getField('isDead')) return;

        const charId = document.getField('_id');
        if (ActiveLabels.has(charId)) {
            const label = ActiveLabels.get(charId)!;
            label.destroy();
            ActiveLabels.delete(charId);
        }

        if (TimeOfDeath.has(charId)) TimeOfDeath.delete(charId);

        if (ActiveTasks.has(charId)) {
            const timeout = ActiveTasks.get(charId)!;
            if (timeout) alt.clearTimeout(timeout);
            ActiveTasks.delete(charId);
        }

        const data = { pos: player.pos, rot: player.rot };

        await document.setBulk({
            isDead: false,
            food: 100,
            water: 100,
            health: 124,
            pos: data.pos,
            rot: data.rot,
            dimension: player.dimension,
        });

        Rebar.player.useWorld(player).setScreenFade(DeathConfig.fadeDelay);
        await alt.Utils.wait(DeathConfig.coolDown);

        player.frozen = false;
        player.spawn(data.pos);
        player.pos = new alt.Vector3(data.pos);
        player.clearBloodDamage();
        player.emit(DeathEvents.toClient.respawned);
        Rebar.player.useWorld(player).clearScreenFade(DeathConfig.fadeDelay);
    },

    async respawn(player: alt.Player, pos: alt.IVector3) {
        if (!player || !player.valid) return;

        const document = Rebar.document.character.useCharacter(player);
        if (!document.isValid() || !document.getField('isDead')) return;

        // Aufräumen: alle temporären Einträge
        const charId = document.getField('_id');
        if (ActiveLabels.has(charId)) {
            const label = ActiveLabels.get(charId)!;
            label.destroy();
            ActiveLabels.delete(charId);
        }

        if (ActiveRescue.has(charId)) {
            const { pilot, helicopter } = ActiveRescue.get(charId);
            try { helicopter.destroy(); } catch {}
            try { pilot.destroy(); } catch {}
            ActiveRescue.delete(charId);
        }

        if (TimeOfDeath.has(charId)) TimeOfDeath.delete(charId);

        if (ActiveTasks.has(charId)) {
            const timeout = ActiveTasks.get(charId)!;
            if (timeout) alt.clearTimeout(timeout);
            ActiveTasks.delete(charId);
        }

        // Unfreeze und setze neue Werte
        const data = pos ? { pos, rot: player.rot } : useMedicalService().hospital(player.pos);

        await document.setBulk({
            isDead: false,
            food: 100,
            water: 100,
            health: 124,
            pos: data.pos,
            rot: data.rot,
        });

        // Visual respawn
        Rebar.player.useWorld(player).setScreenFade(DeathConfig.fadeDelay);
        await alt.Utils.wait(DeathConfig.coolDown);

        player.frozen = false;
        player.spawn(data.pos);
        player.pos = new alt.Vector3(data.pos);
        player.clearBloodDamage();
        player.emit(DeathEvents.toClient.respawned);
        player.emit(DeathEvents.toClient.toggleControls, true);
        Rebar.player.useWorld(player).clearScreenFade(DeathConfig.fadeDelay);
    },

    called(player: alt.Player) {
        const document = Rebar.document.character.useCharacter(player);
        if (!document.isValid() || !document.getField('isDead')) return;
        player.emit(DeathEvents.toClient.confirmEms);

        // TODO: später Broadcast an Medics; aktuell nur confirm an den Spieler
    },
});

async function init() {
    const charEditorApi = await Rebar.useApi().getAsync('character-creator-api');
    if (!charEditorApi) {
        alt.logError('[mg-death]', 'character-creator-api not found');
        return;
    }

    charEditorApi.onCreate(handleDeathScreen);
    charEditorApi.onSkipCreate(handleDeathScreen);

    alt.on('playerDimensionChange', async (player: alt.Player, oldDim: number, newDim: number) => {
        const document = Rebar.document.character.useCharacter(player);
        if (!document.isValid()) return;
        await document.set('dimension', newDim);
    });

    alt.on('playerInteriorChange', async (player: alt.Player, oldInt: number, newInt: number) => {
        const document = Rebar.document.character.useCharacter(player);
        if (!document.isValid()) return;
        await document.set('interior', newInt);
    });

    alt.on('playerDeath', async (victim: alt.Player, killer: alt.Entity, weapoNHash: number) => await useMedicalService().unconscious(victim));
    // Client Events
    alt.onClient(DeathEvents.toServer.reviveComplete, async (player: alt.Player, isReviver: boolean) => await useMedicalService().revived(player, isReviver));
    alt.onClient(DeathEvents.toServer.toggleRevive, async (player: alt.Player, victim: alt.Player) => await useMedicalService().revive(player, victim));
    alt.onClient(DeathEvents.toServer.toggleRespawn, async (player: alt.Player) => await handleRescue(player));
    alt.onClient(DeathEvents.toServer.toggleEms, async (player: alt.Player) => await useMedicalService().called(player));
}
init();
