import * as alt from 'alt-server';
import * as natives from 'natives';

import { useRebar } from '@Server/index.js';
import * as Utility from '@Shared/utility/index.js';
import { Character } from '@Shared/types/index.js';

import { DeathConfig } from '../shared/config.js';
import { DeathEvents } from '../shared/events.js';
import { useMedicalService } from './services.js';

const Rebar = useRebar();
const notifyApi = await Rebar.useApi().getAsync('notify-api');
const FADE_DELAY = 3000;
const COOLDOWN_DELAY = FADE_DELAY + 500;

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
        notifyApi.general.send(player, {
            icon: notifyApi.general.getTypes().INFO,
            title: 'Rettungsdienst',
            subtitle: 'Notruf',
            message: 'Es wurde ein Rettungshelikopter entsendet',
            oggFile: 'notification'
        });

        // Points
        const startPoint = Internal.getRescuePoint(player.pos, 300, 5);
        const landPoint = Internal.getRescuePoint(player.pos, 1, 3);
        const { pos: hospitalPos, rot: hospitalRot } = useMedicalService().hospital(player.pos);

        // Utilities
        const natives = Rebar.player.useNative(player);

        // Create Entities
        const helicopter = new alt.Vehicle('polmav', startPoint, player.rot);
        const pilot = new alt.Ped('s_m_m_pilot_02', startPoint, player.rot);

        helicopter.setNetOwner(player);
        pilot.setNetOwner(player);

        helicopter.frozen = true;
        helicopter.livery = 2;
        helicopter.engineOn = true;

        // Ped Setup
        const ped = Rebar.controllers.usePed(pilot);
        ped.setOption('makeStupid', true);
        ped.setOption('invincible', true);

        // --- Utility: Safe wait-for with timeout
        const waitFor = async (check: () => boolean | Promise<boolean>, timeout = 15000) => {
            const start = Date.now();
            while (!(await check())) {
                if (Date.now() - start > timeout) return false;
                await alt.Utils.wait(50);
            }
            return true;
        };

        // --- Utility: Safe Ground Z
        const getSafeGroundZ = async (x: number, y: number, z: number) => {
            const [found, ground] = await natives.invokeWithResult(
                'getGroundZFor3dCoord',
                x, y, z, 0, false, false
            );
            return (found && ground > 0) ? ground : z;
        };

        const getDynamicTimeout = (from: alt.Vector3, to: alt.Vector3, speedFactor = 1.5) => {
            const distance = from.distanceTo(to);
            // Minimaler Timeout von 10 Sekunden, danach skaliert
            return Math.max(10000, distance * speedFactor);
        };

        // -------------------------
        // ENTER HELICOPTER
        // -------------------------
        ped.invoke('taskEnterVehicle', helicopter, 0, -1, 2.0, 16, null, 0);

        await waitFor(() => ped.invokeRpc('isPedInAnyHeli'), 10000);

        helicopter.frozen = false;

        // -------------------------
        // FLY TO PLAYER LANDING POINT
        // -------------------------
        const landZ = await getSafeGroundZ(landPoint.x, landPoint.y, landPoint.z);

        ped.invoke('taskHeliMission', helicopter, 0, 0, landPoint.x, landPoint.y, landZ + 20, 4, 30.0, 10.0, 0.0, 50, 20, 50.0, 0);

        const targetHigh = new alt.Vector3(landPoint.x, landPoint.y, landZ + 20);
        const timeoutHigh = getDynamicTimeout(helicopter.pos, targetHigh, 25);
        await waitFor(() => helicopter.pos.distanceTo(targetHigh) <= 5, timeoutHigh);

        // Descend
        ped.invoke('taskHeliMission', helicopter, 0, 0, landPoint.x, landPoint.y, landZ, 20, 10.0, 5.0, 0.0, 30, 10, 20.0, 0);

        const targetLow = new alt.Vector3(landPoint.x, landPoint.y, landZ);
        const timeoutLow = getDynamicTimeout(helicopter.pos, targetLow, 20);
        await waitFor(() => helicopter.pos.distanceTo(targetLow) <= 5, timeoutLow);

        // -------------------------
        // PLAYER ENTER
        // -------------------------
        player.clearTasks();
        await alt.Utils.wait(50);
        player.setIntoVehicle(helicopter, 4);

        // -------------------------
        // FLY TO HOSPITAL
        // -------------------------
        const hoverZ = 100;
        const finalZ = await getSafeGroundZ(hospitalPos.x, hospitalPos.y, hospitalPos.z);

        // High approach
        ped.invoke('taskHeliMission', helicopter, 0, 0, hospitalPos.x, hospitalPos.y, hoverZ, 4, 35.0, 10.0, 0.0, 50, 20, 50.0, 0);

        const finalHigh = new alt.Vector3(hospitalPos.x, hospitalPos.y, hoverZ);
        const finalHighTimeout = Math.max(10000, finalHigh.distanceTo(helicopter.pos) * 25);
        await waitFor(() => helicopter.pos.distanceTo(finalHigh) <= 5, finalHighTimeout);

        // Landing
        ped.invoke('taskHeliMission', helicopter, 0, 0, hospitalPos.x, hospitalPos.y, finalZ, 20, 10.0, 5.0, 0.0, 30, 10, 20.0, 0);

        const finalLandLow = new alt.Vector3(hospitalPos.x, hospitalPos.y, finalZ);
        const finalLandLowTimeout = Math.max(10000, finalLandLow.distanceTo(helicopter.pos) * 20);
        await waitFor(() => helicopter.pos.distanceTo(finalLandLow) <= 5, finalLandLowTimeout);

        // -------------------------
        // PILOT EXIT & CLEANUP
        // -------------------------
        ped.invoke('taskLeaveVehicle', helicopter, 0);

        await waitFor(async() => (await ped.invokeRpc('isPedInAnyHeli')) === false, 8000);

        try { helicopter.destroy(); } catch {}
        try { pilot.destroy(); } catch {}

        // -------------------------
        // RESPAWN
        // -------------------------
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
            await alt.Utils.wait(50);
        }

        // Spieler korrekt zum Opfer drehen
        natives.invoke('taskTurnPedToFaceCoord', reviver, chestPos.x, chestPos.y, chestPos.z, 1000);

        // Warten, bis Spieler auf das Ziel schaut (max. 2 Sekunden)
        const turnStart = Date.now();
        while (!(await natives.invokeWithResult('isPedFacingPed', reviver, victim, 10)) && Date.now() - turnStart < 2000) {
            await alt.Utils.wait(50);
        }

        reviver.clearTasks();
        victim.clearTasks();

        reviver.playAnimation('mini@cpr@char_a@cpr_def', 'cpr_intro', 8.0, 8.0, 5000, 1);
        victim.playAnimation('mini@cpr@char_b@cpr_def', 'cpr_intro', 8.0, 8.0, 5000, 1);

        alt.setTimeout(() => {
            reviver.clearTasks();
            victim.clearTasks();

            reviver.emit(DeathEvents.toClient.startRevive, true);
            victim.emit(DeathEvents.toClient.startRevive, false);

            reviver.playAnimation('mini@cpr@char_a@cpr_str', 'cpr_pumpchest', 8.0, 8.0, -1, 1);
            victim.playAnimation('mini@cpr@char_b@cpr_str', 'cpr_pumpchest', 8.0, 8.0, -1, 1);
        }, 5000);
    },

    async revived(player: alt.Player, isReviver: boolean) {
        if (!player || !player.valid) return;
        alt.setTimeout(() => player.clearTasks(), COOLDOWN_DELAY);
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

        Rebar.player.useWorld(player).setScreenFade(FADE_DELAY);
        await alt.Utils.wait(COOLDOWN_DELAY);

        player.frozen = false;
        player.spawn(data.pos);
        player.pos = new alt.Vector3(data.pos);
        player.clearBloodDamage();
        player.emit(DeathEvents.toClient.respawned);
        Rebar.player.useWorld(player).clearScreenFade(FADE_DELAY);
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
        Rebar.player.useWorld(player).setScreenFade(FADE_DELAY);
        await alt.Utils.wait(COOLDOWN_DELAY);

        player.frozen = false;
        player.spawn(data.pos);
        player.pos = new alt.Vector3(data.pos);
        player.clearBloodDamage();
        player.emit(DeathEvents.toClient.respawned);
        Rebar.player.useWorld(player).clearScreenFade(FADE_DELAY);
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