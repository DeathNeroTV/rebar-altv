import * as alt from 'alt-server';

import { useRebar } from '@Server/index.js';
import * as Utility from '@Shared/utility/index.js';
import { Character } from '@Shared/types/index.js';

import { DeathConfig } from '../shared/config.js';
import { DeathEvents } from '../shared/events.js';
import { useMedicalService } from './services.js';

const Rebar = useRebar();
const notifyApi = await Rebar.useApi().getAsync('notify-api');

// Stores keyed by character ID (string)
const TimeOfDeath: Map<string, number> = new Map();
const ActiveTasks: Map<string, { timeout?: number; interval?: number }> = new Map();
const ActiveLabels: Map<string, any> = new Map();

const Internal = {
    async handleSkipCreate(player: alt.Player) {
        if (!player || !player.valid) return;

        const document = Rebar.document.character.useCharacter(player);
        if (!document.isValid()) return;

        const storedPos = document.getField('pos');
        if (storedPos) {
            player.spawn(storedPos);
            player.pos = new alt.Vector3(storedPos);
        }

        Rebar.player.useWebview(player).show('DeathScreen', 'overlay');

        if (document.getField('isDead')) 
            useMedicalService().unconscious(player);
    },

    async handleCharacterUpdate(player: alt.Player, key: keyof Character, value: any) {
        if (!player || !player.valid) return;
        
        const document = Rebar.document.character.useCharacter(player);
        if (!document.isValid() || key !== 'isDead') return;
        if (!value) return;

        await document.set('pos', player.pos);
        useMedicalService().unconscious(player);
    },

    async handleDeath(player: alt.Player) {
        if (!player || !player.valid) return;

        const document = Rebar.document.character.useCharacter(player);
        if (!document.isValid()) return;

        // Markiere character als tot (persist)
        if (!document.getField('isDead')) await document.set('isDead', true);
        else useMedicalService().unconscious(player);
    },

    async handleRescue(player: alt.Player) {
        player.emit(DeathEvents.toClient.toggleControls, false);

        notifyApi.general.send(player, {
            icon: notifyApi.general.getTypes().INFO,
            title: 'Rettungsdienst',
            subtitle: 'Notruf',
            message: 'Es wurde ein Rettungshelikopter entsendet',
            oggFile: 'notification'
        });

        // Funktion, die sicherstellt, dass pilot und heli valid sind
        const ensureValidation = async(maxAttempts = 10, delay = 500) => {
            for (let attempt = 0; attempt < maxAttempts; attempt++) {
                if (pilot && pilot.valid && helicopter && helicopter.valid) return;
                await alt.Utils.wait(delay);
            }
        };

        // Funktion, die sicherstellt, dass der Ped in den Helikopter kommt
        const ensurePedInVehicle = async (ped: alt.Ped | alt.Player, vehicle: alt.Vehicle, seat: number, maxAttempts = 10, delay = 500) => {
            for (let attempt = 0; attempt < maxAttempts; attempt++) {
                const inVehicle = await natives.invokeWithResult('isPedInAnyVehicle', ped, false);
                if (inVehicle) return;
                natives.invoke('taskWarpPedIntoVehicle', ped, vehicle, seat);
                await alt.Utils.wait(delay);
            }
        };
        
        // Funktion, die sicherstellt, dass der Ped aus den Helikopter kommt
        const ensurePedOutVehicle = async (ped: alt.Ped | alt.Player, vehicle: alt.Vehicle, maxAttempts = 10, delay = 500) => {
            for (let attempt = 0; attempt < maxAttempts; attempt++) {
                const inVehicle = await natives.invokeWithResult('isPedInAnyVehicle', ped, false);
                if (!inVehicle) return;
                natives.invoke('taskLeaveVehicle', ped, vehicle, 0);
                await alt.Utils.wait(delay);
            }
        };

        const reachGoal = async (pos: alt.IVector3, distance: number = 5, maxAttempts = 10, delay = 500) => {
            for (let attempt = 0; attempt < maxAttempts; attempt++) {
                if (helicopter.pos.distanceTo(pos) <= distance) return;
                await alt.Utils.wait(delay);
            }
        }

        // --- Utility: Safe Ground Z
        const getSafeGroundZ = async (x: number, y: number, z: number) => {
            const [found, ground] = await natives.invokeWithResult(
                'getGroundZFor3dCoord',
                x, y, z, 0, false, false
            );
            return (found && ground > 0) ? ground : z;
        };

        // --- Utility: Check if Area is blocked
        const isLandingSafe = async(pos: alt.IVector3) => {
            const tempHeli = new alt.Vehicle('polmav', pos, helicopter.rot);
            tempHeli.frozen = true;
            const blocked = await natives.invokeWithResult('isHeliLandingAreaBlocked', tempHeli);
            tempHeli.destroy();
            return !blocked;
        };

        // --- Utility: Search position in radius for landing
        const findSafeLanding = async (center: alt.IVector3, radius = 30, step = 3) => {
            // Prüfe zuerst Zentrum
            if (await isLandingSafe(center)) return center;

            // Spiral- oder Raster-Suche
            for (let dx = -radius; dx <= radius; dx += step) {
                for (let dy = -radius; dy <= radius; dy += step) {
                    const testPos = new alt.Vector3(center.x + dx, center.y + dy, center.z);
                    if (await isLandingSafe(testPos)) {
                        return testPos;
                    }
                }
            }

            // Fallback: Originalposition, selbst wenn blockiert
            return center;
        };

        const findHospitalHelipad = async (center: alt.Vector3) => {
            // Filter Helipads, die in der Nähe des gewünschten Krankenhauses liegen (Radius 50m)
            const nearbyPads = DeathConfig.helipads.filter(pad => center.distanceTo(pad.pos) <= 50);

            for (const pad of nearbyPads) {
                // Prüfen, ob Landefläche frei ist
                const tempHeli = new alt.Vehicle('polmav', pad.pos, pad.rot);
                tempHeli.frozen = true;
                const blocked = await natives.invokeWithResult('isHeliLandingAreaBlocked', tempHeli);
                tempHeli.destroy();

                if (!blocked) return pad.pos; // freies Helipad gefunden
            }

            // Fallback: findSafeLanding, wenn kein Helipad frei
            return await findSafeLanding(hospitalPos);
        };

        // Points
        const { pos: hospitalPos, rot: hospitalRot } = useMedicalService().hospital(player.pos);
        const startPoint = await findHospitalHelipad(new alt.Vector3(hospitalPos));
        const landPoint = await findSafeLanding(player.pos, 5, 0.5);

        // Utilities
        const natives = Rebar.player.useNative(player);

        // Create Entities
        const helicopter = new alt.Vehicle('polmav', startPoint, player.rot);
        const pilot = new alt.Ped('s_m_m_pilot_02', startPoint, player.rot);

        await ensureValidation(15, 100);

        helicopter.setNetOwner(player);
        pilot.setNetOwner(player);

        helicopter.frozen = true;
        helicopter.livery = 2;
        helicopter.engineOn = true;

        // Ped Setup
        const ped = Rebar.controllers.usePed(pilot);
        ped.setOption('makeStupid', true);
        ped.setOption('invincible', true);

        // --- EMS Flugprofil ---
        const flyEMS = {
            async takeoff(z) {
                ped.invoke('taskHeliMission', helicopter, 0, 0,
                    helicopter.pos.x, helicopter.pos.y, z,
                    4, 12, 20, -1, -1, -1, -1, 32
                );
                await reachGoal({ ...helicopter.pos, z }, 3, 200, 100);
            },

            async climb(z) {
                ped.invoke('taskHeliMission', helicopter, 0, 0,
                    helicopter.pos.x, helicopter.pos.y, z,
                    4, 25, 40, -1, -1, -1, -1, 32
                );
                await reachGoal({ ...helicopter.pos, z }, 4, 250, 100);
            },

            async cruise(x, y, z) {
                ped.invoke('taskHeliMission', helicopter, 0, 0,
                    x, y, z,
                    4, 38, 40, -1, -1, -1, -1, 32
                );
                await reachGoal({ x, y, z }, 8, 500, 100);
            },

            async descend(x, y, z) {
                ped.invoke('taskHeliMission', helicopter, 0, 0,
                    x, y, z,
                    4, 10, 5, -1, -1, -1, -1, 32
                );
                await reachGoal({ x, y, z }, 3, 300, 100);
            },

            async land(x, y, z) {
                ped.invoke('taskHeliMission', helicopter, 0, 0,
                    x, y, z,
                    20, 8, 0, -1, -1, -1, -1, 32
                );
                await reachGoal({ x, y, z }, 2.5, 300, 100);
            }
        };
        
        // --- Pilot einsteigen lassen ---
        await ensurePedInVehicle(pilot, helicopter, -1, 15, 100);

        helicopter.frozen = false;

        // --- EMS Flug zum Spieler ---
        const landZ = await getSafeGroundZ(landPoint.x, landPoint.y, landPoint.z);
        const landPos = await findSafeLanding({ ...landPoint, z: landZ }, 30, 3);

        await flyEMS.takeoff(startPoint.z + 20);
        await flyEMS.climb(startPoint.z + 45);
        await flyEMS.cruise(landPos.x, landPos.y, landPos.z + 45);
        await flyEMS.descend(landPos.x, landPos.y, landPos.z + 15);
        await flyEMS.descend(landPos.x, landPos.y, landPos.z + 5);
        await flyEMS.land(landPos.x, landPos.y, landZ);

        // --- Spieler einsteigen lassen ---
        player.frozen = false;
        await ensurePedInVehicle(player, helicopter, 2, 15, 100);

        // --- Flug zum Krankenhaus ---
        const finalPos = await findHospitalHelipad(new alt.Vector3(hospitalPos));
        const finalZ = await getSafeGroundZ(finalPos.x, finalPos.y, finalPos.z);

        await flyEMS.takeoff(finalZ + 20);
        await flyEMS.climb(finalZ + 55);
        await flyEMS.cruise(finalPos.x, finalPos.y, finalZ + 55);
        await flyEMS.descend(finalPos.x, finalPos.y, finalZ + 15);
        await flyEMS.descend(finalPos.x, finalPos.y, finalZ + 5);
        await flyEMS.land(finalPos.x, finalPos.y, finalZ);

        // --- Cleanup ---
        await ensurePedOutVehicle(player, helicopter, 15, 100);
        await ensurePedOutVehicle(pilot, helicopter, 15, 100);

        try { helicopter.destroy(); } catch {}
        try { pilot.destroy(); } catch {}

        // --- Respawn ---
        player.pos = new alt.Vector3(hospitalPos);
        player.rot = new alt.Vector3(hospitalRot);
        player.playAnimation('missfinale_c1@', 'lying_dead_player0', 8.0, 8.0, -1, 1);
        player.emit(DeathEvents.toClient.toggleControls, true);

        await useMedicalService().respawn(player);
    },
    
    getRescuePoint(pos: alt.IVector3, offsetZ: number = 100, distance: number = 3) {
        // Zufällige Richtung um den Spieler
        const angle = Math.random() * Math.PI * 2;
        // Offsets für X/Y basierend auf Winkel + Distanz
        const offsetX = Math.cos(angle) * distance;
        const offsetY = Math.sin(angle) * distance;
        return new alt.Vector3(pos.x + offsetX, pos.y + offsetY, pos.z + offsetZ);
    }
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

    unconscious(player: alt.Player) {
        if (!player || !player.valid) return;

        const document = Rebar.document.character.useCharacter(player);
        if (!document.isValid()) return;

        const charId = document.getField('_id');
        if (TimeOfDeath.has(charId)) return;

        // spawn am zuletzt gespeicherten char pos, nicht an CharSelect default
        const savedPos = document.getField('pos') ?? player.pos;
        player.spawn(savedPos);
        player.pos = new alt.Vector3(savedPos);
        player.health = 124;
        player.playAnimation('missfinale_c1@', 'lying_dead_player0', 8.0, 8.0, -1, 1);
        alt.setTimeout(() => player.frozen = true, 2000);

        const label = Rebar.controllers.useTextLabelGlobal({
            pos: savedPos,
            text: '[H] - Person stabilisieren',
            dimension: player.dimension,
            uid: `reanimate-${charId}`,
        }, 3.0);
        ActiveLabels.set(charId, label);

        // TTL setzen
        const respawnAt = Date.now() + DeathConfig.respawnTime;
        TimeOfDeath.set(charId, respawnAt);
        player.emit(DeathEvents.toClient.startTimer, respawnAt - Date.now());

        const timeout = alt.setTimeout(() => {
            if (player && player.valid) 
                player.emit(DeathEvents.toClient.stopTimer);

            alt.clearTimeout(timeout);
            ActiveTasks.delete(charId);
        }, DeathConfig.respawnTime);
        ActiveTasks.set(charId, { timeout });
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

        if (TimeOfDeath.has(charId)) 
            TimeOfDeath.delete(charId);

        if (ActiveTasks.has(charId)) {
            const t = ActiveTasks.get(charId)!;
            if (t.timeout) alt.clearTimeout(t.timeout);
            if (t.interval) alt.clearInterval(t.interval);
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
            dimension: player.dimension
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

        if (TimeOfDeath.has(charId)) 
            TimeOfDeath.delete(charId);

        if (ActiveTasks.has(charId)) {
            const t = ActiveTasks.get(charId)!;
            if (t.timeout) alt.clearTimeout(t.timeout);
            if (t.interval) alt.clearInterval(t.interval);
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
            dimension: player.dimension
        });

        // Visual respawn
        Rebar.player.useWorld(player).setScreenFade(DeathConfig.fadeDelay);
        await alt.Utils.wait(DeathConfig.coolDown);

        player.frozen = false;
        player.spawn(data.pos);
        player.pos = new alt.Vector3(data.pos);
        player.clearBloodDamage();
        player.emit(DeathEvents.toClient.respawned);
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
    charEditorApi.onSkipCreate(Internal.handleSkipCreate);

    Rebar.services.useServiceRegister().remove('deathService');
    
    // Server Events
    alt.on('playerDeath', Internal.handleDeath);
    alt.on('rebar:playerCharacterUpdated', Internal.handleCharacterUpdate);

    // Client Events
    alt.onClient(DeathEvents.toServer.reviveComplete, useMedicalService().revived);
    alt.onClient(DeathEvents.toServer.toggleRevive, useMedicalService().revive);
    alt.onClient(DeathEvents.toServer.toggleRespawn, Internal.handleRescue);
    alt.onClient(DeathEvents.toServer.toggleEms, useMedicalService().called);
}
init();