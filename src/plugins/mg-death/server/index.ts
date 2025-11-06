import * as alt from 'alt-server';
import { useRebar } from '@Server/index.js';
import * as Utility from '@Shared/utility/index.js';
import { DeathConfig } from '../shared/config.js';
import { DeathEvents } from '../shared/events.js';

const Rebar = useRebar();
const api = Rebar.useApi();

const TimeOfDeath: Map<string, number> = new Map();
const ActiveTimers: Map<string, number> = new Map();
const ActiveRevives: Map<string, { reviver: alt.Player; victim: alt.Player; interval: number }> = new Map();

const Internal = {
    handleSkipCreate(player: alt.Player) {
        if (!player || !player.valid) return;

        const document = Rebar.document.character.useCharacter(player);
        if (!document.isValid()) return;

        Rebar.player.useWebview(player).show('DeathScreen', 'overlay');
        Internal.syncDeathAndReviveStates(player);
    },

    syncDeathAndReviveStates(player: alt.Player) {
        // 1️⃣ Tote Spieler synchronisieren
        for (const [charId] of TimeOfDeath.entries()) {
            if (ActiveRevives.has(charId)) continue;
            const deadPlayer = [...alt.Player.all].find(p => {
                const doc = Rebar.document.character.useCharacter(p);
                if (!doc.isValid()) return false;
                return doc.getField('_id') === charId;
            });

            if (!deadPlayer || !deadPlayer.valid) continue;
            player.emit(DeathEvents.toClient.animation.play, 'missfinale_c1@', 'lying_dead_player0', deadPlayer);
        }

        // 2️⃣ Laufende Revives synchronisieren
        for (const [_, data] of ActiveRevives.entries()) {
            if (!data.victim || !data.reviver || !data.victim.valid || !data.reviver.valid) continue;
            player.emit(DeathEvents.toClient.animation.play, 'mini@cpr@char_a@cpr_str', 'cpr_pumpchest_idle');
            player.emit(DeathEvents.toClient.animation.play, 'mini@cpr@char_b@cpr_str', 'cpr_pumpchest_idle', data.victim);
        }
    },

    getClosestHospital(pos: alt.IVector3): alt.IVector3 {
        const sortedByDistance = DeathConfig.hospitals.sort((a, b) => {
            const distA = Utility.vector.distance(pos, a);
            const distB = Utility.vector.distance(pos, b);
            return distA - distB;
        });
        return sortedByDistance[0];
    },

    revivePlayer(reviver: alt.Player, victim: alt.Player) {
        if (!reviver || !victim || !reviver.valid || !victim.valid) return;

        const victimData = Rebar.document.character.useCharacter(victim);
        if (!victimData.isValid()) return;

        const victimId = victimData.getField('_id');

        const distance = Utility.vector.distance(reviver.pos, victim.pos);
        if (distance > 3) return;

        // Start der Progress-Animation
        let progress = 0;
        reviver.emit(DeathEvents.toClient.startRevive);
        victim.emit(DeathEvents.toClient.startRevive);
        victim.spawn(victim.pos);

        Rebar.player.useAnimation(reviver).playInfinite('mini@cpr@char_a@cpr_str', 'cpr_pumpchest_idle', 1, 1.0, -1.0, 1.0);
        Rebar.player.useAnimation(victim).playInfinite('mini@cpr@char_b@cpr_str', 'cpr_pumpchest_idle', 1, 1.0, -1.0, 1.0);

        const interval = alt.setInterval(() => {
            if (!reviver || !victim || !reviver.valid || !victim.valid) { 
                alt.clearInterval(interval);
                if (ActiveRevives.has(victimId))
                    ActiveRevives.delete(victimId);
                return;
            }

            progress += 5;

            if (progress > 100) {
                Internal.completeRevive(victimId);
                return;
            }

            reviver.emit(DeathEvents.toClient.reviveProgress, progress);
            victim.emit(DeathEvents.toClient.reviveProgress, progress);
        }, DeathConfig.reviveTime / 20);

        ActiveRevives.set(victimId, { reviver, victim, interval });
    },

    async completeRevive(charId: string) {
        if (TimeOfDeath.has(charId))
            TimeOfDeath.delete(charId);

        if (ActiveTimers.has(charId)) {
            if (ActiveTimers.get(charId)!) 
                alt.clearTimeout(ActiveTimers.get(charId)!);
            ActiveTimers.delete(charId);
        }

        if (!ActiveRevives.has(charId)) return;

        const data = ActiveRevives.get(charId);
        if (data.interval) alt.clearInterval(data.interval);

        if (data.reviver && data.reviver.valid) {
            data.reviver.emit(DeathEvents.toClient.reviveComplete);
            alt.setTimeout(() => data.reviver.clearTasks(), 3500);
        }

        if (data.victim  && data.victim.valid) {
            const document = Rebar.document.character.useCharacter(data.victim);
            if (document.isValid()) 
                await document.setBulk({ health: 124, isDead: false, water: 100, food: 100, pos: data.victim.pos, dimension: data.victim.dimension });

            Rebar.player.useWorld(data.victim).setScreenFade(3000);
            Rebar.player.useWebview(data.victim).emit(DeathEvents.toClient.respawned);

            data.victim.emit(DeathEvents.toClient.reviveComplete);

            alt.setTimeout(() => {
                data.victim.clearTasks();
                Rebar.player.useWorld(data.victim).clearScreenFade(3000);
                Rebar.player.useState(data.victim).sync();
                data.victim.clearBloodDamage();
                ActiveRevives.delete(charId);
            }, 3500);
        }
    },

    async respawn(player: alt.Player) {
        if (!player || !player.valid) return;

        const document = Rebar.document.character.useCharacter(player);
        if (!document.isValid()) return;

        const charId = document.getField('_id');
        
        if (TimeOfDeath.has(charId))
            TimeOfDeath.delete(charId);

        if (ActiveRevives.has(charId)) {
            if (ActiveRevives.get(charId)!.interval) 
                alt.clearInterval(ActiveRevives.get(charId)!.interval);
            ActiveRevives.delete(charId);
        }

        if (ActiveTimers.has(charId)) {
            if (ActiveTimers.get(charId)!) 
                alt.clearTimeout(ActiveTimers.get(charId)!);
            ActiveTimers.delete(charId);
        }

        const pos = Internal.getClosestHospital(player.pos);
        await document.setBulk({ isDead: false, food: 100, water: 100, health: 124, pos, dimension: player.dimension });

        Rebar.player.useWorld(player).setScreenFade(3000);
        player.spawn(pos.x, pos.y, pos.z, 2900);
        Rebar.player.useWebview(player).emit(DeathEvents.toClient.respawned);

        alt.setTimeout(() => {
            alt.emitAllClients(DeathEvents.toClient.animation.stop, player);
            Rebar.player.useWorld(player).clearScreenFade(3000);
            Rebar.player.useState(player).sync();
            player.clearBloodDamage();
        }, 3500);
    },

    async handleDeath(player: alt.Player) {
        if (!player || !player.valid) return;

        const document = Rebar.document.character.useCharacter(player);
        if (!document.isValid()) return;

        const charId = document.getField('_id');
        if (TimeOfDeath.has(charId)) return;

        await document.set('isDead', true);

        alt.emitAllClients(DeathEvents.toClient.animation.play, 'missfinale_c1@', 'lying_dead_player0', player);

        TimeOfDeath.set(charId, Date.now() + DeathConfig.respawnTime);
        player.emit(DeathEvents.toClient.startTimer, TimeOfDeath.get(charId) - Date.now());
        
        const interval = alt.setTimeout(() => {
            player.emit(DeathEvents.toClient.stopTimer);
            alt.clearTimeout(interval);
            ActiveTimers.delete(charId);
        }, DeathConfig.respawnTime);

        ActiveTimers.set(charId, interval);
        alt.log('[mg-death][PlayerDeath]', `${document.getField('name').replaceAll('_', ' ')} wurde bewusstlos.`);
    },
};

async function init() {
    const charEditorApi = await api.getAsync('character-creator-api');
    charEditorApi.onSkipCreate(Internal.handleSkipCreate);

    // Server Events
    alt.on('playerDeath', Internal.handleDeath);

    // Client Events
    alt.onClient(DeathEvents.toServer.reviveTarget, Internal.revivePlayer);
    alt.onClient(DeathEvents.toServer.toggleRespawn, Internal.respawn);
    alt.onClient(DeathEvents.toServer.callEms, (player: alt.Player) => {
        const victimData = Rebar.document.character.useCharacter(player);
        if (!victimData) return;

        const character = victimData.get();
        if (!character.isDead) return;
        
        //TODO: handle ems notification to all medics
        Rebar.player.useWebview(player).emit(DeathEvents.toClient.confirmEms);
    });
}

init();