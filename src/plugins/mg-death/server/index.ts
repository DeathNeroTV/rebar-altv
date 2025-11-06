import * as alt from 'alt-server';
import { useRebar } from '@Server/index.js';
import * as Utility from '@Shared/utility/index.js';
import { DeathConfig } from '../shared/config.js';
import { DeathEvents } from '../shared/events.js';

const Rebar = useRebar();
const api = Rebar.useApi();

const TimeOfDeath: Map<string, number> = new Map();
const ActiveTimers: Map<string, number> = new Map();
const ActiveRevives: Map<string, number> = new Map();

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

    revivePlayer(reviver: alt.Player, victim: alt.Player) {
        if (!reviver || !victim || !reviver.valid || !victim.valid) return;

        const victimData = Rebar.document.character.useCharacter(victim);
        if (!victimData.isValid()) return;

        const charId = victimData.getField('_id');

        // Abbruch, falls schon ein Revive läuft
        if (ActiveRevives.has(charId)) return;

        // Entfernung prüfen
        const distance = Utility.vector.distance(reviver.pos, victim.pos);
        if (distance > 3) return;

        // Start der Progress-Animation
        let progress = 0;
        reviver.emit(DeathEvents.toClient.startRevive);
        victim.emit(DeathEvents.toClient.startRevive);

        reviver.playAnimation('mini@cpr@char_a@cpr_str', 'cpr_pumpchest', 8.0, -8.0, DeathConfig.reviveTime, 1, 1.0, true, true, true);
        victim.playAnimation('mini@cpr@char_b@cpr_str', 'cpr_pumpchest', 8.0, -8.0, DeathConfig.reviveTime, 1, 1.0, true, true, true);

        const interval = alt.setInterval(() => {
            if (!reviver.valid || !victim.valid) {
                Internal.stopRevive(reviver, victim);
                return;
            }

            const distNow = Utility.vector.distance(reviver.pos, victim.pos);
            if (distNow > 3.5) {
                Internal.stopRevive(reviver, victim);
                return;
            }

            progress += 5;

            if (progress >= 100) {
                Internal.completeRevive(reviver, victim);
                return;
            }

            reviver.emit(DeathEvents.toClient.reviveProgress, progress);
            victim.emit(DeathEvents.toClient.reviveProgress, progress);
        }, DeathConfig.reviveTime / 20);

        ActiveRevives.set(charId, interval);
    },

    stopRevive(reviver: alt.Player, victim: alt.Player) {
        if (!reviver || !victim || !reviver.valid || !victim.valid) return;

        const victimData = Rebar.document.character.useCharacter(victim);
        if (!victimData.isValid()) return;

        const charId = victimData.getField('_id');

        if (TimeOfDeath.has(charId))
            TimeOfDeath.delete(charId);

        if (ActiveRevives.has(charId)) {
            if (ActiveRevives.get(charId)!) 
                alt.clearInterval(ActiveRevives.get(charId)!);
            ActiveRevives.delete(charId);
        }

        if (ActiveTimers.has(charId)) {
            if (ActiveTimers.get(charId)!) 
                alt.clearTimeout(ActiveTimers.get(charId)!);
            ActiveTimers.delete(charId);
        }

        Rebar.player.useWebview(reviver).emit(DeathEvents.toClient.stopRevive);
        Rebar.player.useWebview(victim).emit(DeathEvents.toClient.stopRevive);

        victim.clearTasks();
        reviver.clearTasks();
    },

    completeRevive(reviver: alt.Player, victim: alt.Player) {
        if (!reviver || !victim || !reviver.valid || !victim.valid) return;
        
        const victimData = Rebar.document.character.useCharacter(victim);
        if (!victimData.isValid()) return;

        const charId = victimData.getField('_id');

        if (TimeOfDeath.has(charId))
            TimeOfDeath.delete(charId);

        if (ActiveRevives.has(charId)) {
            if (ActiveRevives.get(charId)!) 
                alt.clearInterval(ActiveRevives.get(charId)!);
            ActiveRevives.delete(charId);
        }        

        if (ActiveTimers.has(charId)) {
            if (ActiveTimers.get(charId)!) 
                alt.clearTimeout(ActiveTimers.get(charId)!);
            ActiveTimers.delete(charId);
        }

        victim.clearTasks();
        reviver.clearTasks();

        reviver.emit(DeathEvents.toClient.reviveComplete);
        victim.emit(DeathEvents.toClient.reviveComplete);
        Internal.respawn(victim, victim.pos);
    },

    async respawn(player: alt.Player, pos?: alt.IVector3) {
        if (!player || !player.valid) return;

        const document = Rebar.document.character.useCharacter(player);
        if (!document.isValid || !document.getField('isDead')) return;

        const charId = document.getField('_id');
        
        if (TimeOfDeath.has(charId))
            TimeOfDeath.delete(charId);

        if (ActiveRevives.has(charId)) {
            if (ActiveRevives.get(charId)!) 
                alt.clearInterval(ActiveRevives.get(charId)!);
            ActiveRevives.delete(charId);
        }

        if (ActiveTimers.has(charId)) {
            if (ActiveTimers.get(charId)!) 
                alt.clearTimeout(ActiveTimers.get(charId)!);
            ActiveTimers.delete(charId);
        }

        const newPosition = pos ?? Internal.getClosestHospital(player.pos);
        await document.setBulk({ 
            isDead: false, 
            food: 100, 
            water: 100, 
            health: 124,
            pos: new alt.Vector3(newPosition),
            rot: player.rot,
            dimension: player.dimension
        });

        Rebar.player.useWorld(player).setScreenFade(3000);
        player.spawn(newPosition.x, newPosition.y, newPosition.z, 2900);
        Rebar.player.useWebview(player).emit(DeathEvents.toClient.respawned);

        alt.setTimeout(() => {
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