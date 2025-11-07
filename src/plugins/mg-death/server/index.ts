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
    },

    getClosestHospital(pos: alt.IVector3): alt.IVector3 {
        const sortedByDistance = DeathConfig.hospitals.sort((a, b) => {
            const distA = Utility.vector.distance(pos, a);
            const distB = Utility.vector.distance(pos, b);
            return distA - distB;
        });
        return sortedByDistance[0];
    },

    startRevive(reviver: alt.Player, victim: alt.Player) {
        if (!reviver || !victim || !reviver.valid || !victim.valid) return;
        
        const victimData = Rebar.document.character.useCharacter(victim);
        if (!victimData.isValid() || !victimData.getField('isDead')) return;

        victim.spawn(victim.pos);

        Rebar.player.useAnimation(victim).clear();
        Rebar.player.useAnimation(victim).playInfinite('missfinale_c1@', 'lying_dead_player0', 1);
        
        reviver.emit(DeathEvents.toClient.moveTo, victim);
    },

    handleRevive(reviver: alt.Player, victim: alt.Player) {
        if (!reviver || !victim || !reviver.valid || !victim.valid) return;
        
        const victimData = Rebar.document.character.useCharacter(victim);
        if (!victimData.isValid() || !victimData.getField('isDead')) return;
        const victimId = victimData.getField('_id');

        reviver.clearTasks();
        victim.clearTasks();

        reviver.emit(DeathEvents.toClient.startRevive);
        victim.emit(DeathEvents.toClient.startRevive);

        Rebar.player.useAnimation(reviver).playInfinite('mini@cpr@char_a@cpr_str', 'cpr_pumpchest', 1);
        Rebar.player.useAnimation(victim).playInfinite('mini@cpr@char_b@cpr_str', 'cpr_pumpchest', 1);

        let progress = 0;
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
            alt.setTimeout(() => {
                data.reviver.emit(DeathEvents.toClient.reviveComplete);
                Rebar.player.useAnimation(data.reviver).clear();
            }, 3100);
        }

        if (data.victim && data.victim.valid) {            
            const document = Rebar.document.character.useCharacter(data.victim);
            if (document.isValid()) 
                await document.setBulk({ health: 124, isDead: false, water: 100, food: 100, pos: data.victim.pos, dimension: data.victim.dimension });

            Rebar.player.useWorld(data.victim).setScreenFade(3000);

            alt.setTimeout(() => {
                ActiveRevives.delete(charId);
                if (!data.victim || !data.victim.valid) return;
                data.victim.emit(DeathEvents.toClient.reviveComplete);
                Rebar.player.useAnimation(data.victim).clear();
                Rebar.player.useWorld(data.victim).clearScreenFade(3000);
                Rebar.player.useState(data.victim).sync();
                data.victim.clearBloodDamage();
            }, 3100);
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
            Rebar.player.useAnimation(player).clear();
            Rebar.player.useWorld(player).clearScreenFade(3000);
            Rebar.player.useState(player).sync();
            player.clearBloodDamage();
        }, 3100);
    },

    async handleDeath(player: alt.Player) {
        if (!player || !player.valid) return;

        const document = Rebar.document.character.useCharacter(player);
        if (!document.isValid()) return;

        const charId = document.getField('_id');
        if (TimeOfDeath.has(charId)) return;

        await document.set('isDead', true);

        Rebar.player.useAnimation(player).playInfinite('missfinale_c1@', 'lying_dead_player0', 1);

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
    alt.onClient(DeathEvents.toServer.toggleRevive, Internal.startRevive);
    alt.onClient(DeathEvents.toServer.toggleProgress, Internal.handleRevive);
    alt.onClient(DeathEvents.toServer.toggleRespawn, Internal.respawn);
    alt.onClient(DeathEvents.toServer.toggleEms, (player: alt.Player) => {
        const victimData = Rebar.document.character.useCharacter(player);
        if (!victimData) return;

        const character = victimData.get();
        if (!character.isDead) return;
        
        //TODO: handle ems notification to all medics
        Rebar.player.useWebview(player).emit(DeathEvents.toClient.confirmEms);
    });
}

init();