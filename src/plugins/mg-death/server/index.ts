import * as alt from 'alt-server';
import { useRebar } from '@Server/index.js';
import * as Utility from '@Shared/utility/index.js';

import { DeathConfig } from '../shared/config.js';
import { DeathEvents } from '../shared/events.js';
import { Character } from '@Shared/types/character.js';

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

    async handleCharacterUpdate(player: alt.Player, key: keyof Character, value: any) {
        const document = Rebar.document.character.useCharacter(player);
        if (!document.isValid() || key !== 'isDead') return;
        if (!value) return;

        await document.set('pos', player.pos);
        Internal.processDeath(player);
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
        const victimId = victimData.getField('_id');

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
        await Internal.respawn(data.victim, data.victim.pos, data.reviver);
    },

    async respawn(player: alt.Player, pos?: alt.Vector3, reviver?: alt.Player) {
        if (!player || !player.valid) return;
        
        const document = Rebar.document.character.useCharacter(player);
        if (!document.isValid() || !document.getField('isDead')) return;

        player.frozen = false;

        const charId = document.getField('_id');

        if (ActiveRevives.has(charId)) 
            ActiveRevives.delete(charId);
        
        if (TimeOfDeath.has(charId))
            TimeOfDeath.delete(charId);

        if (ActiveTimers.has(charId)) {
            if (ActiveTimers.get(charId)!) 
                alt.clearTimeout(ActiveTimers.get(charId)!);
            ActiveTimers.delete(charId);
        }

        const newPos = pos ?? Internal.getClosestHospital(player.pos);
        await document.setBulk({ isDead: false, food: 100, water: 100, health: 124, pos: newPos, dimension: player.dimension });

        Rebar.player.useWorld(player).setScreenFade(3000);
        player.spawn(newPos, 2900);

        alt.setTimeout(() => {
            player.emit(DeathEvents.toClient.reviveComplete);
            Rebar.player.useWebview(player).emit(DeathEvents.toClient.respawned);
            Rebar.player.useAnimation(player).clear();
            Rebar.player.useWorld(player).clearScreenFade(3000);
            Rebar.player.useState(player).sync();
            player.clearBloodDamage();

            if (!reviver) return;
            reviver.emit(DeathEvents.toClient.reviveComplete);
            Rebar.player.useAnimation(reviver).clear();
        }, 3100);
    },

    async handleDeath(player: alt.Player) {
        if (!player || !player.valid) return;

        const document = Rebar.document.character.useCharacter(player);
        if (!document.isValid()) return;

        const charId = document.getField('_id');
        if (TimeOfDeath.has(charId)) return;

        if (!document.getField('isDead')) await document.set('isDead', true);
        else Internal.processDeath(player);

        alt.log('[mg-death][PlayerDeath]', `${document.getField('name').replaceAll('_', ' ')} wurde bewusstlos.`);
    },

    processDeath(player: alt.Player) {
        if (!player || !player.valid) return;

        const document = Rebar.document.character.useCharacter(player);
        if (!document.isValid() || document.getField('isDead')) return;

        const charId = document.getField('_id');
        player.spawn(document.getField('pos'));

        Rebar.player.useAnimation(player).playInfinite('missfinale_c1@', 'lying_dead_player0', 1);
        TimeOfDeath.set(charId, Date.now() + DeathConfig.respawnTime);

        player.emit(DeathEvents.toClient.startTimer, TimeOfDeath.get(charId) - Date.now());

        const interval = alt.setTimeout(() => {
            if (player && player.valid) 
                player.emit(DeathEvents.toClient.stopTimer);
    
            alt.clearTimeout(interval);
            ActiveTimers.delete(charId);
        }, DeathConfig.respawnTime);
        ActiveTimers.set(charId, interval);
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
        if (!victimData) return;

        const character = victimData.get();
        if (!character.isDead) return;
        
        //TODO: handle ems notification to all medics
        Rebar.player.useWebview(player).emit(DeathEvents.toClient.confirmEms);
    });
}

init();