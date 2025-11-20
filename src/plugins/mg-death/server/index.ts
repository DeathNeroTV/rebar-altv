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

        // Utilities
        const natives = Rebar.player.useNative(player);

        notifyApi.general.send(player, {
            icon: notifyApi.general.getTypes().INFO,
            title: 'Rettungsdienst',
            subtitle: 'Notruf',
            message: 'Es wurde ein Rettungshelikopter entsendet',
            oggFile: 'notification'
        });

        // --- Utility: Check if Area is blocked
        const isLandingSafe = async(pos: alt.IVector3, rot: alt.IVector3) => {
            const tempHeli = new alt.Vehicle('polmav', pos, rot, 2500);
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

        const findHospitalHelipad = async (center: alt.Vector3) => {
            // Filter Helipads, die in der Nähe des gewünschten Krankenhauses liegen (Radius 50m)
            const nearbyPads = DeathConfig.helipads.filter(pad => center.distanceTo(pad.pos) <= 50);

            for (const pad of nearbyPads) {
                // Prüfen, ob Landefläche frei ist
                const tempHeli = new alt.Vehicle('polmav', pad.pos, pad.rot, 2500);
                tempHeli.frozen = true;
                const blocked = await natives.invokeWithResult('isHeliLandingAreaBlocked', tempHeli);
                tempHeli.destroy();

                if (!blocked) return { pos: pad.pos, rot: pad.rot }; // freies Helipad gefunden
            }

            // Fallback: findSafeLanding, wenn kein Helipad frei
            return await findSafeLanding(hospitalPos, hospitalRot, 1, 0.5);
        };

        // Funktion, die sicherstellt, dass pilot und heli valid sind
        const ensureValidation = async(ped: alt.Ped, vehicle: alt.Vehicle, maxAttempts: number = 10, delay: number = 500) => {
            for (let attempt = 0; attempt < maxAttempts; attempt++) {
                if (ped && ped.valid && vehicle && vehicle.valid) return;
                await alt.Utils.wait(delay);
            }
        };

        const reachGoal = async (pos: alt.IVector3, vehicle: alt.Vehicle, distance: number = 5, maxAttempts = 10, delay = 500) => {
            for (let attempt = 0; attempt < maxAttempts; attempt++) {
                if (vehicle.pos.distanceTo(pos) <= distance) return;
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

        const findLandingSpotAroundPlayer = async (minDistance = 3, maxDistance = 6, stepDegrees = 15) => {
            for (let dist = minDistance; dist <= maxDistance; dist += 1) {
                for (let angle = 0; angle < 360; angle += stepDegrees) {

                    const rad = angle * (Math.PI / 180);

                    const pos = {
                        x: player.pos.x + Math.cos(rad) * dist,
                        y: player.pos.y + Math.sin(rad) * dist,
                        z: player.pos.z
                    };

                    // Sichere Z-Koordinate berechnen
                    const z = await getSafeGroundZ(pos.x, pos.y, pos.z);
                    if (z === undefined || z === null) continue;

                    // Kollision mit Fahrzeugen checken
                    const vehicles = [...alt.Vehicle.all].filter(v => v.pos.distanceTo(pos) < 3);
                    if (vehicles.length > 0) continue;

                    // Kollision mit Peds checken
                    const peds = [...alt.Ped.all].filter(p => p.pos.distanceTo(pos) < 2);
                    if (peds.length > 0) continue;

                    // Optional: Boden prüfen (schräg, Wasser etc.)
                    if (z - player.pos.z > 4 || z - player.pos.z < -4) continue;

                    // Validen Punkt zurückgeben
                    return new alt.Vector3(pos.x, pos.y, z);
                }
            }
            const distance = 3;
            const headingRad = player.rot.z * (Math.PI / 180);
            const offset = { x: Math.cos(headingRad - Math.PI / 2) * distance, y: Math.sin(headingRad - Math.PI / 2) * distance };
            const point = new alt.Vector3({ x: player.pos.x + offset.x, y: player.pos.y + offset.y, z: player.pos.z });
            const z = await getSafeGroundZ(point.x, point.y, point.z);
            return new alt.Vector3({ ...point, z });
        }

        // Points
        const { pos: hospitalPos, rot: hospitalRot } = useMedicalService().hospital(player.pos);
        const { pos: startPoint, rot: startRot } = await findHospitalHelipad(new alt.Vector3(hospitalPos));

        const distance = 1;
        const heliHeading = startRot.z * (Math.PI / 180);
        const offset = { x: Math.cos(heliHeading + Math.PI / 2) * distance, y: Math.sin(heliHeading + Math.PI / 2) * distance, z: 0 };
        const pilotPos = { x: startPoint.x + offset.x, y: startPoint.y + offset.y, z: startPoint.z };

        // Create Entities
        const helicopter = new alt.Vehicle('polmav', { ...startPoint, z: startPoint.z + 0.5 }, startRot, 5000);
        const pilot = new alt.Ped('s_m_m_pilot_02', pilotPos, startRot, 5000);

        await ensureValidation(pilot, helicopter, 15, 100);

        helicopter.livery = 2;
        helicopter.setNetOwner(player);
        pilot.setNetOwner(player);

        const ped = Rebar.controllers.usePed(pilot);

        // --- EMS Flugprofil ---
        const flyEMS = {
            async smoothRotate(entity: alt.Vehicle, targetHeading: number, speed: number = 1.5) {
                return new Promise(async (resolve) => {
                    const normalize = (h: number) => ((h % 360) + 360) % 360;

                    targetHeading = normalize(targetHeading);

                    while (true) {
                        if (!entity || !entity.valid) return resolve(null);

                        const current = normalize(entity.rot.z);

                        let diff = targetHeading - current;

                        // Kürzeste Drehrichtung wählen
                        if (diff > 180) diff -= 360;
                        if (diff < -180) diff += 360;

                        // Wenn fast erreicht → fertig
                        if (Math.abs(diff) < 0.5) {
                            entity.rot = new alt.Vector3(entity.rot.x, entity.rot.y, targetHeading);
                            return resolve(true);
                        }

                        // Smooth Rotation: Schrittweise Annäherung
                        const step = Math.sign(diff) * speed;
                        const newHeading = current + step;

                        entity.rot = new alt.Vector3(entity.rot.x, entity.rot.y, newHeading);

                        await alt.Utils.wait(10);
                    }
                });
            },

            async getIn(maxAttempts: number) {
                for (let attempt = 0; attempt < maxAttempts; attempt++) {
                    const isInVehicle = await ped.invokeRpc('isPedInAnyVehicle', false);
                    if (isInVehicle) return;
                    ped.invoke('taskEnterVehicle', helicopter, 0, -1, 1.0, 1, undefined, 0);
                    await alt.Utils.wait(150);
                }
            },

            async takeoff(z: number) {
                ped.invoke('taskHeliMission', helicopter, 0, 0, helicopter.pos.x, helicopter.pos.y, z, 4, 12, 3, headingRad, z, 0, 5, 128);
                await reachGoal({ ...helicopter.pos, z }, helicopter, 3, 200, 100);
            },

            async climb(z: number) {
                ped.invoke('taskHeliMission', helicopter, 0, 0, helicopter.pos.x, helicopter.pos.y, z, 4, 20, 3, -1, z, 0, 5, 0);
                await reachGoal({ ...helicopter.pos, z }, helicopter, 3, 250, 100);
            },

            async cruise(x: number, y: number, z: number) {
                ped.invoke('taskHeliMission', helicopter, 0, 0, x, y, z, 4, 33.333, 3, -1, 200, z, 5, 0);
                await reachGoal({ x, y, z }, helicopter, 3, 500, 100);
            },

            async descend(x: number, y: number, z: number) {
                ped.invoke('taskHeliMission', helicopter, 0, 0, x, y, z, 4, 20, 3, -1, 200, z, 5, 0);
                await reachGoal({ x, y, z }, helicopter, 3, 300, 100);
            },

            async land(x: number, y: number, z: number) {
                ped.invoke('taskHeliMission', helicopter, 0, 0, x, y, z, 20, 10, 3, -1, 10, z, 5, 32);
                await reachGoal({ x, y, z }, helicopter, 3, 300, 100);
            },

            async getOut(maxAttempts: number) {
                for (let attempt = 0; attempt < maxAttempts; attempt++) {
                    const isPlayerInVehicle = await natives.invokeWithResult('isPedInAnyVehicle', player, false);
                    const isPedInVehicle = await ped.invokeRpc('isPedInAnyVehicle', false);
                    if (!isPedInVehicle && !isPlayerInVehicle) return;
                    if (isPedInVehicle) ped.invoke('taskLeaveVehicle', helicopter, 1);
                    if (isPlayerInVehicle) natives.invoke('taskLeaveVehicle', helicopter, 1);
                    await alt.Utils.wait(150);
                }
            }
        };

        // --- EMS Flug zum Spieler ---
        await flyEMS.getIn(15);
        await flyEMS.takeoff(startPoint.z + 20);
        await flyEMS.climb(startPoint.z + 45);

        const landPoint = await findLandingSpotAroundPlayer(3, 5);

        await flyEMS.cruise(landPoint.x, landPoint.y, landPoint.z + 45);
        await flyEMS.descend(landPoint.x, landPoint.y, landPoint.z + 15);
        await flyEMS.descend(landPoint.x, landPoint.y, landPoint.z + 5);
        await flyEMS.land(landPoint.x, landPoint.y, landPoint.z);

        // --- Spieler einsteigen lassen ---
        player.frozen = false;
        player.clearTasks();
        player.setIntoVehicle(helicopter, 4);
        await alt.Utils.wait(5000);

        // --- Flug zum Krankenhaus ---
        const { pos: finalPos, rot: finalRot } = await findHospitalHelipad(new alt.Vector3(hospitalPos));
        const finalZ = await getSafeGroundZ(finalPos.x, finalPos.y, finalPos.z);

        await flyEMS.takeoff(landPoint.z + 20);
        await flyEMS.climb(landPoint.z + 45);
        await flyEMS.cruise(finalPos.x, finalPos.y, finalZ + 45);
        await flyEMS.descend(finalPos.x, finalPos.y, finalZ + 15);
        await flyEMS.descend(finalPos.x, finalPos.y, finalZ + 5);
        await flyEMS.land(finalPos.x, finalPos.y, finalZ);
        await flyEMS.getOut(15);

        // --- Respawn ---
        await alt.Utils.wait(2000);
        player.pos = new alt.Vector3(hospitalPos);
        player.rot = new alt.Vector3(hospitalRot);
        player.playAnimation('missfinale_c1@', 'lying_dead_player0', 8.0, 8.0, -1, 1);

        // --- Cleanup ---
        try { helicopter.destroy(); } catch {}
        try { pilot.destroy(); } catch {}

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
    charEditorApi.onSkipCreate(Internal.handleSkipCreate);

    Rebar.services.useServiceRegister().remove('deathService');
    
    // Server Events
    alt.on('playerDeath', Internal.handleDeath);
    alt.on('rebar:playerCharacterUpdated', Internal.handleCharacterUpdate);

    // Client Events
    alt.onClient(DeathEvents.toServer.reviveComplete, async (player: alt.Player, isReviver: boolean) => await useMedicalService().revived(player, isReviver));
    alt.onClient(DeathEvents.toServer.toggleRevive, async (player: alt.Player, victim: alt.Player) => await useMedicalService().revive(player, victim));
    alt.onClient(DeathEvents.toServer.toggleRespawn, async (player: alt.Player) => await Internal.handleRescue(player));
    alt.onClient(DeathEvents.toServer.toggleEms, async (player: alt.Player) => await useMedicalService().called(player));
}
init();