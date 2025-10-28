import * as alt from 'alt-server';
import { useRebar } from '@Server/index.js';
import { Character } from '@Shared/types/character.js';
import * as Utility from '@Shared/utility/index.js';
import { DeathConfig } from '../shared/config.js';
import { DeathEvents } from '../shared/events.js';

const Rebar = useRebar();
const api = Rebar.useApi();

const TimeOfDeath: { [_id: string]: number } = {};

const Internal = {
    handleCharacterSelected(player: alt.Player, character: Character) {
        if (character.isDead) {
            player.health = 99;
            TimeOfDeath[character._id.toString()] = Date.now() + DeathConfig.respawnTime;
            player.emit(DeathEvents.toClient.startTimer);
            player.emit(DeathEvents.toClient.updateTimer, TimeOfDeath[character._id.toString()] - Date.now());
            alt.setTimeout(() => 
                player.emit(DeathEvents.toClient.updateTimer, TimeOfDeath[character._id.toString()] - Date.now())
            , DeathConfig.respawnTime);
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

    revivePlayer(victim: alt.Player) {
        if (!victim || !victim.valid) return;

        const victimData = Rebar.document.character.useCharacter(victim);
        if (!victimData) return;
        
        const character = victimData.get();
        if (!character.isDead) return;

        Rebar.player.useWebview(victim).emit(DeathEvents.toClient.startRevive);

        alt.setTimeout(() => {
            Internal.respawn(victim, victim.pos);
            Rebar.player.useWebview(victim).emit(DeathEvents.toClient.stopRevive);
        }, DeathConfig.reviveTime);
    },

    respawn(victim: alt.Player, pos?: alt.IVector3) {
        if (!victim || !victim.valid) return;

        const victimData = Rebar.document.character.useCharacter(victim);
        if (!victimData) return;

        const character = victimData.get();
        if (!character.isDead) return;

        const newPosition = pos ?? Internal.getClosestHospital(victim.pos);
        victimData.set('isDead', false);
        victim.spawn(newPosition.x, newPosition.y, newPosition.z, 0);
        victim.clearBloodDamage();
        Rebar.player.useWorld(victim).clearScreenFade(3000);
        Rebar.player.useWebview(victim).emit(DeathEvents.toClient.respawned);
    },

    handleDefaultDeath(victim: alt.Player) {
        if (!victim || !victim.valid) return;

        const victimData = Rebar.document.character.useCharacter(victim);
        if (!victimData) return;

        const character = victimData.get();
        if (character.isDead) return;

        victimData.set('isDead', true);

        TimeOfDeath[character._id.toString()] = Date.now() + DeathConfig.respawnTime;
        victim.emit(DeathEvents.toClient.startTimer);
        victim.emit(DeathEvents.toClient.updateTimer, TimeOfDeath[character._id.toString()] - Date.now());
        alt.setTimeout(() => 
            victim.emit(DeathEvents.toClient.updateTimer, TimeOfDeath[character._id.toString()] - Date.now())
        , DeathConfig.respawnTime);
    },
};

async function init() {
    await alt.Utils.waitFor(() => api.isReady('character-select-api'), 30000);
    const charSelectApi = api.get('character-select-api');
    charSelectApi.onSelect(Internal.handleCharacterSelected);
    alt.on('playerDeath', Internal.handleDefaultDeath);

    // Client Events
    alt.onClient(DeathEvents.toServer.toggleRespawn, Internal.respawn);
    alt.onClient(DeathEvents.toServer.callEms, (player: alt.Player) => {
        const victimData = Rebar.document.character.useCharacter(player);
        if (!victimData) return;

        const character = victimData.get();
        if (!character.isDead) return;
        
        //TODO: handle ems notification to all medics
        Rebar.player.useWebview(player).emit(DeathEvents.toClient.confirmEms);
    });

    alt.onClient(DeathEvents.toServer.toggleRespawn, (player: alt.Player) => {
        const victimData = Rebar.document.character.useCharacter(player);
        if (!victimData) return;

        const character = victimData.get();
        if (!character.isDead) return;

        const newPosition = Internal.getClosestHospital(player.pos);
        victimData.set('isDead', false);
        player.spawn(newPosition.x, newPosition.y, newPosition.z, 0);
        player.clearBloodDamage();
        Rebar.player.useWebview(player).emit(DeathEvents.toClient.respawned);
    });
}

init();
