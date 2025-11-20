import * as alt from 'alt-server';

import { useRebar } from '@Server/index.js';
import * as Utility from '@Shared/utility/index.js';

import { DeathConfig } from '../shared/config.js';
import { DeathEvents } from '../shared/events.js';
import { useMedicalService } from './services.js';
import { useHelicopter } from './controller.js';
import { ensureValidation, findHospitalHelipad, getSafeGroundZ } from './functions.js';

const Rebar = useRebar();
const notifyApi = await Rebar.useApi().getAsync('notify-api');

const TimeOfDeath: Map<string, number> = new Map();
const ActiveTasks: Map<string, number> = new Map();
const ActiveRescue: Map<string, { pilot: alt.Ped, helicopter: alt.Vehicle }> = new Map();
const ActiveLabels: Map<string, ReturnType<typeof Rebar.controllers.useTextLabelGlobal>> = new Map();

const handleRescue = async (player: alt.Player) => {
    if (!player || !player.valid) return;

    const document = Rebar.document.character.useCharacter(player);
    if (!document.isValid()) return;

    const charId = document.getField('_id');
    player.emit(DeathEvents.toClient.toggleControls, false); 

    const { name: hospitalName, pos: hospitalPos, rot: hospitalRot } = useMedicalService().hospital(player.pos);     
    const world = Rebar.player.useWorld(player);
    const natives = Rebar.player.useNative(player); 

    notifyApi.general.send(player, { 
        icon: notifyApi.general.getTypes().INFO, 
        title: hospitalName, 
        subtitle: 'Notfallzentrum', 
        message: 'Es wurde ein Rettungshelikopter entsendet', 
        oggFile: 'notification', 
    }); 
        
    const heliHeading = player.rot.z * (Math.PI / 180); 
    const offsetHeli = { x: Math.cos(heliHeading + Math.PI / 2) * 1, y: Math.sin(heliHeading + Math.PI / 2) * 1, z: 0 }; 
    const offsetPilot = { x: Math.cos(heliHeading + Math.PI / 2) * 2, y: Math.sin(heliHeading + Math.PI / 2) * 2, z: 0 }; 
    const startPos = { x: player.pos.x + offsetHeli.x, y: player.pos.y + offsetHeli.y, z: player.pos.z + 1.5 }; 
    const pilotPos = { x: player.pos.x + offsetPilot.x, y: player.pos.y + offsetPilot.y, z: player.pos.z + 1 }; 
    
    world.setScreenFade(1000); 
    await alt.Utils.wait(1000);
    
    const helicopter = new alt.Vehicle('polmav', startPos, player.rot); 
    const pilot = new alt.Ped('s_m_m_pilot_02', pilotPos, player.rot); 
    await ensureValidation(pilot, helicopter, 15, 100); 
    ActiveRescue.set(charId, { helicopter, pilot });
    
    helicopter.livery = 2; 
    helicopter.setNetOwner(player); 
    pilot.setNetOwner(player); 
    
    const ped = Rebar.controllers.usePed(pilot); 
    ped.setOption('makeStupid', true);

    const flyCtrl = useHelicopter(player, pilot, helicopter, ped, natives); 
    
    player.frozen = false; 
    player.clearTasks(); 
    player.setIntoVehicle(helicopter, 4); 
    await alt.Utils.wait(2000); 
    Rebar.player.useWorld(player).clearScreenFade(1000); 
    await alt.Utils.wait(1000);
    await flyCtrl.getIn(15); 
    
    const { pos: finalPos, rot: finalRot } = await findHospitalHelipad(new alt.Vector3(hospitalPos), natives); 
    const finalZ = await getSafeGroundZ(finalPos.x, finalPos.y, finalPos.z, natives); 
    await flyCtrl.takeoff(startPos.z + 20); 
    await flyCtrl.climb(startPos.z + 45); 
    await flyCtrl.cruise(finalPos.x, finalPos.y, finalZ + 45); 
    await flyCtrl.descend(finalPos.x, finalPos.y, finalZ + 15); 
    await flyCtrl.descend(finalPos.x, finalPos.y, finalZ + 5); 
    await flyCtrl.land(finalPos.x, finalPos.y, finalZ); 
    await flyCtrl.getOut(15);
    
    if (!pilot || !pilot.valid || !helicopter || !helicopter.valid || !player || !player.valid) { 
        try { helicopter.destroy(); } catch {} 
        try { pilot.destroy(); } catch {} 
        return; 
    } 
    
    await alt.Utils.wait(2000); 
    if (player && player.valid) { 
        player.playAnimation('missfinale_c1@', 'lying_dead_player0', 8.0, 8.0, -1, 1); 
        await useMedicalService().respawn(player); 
    }
};

const handleDeathScreen = (player: alt.Player) => {
    Rebar.player.useWebview(player).show('DeathScreen', 'overlay');
    Rebar.player.useClothing(player).sync();
    Rebar.player.useWeapon(player).sync();
    Rebar.player.useState(player).sync();
};

Rebar.services.useServiceRegister().register('medicalService', {
    hospital(pos: alt.IVector3) {
        const sorted = DeathConfig.hospitals.slice().sort((a, b) => {
            const distA = Utility.vector.distance(pos, a.pos);
            const distB = Utility.vector.distance(pos, b.pos);
            return distA - distB;
        });
        return { name: sorted[0].name, pos: sorted[0].pos, rot: sorted[0].rot };
    },

    async unconscious(player: alt.Player) {
        if (!player || !player.valid) return;

        const document = Rebar.document.character.useCharacter(player);
        if (!document.isValid()) return;

        await document.setBulk({ isDead: true, health: 99, food: 100, water: 100, armour: 0, pos: player.pos, rot: player.rot });

        const charId = document.getField('_id');
        const savedPos = document.getField('pos') ?? player.pos;
        player.spawn(savedPos);
        player.pos = new alt.Vector3(savedPos);
        player.health = 124;
        player.playAnimation('missfinale_c1@', 'lying_dead_player0', 8.0, 8.0, -1, 1);
        alt.setTimeout(() => (player.frozen = true), 2000);

        const label = Rebar.controllers.useTextLabelGlobal(
            {
                pos: savedPos,
                text: '[H] - Person stabilisieren',
                dimension: player.dimension,
                uid: `reanimate-${charId}`,
            },
            3.0,
        );
        ActiveLabels.set(charId, label);

        // TTL setzen
        const respawnAt = Date.now() + DeathConfig.respawnTime;
        TimeOfDeath.set(charId, respawnAt);
        player.emit(DeathEvents.toClient.startTimer, respawnAt - Date.now());

        if (ActiveTasks.has(charId)) 
            alt.clearTimeout(ActiveTasks.get(charId)!);

        const timeout = alt.setTimeout(() => {
            if (player && player.valid) player.emit(DeathEvents.toClient.stopTimer);

            alt.clearTimeout(timeout);
            ActiveTasks.delete(charId);
        }, DeathConfig.respawnTime);
        ActiveTasks.set(charId, timeout);
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

        if (ActiveRescue.has(charId)) {
            const { pilot, helicopter } = ActiveRescue.get(charId);
            try { helicopter.destroy(); } catch {}
            try { pilot.destroy(); } catch {}
            ActiveRescue.delete(charId);
        }

        if (TimeOfDeath.has(charId)) TimeOfDeath.delete(charId);

        if (ActiveTasks.has(charId)) {
            const timeout = ActiveTasks.get(charId)!;
            if (timeout) alt.clearTimeout(timeout);
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
            dimension: player.dimension,
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

        if (ActiveRescue.has(charId)) {
            const { pilot, helicopter } = ActiveRescue.get(charId);
            try { helicopter.destroy(); } catch {}
            try { pilot.destroy(); } catch {}
            ActiveRescue.delete(charId);
        }

        if (TimeOfDeath.has(charId)) TimeOfDeath.delete(charId);

        if (ActiveTasks.has(charId)) {
            const timeout = ActiveTasks.get(charId)!;
            if (timeout) alt.clearTimeout(timeout);
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
    if (!charEditorApi) {
        alt.logError('[mg-death]', 'character-creator-api not found');
        return;
    }

    charEditorApi.onCreate(handleDeathScreen);
    charEditorApi.onSkipCreate(handleDeathScreen);

    // Server Events
    alt.on('playerDimensionChange', async (player: alt.Player, oldDim: number, newDim: number) => {
        const document = Rebar.document.character.useCharacter(player);
        if (!document.isValid()) return;
        await document.set('dimension', newDim);
    });
    alt.on('playerInteriorChange', async (player: alt.Player, oldInt: number, newInt: number) => {
        const document = Rebar.document.character.useCharacter(player);
        if (!document.isValid()) return;
        await document.set('interior', newInt);
    });
    alt.on('playerDeath', useMedicalService().unconscious);

    // Client Events
    alt.onClient(DeathEvents.toServer.reviveComplete, useMedicalService().revived);
    alt.onClient(DeathEvents.toServer.toggleRevive, useMedicalService().revive);
    alt.onClient(DeathEvents.toServer.toggleRespawn, handleRescue);
    alt.onClient(DeathEvents.toServer.toggleEms, useMedicalService().called);
}
init();
