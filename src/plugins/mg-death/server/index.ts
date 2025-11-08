import * as alt from 'alt-server';
import { useRebar } from '@Server/index.js';
import * as Utility from '@Shared/utility/index.js';

import { DeathConfig } from '../shared/config.js';
import { DeathEvents } from '../shared/events.js';
import { Character } from '@Shared/types/character.js';

const Rebar = useRebar();
const api = Rebar.useApi();

// Stores keyed by character ID (string)
const TimeOfDeath: Map<string, number> = new Map(); // timestamp when respawn available
const ActiveTasks: Map<string, { timeout?: number; interval?: number }> = new Map();
const ActiveRevives: Map<string, { reviver: alt.Player; victim: alt.Player; interval: number }> = new Map();

const Internal = {
    // Called when player chooses skipCreate (initial flow)
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

        // Zeige DeathScreen nur falls Zustand notwendig (z. B. isDead true)
        if (document.getField('isDead')) {
            // send initial timer/warnung falls vorhanden
            const charId = document.getField('_id');
            if (TimeOfDeath.has(charId)) {
                const msLeft = Math.max(0, TimeOfDeath.get(charId)! - Date.now());
                player.emit(DeathEvents.toClient.startTimer, msLeft);
            } else player.emit(DeathEvents.toClient.stopTimer);
        }
    },

    async handleCharacterUpdate(player: alt.Player, key: keyof Character, value: any) {
        const document = Rebar.document.character.useCharacter(player);
        if (!document.isValid() || key !== 'isDead') return;
        if (!value) return;

        // Wenn isDead true wurde (client oder server update), speichern wir pos und verarbeiten Tod.
        await document.set('pos', player.pos);
        Internal.processDeath(player);
    },

    getClosestHospital(pos: alt.IVector3): alt.IVector3 {
        const sorted = DeathConfig.hospitals.slice().sort((a, b) => {
            const distA = Utility.vector.distance(pos, a);
            const distB = Utility.vector.distance(pos, b);
            return distA - distB;
        });
        return sorted[0];
    },

    startRevive(reviver: alt.Player, victim: alt.Player) {
        if (!reviver || !victim || !reviver.valid || !victim.valid) return;

        const victimDoc = Rebar.document.character.useCharacter(victim);
        if (!victimDoc.isValid() || !victimDoc.getField('isDead')) return;
        const victimId = victimDoc.getField('_id');

        // Guard: Ist bereits ein Revive aktiv?
        if (ActiveRevives.has(victimId)) return;

        reviver.emit(DeathEvents.toClient.startRevive);
        victim.emit(DeathEvents.toClient.startRevive);

        Rebar.player.useAnimation(reviver).playInfinite('mini@cpr@char_a@cpr_str', 'cpr_pumpchest', 1);
        Rebar.player.useAnimation(victim).playInfinite('mini@cpr@char_b@cpr_str', 'cpr_pumpchest', 1);

        let progress = 0;
        const intervalMs = Math.max(200, DeathConfig.reviveTime / 20);
        const interval = alt.setInterval(() => {
            if (!reviver || !victim || !reviver.valid || !victim.valid) {
                alt.clearInterval(interval);
                ActiveRevives.delete(victimId);
                return;
            }

            progress += 5;
            if (progress >= 100) {
                alt.clearInterval(interval);
                Internal.completeRevive(victimId);
                return;
            }

            reviver.emit(DeathEvents.toClient.reviveProgress, progress);
            victim.emit(DeathEvents.toClient.reviveProgress, progress);
        }, intervalMs);

        ActiveRevives.set(victimId, { reviver, victim, interval });
    },

    async completeRevive(charId: string) {
        if (!ActiveRevives.has(charId)) return;
        const data = ActiveRevives.get(charId)!;

        if (data.interval) alt.clearInterval(data.interval);
        ActiveRevives.delete(charId);

        // Wenn TimeOfDeath gesetzt: löschen
        if (TimeOfDeath.has(charId)) TimeOfDeath.delete(charId);

        // ActiveTimers aufräumen
        if (ActiveTasks.has(charId)) {
            const t = ActiveTasks.get(charId)!;
            if (t.timeout) alt.clearTimeout(t.timeout);
            ActiveTasks.delete(charId);
        }

        // Respawn victim an seiner aktuellen pos mit reviver Effekt
        await Internal.respawn(data.victim, data.victim.pos, data.reviver);
    },

    async respawn(player: alt.Player, pos?: alt.Vector3, reviver?: alt.Player) {
        if (!player || !player.valid) return;

        const document = Rebar.document.character.useCharacter(player);
        if (!document.isValid()) return;
        if (!document.getField('isDead')) return; // nur wenn wirklich tot

        // Aufräumen: alle temporären Einträge
        const charId = document.getField('_id');
        if (ActiveRevives.has(charId)) ActiveRevives.delete(charId);
        if (TimeOfDeath.has(charId)) TimeOfDeath.delete(charId);

        if (ActiveTasks.has(charId)) {
            const t = ActiveTasks.get(charId)!;
            if (t.timeout) alt.clearTimeout(t.timeout);
            if (t.interval) alt.clearInterval(t.interval);
            ActiveTasks.delete(charId);
        }

        // Unfreeze und setze neue Werte
        player.frozen = false;
        const newPos = pos ?? Internal.getClosestHospital(player.pos);

        await document.setBulk({
            isDead: false,
            food: 100,
            water: 100,
            health: 124,
            pos: newPos,
            dimension: player.dimension
        });

        // Visual respawn
        Rebar.player.useWorld(player).setScreenFade(3000);
        player.spawn(newPos, 2900);

        alt.setTimeout(() => {
            if (player && player.valid) {
                player.emit(DeathEvents.toClient.reviveComplete);
                Rebar.player.useWebview(player).emit(DeathEvents.toClient.respawned);
                Rebar.player.useAnimation(player).clear();
                Rebar.player.useWorld(player).clearScreenFade(3000);
                Rebar.player.useState(player).sync();
                player.clearBloodDamage();
            }

            if (!reviver || !reviver.valid) return;
            reviver.emit(DeathEvents.toClient.reviveComplete);
            Rebar.player.useAnimation(reviver).clear();
        }, 3100);
    },

    async handleDeath(player: alt.Player) {
        if (!player || !player.valid) return;

        const document = Rebar.document.character.useCharacter(player);
        if (!document.isValid()) return;

        const charId = document.getField('_id');
        if (TimeOfDeath.has(charId)) return; // bereits in Todesphase

        // Markiere character als tot (persist)
        if (!document.getField('isDead')) await document.set('isDead', true);
        else Internal.processDeath(player);

        alt.log(`[mg-death][PlayerDeath] ${document.getField('name').replaceAll('_', ' ')} wurde bewusstlos.`);
    },

    processDeath(player: alt.Player) {
        if (!player || !player.valid) return;

        const document = Rebar.document.character.useCharacter(player);
        if (!document.isValid()) return;

        const charId = document.getField('_id');

        // spawn am zuletzt gespeicherten char pos, nicht an CharSelect default
        const savedPos = document.getField('pos') ?? player.pos;
        player.spawn(savedPos);

        Rebar.player.useAnimation(player).playInfinite('missfinale_c1@', 'lying_dead_player0', 1);

        // TTL setzen
        const respawnAt = Date.now() + DeathConfig.respawnTime;
        TimeOfDeath.set(charId, respawnAt);
        player.emit(DeathEvents.toClient.startTimer, respawnAt - Date.now());

        // Timer: nach respawnTime den Player freigeben (client notified)
        const timeout = alt.setTimeout(() => {
            if (player && player.valid) player.emit(DeathEvents.toClient.stopTimer);
            alt.clearTimeout(timeout);
            ActiveTasks.delete(charId);
        }, DeathConfig.respawnTime);

        ActiveTasks.set(charId, { timeout });
    }
};

async function init() {
    const charEditorApi = await api.getAsync('character-creator-api');
    charEditorApi.onSkipCreate(Internal.handleSkipCreate);

    // Server Events
    alt.on('playerDeath', Internal.handleDeath);

    // Client Events
    alt.on('rebar:playerCharacterUpdated', Internal.handleCharacterUpdate);
    alt.onClient(DeathEvents.toServer.toggleRevive, Internal.startRevive);
    alt.onClient(DeathEvents.toServer.toggleRespawn, Internal.respawn);
    alt.onClient(DeathEvents.toServer.toggleEms, (player: alt.Player) => {
        const victimData = Rebar.document.character.useCharacter(player);
        if (!victimData || !victimData.isValid()) return;

        const character = victimData.get();
        if (!character.isDead) return;

        // TODO: später Broadcast an Medics; aktuell nur confirm an den Spieler
        Rebar.player.useWebview(player).emit(DeathEvents.toClient.confirmEms);
    });
}

init();