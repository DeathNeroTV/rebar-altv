import * as alt from 'alt-server';

import { useRebar } from '@Server/index.js';
import * as Utility from '@Shared/utility/index.js';
import { Character, Vehicle } from '@Shared/types/index.js';

import { DeathConfig } from '../shared/config.js';
import { DeathEvents } from '../shared/events.js';
import { useMedicalService } from './services.js';

const Rebar = useRebar();
const api = Rebar.useApi();
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
        player.frozen = false;
        player.spawn(player.pos);
        player.clearTasks();
        Rebar.player.useWorld(player).disableControls();
        
        const landPoint = Internal.getRescuePoint(player.pos, 1, 3);
        const endPoint = useMedicalService().hospital(player.pos);
        const helicopter = new alt.Vehicle('polmav', landPoint.x, landPoint.y, landPoint.z, 0, 0, 0, 500, true);
        const pilot = new alt.Ped('s_m_m_pilot_02', landPoint, player.rot, 500, true);

        await player.emitRpc(DeathEvents.toClient.startRescue, { pilot, helicopter, landPoint, endPoint });
        Rebar.player.useWorld(player).enableControls();
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

    revive(reviver: alt.Player, victim: alt.Player) {
        if (!reviver || !victim || !reviver.valid || !victim.valid) return;
        //TODO: Abfrage ob Mediziner im Dienst sind, sende Dispatch zu diesen!

        const victimDoc = Rebar.document.character.useCharacter(victim);
        if (!victimDoc.isValid() || !victimDoc.getField('isDead')) return;

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

        alt.setTimeout(() => {
            if (!player || !player.valid) return;
            player.frozen = false;
            player.spawn(data.pos);
            player.pos = new alt.Vector3(data.pos);
            player.clearBloodDamage();
            player.emit(DeathEvents.toClient.respawned);

            Rebar.player.useWorld(player).clearScreenFade(FADE_DELAY);
        }, COOLDOWN_DELAY);
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

        alt.setTimeout(() => {
            if (!player || !player.valid) return;
            player.frozen = false;
            player.spawn(data.pos);
            player.pos = new alt.Vector3(data.pos);
            player.clearBloodDamage();
            player.emit(DeathEvents.toClient.respawned);

            Rebar.player.useWorld(player).clearScreenFade(FADE_DELAY);
        }, COOLDOWN_DELAY);
    },

    called(player: alt.Player) {
        const document = Rebar.document.character.useCharacter(player);
        if (!document.isValid() || !document.getField('isDead')) return;
        player.emit(DeathEvents.toClient.confirmEms);

        // TODO: später Broadcast an Medics; aktuell nur confirm an den Spieler
    },
});

async function init() {
    const charEditorApi = await api.getAsync('character-creator-api');
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