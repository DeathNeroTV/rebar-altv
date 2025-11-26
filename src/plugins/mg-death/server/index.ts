import * as alt from 'alt-server';

import { useRebar } from '@Server/index.js';
import * as Utility from '@Shared/utility/index.js';

import { DeathConfig } from '../shared/config.js';
import { DeathEvents } from '../shared/events.js';
import { useMedicalService } from './services.js';
import { useHelicopter } from './controller.js';
import { circleUntilFree, findFreePosition, getSafeGroundZ, setHelipadUsage } from './functions.js';
import { MissionFlag, MissionType } from '../shared/enums.js';
import { Marker, MarkerType } from '@Shared/types/marker.js';
import { useConfigService } from '@Plugins/mg-configs/server/service.js';
import { DefaultConfig } from '@Plugins/mg-configs/shared/interfaces.js';

const Rebar = useRebar();
const notifyApi = await Rebar.useApi().getAsync('notify-api');
let config: Record<string, any> = DeathConfig;

const ReservedLandingSpots: alt.IVector3[] = [];

const TimeOfDeath: Map<string, number> = new Map();
const ActiveTasks: Map<string, number> = new Map();
const ActiveRescue: Map<string, { pilot: alt.Ped, helicopter: alt.Vehicle }> = new Map();
const ActiveLabels: Map<string, ReturnType<typeof Rebar.controllers.useTextLabelGlobal>> = new Map();

//debug draws
const padMarkers: Map<string, ReturnType<typeof Rebar.controllers.useMarkerGlobal>> = new Map();

const handleRescue = async (player: alt.Player) => {
    if (!player || !player.valid) return;

    const world = Rebar.player.useWorld(player);
    const natives = Rebar.player.useNative(player); 
    const { name: hospitalName, pos: hospitalPos, rot: hospitalRot } = useMedicalService().hospital(player.pos);
    natives.invoke('placeObjectOnGroundProperly', player);

    const startZ = await getSafeGroundZ(player.pos.x, player.pos.y, player.pos.z, natives);
    if (startZ === null) {
        notifyApi.general.send(player, {
            icon: notifyApi.general.getTypes().INFO,
            title: hospitalName,
            subtitle: 'Notfallzentrum',
            message: 'Keinen sicheren Landeplatz gefunden!',
            duration: 5000
        });
        await useMedicalService().respawn(player); 
        notifyApi.general.send(player, {
            icon: notifyApi.general.getTypes().SUCCESS,
            title: hospitalName,
            subtitle: 'Notfallzentrum',
            message: 'Bitte lassen Sie sich nochmal nachbehandeln.',
            duration: 5000
        });
        player.emit(DeathEvents.toClient.disableControls, false);
        return;
    }

    const heliPos = await findFreePosition({ ...player.pos, z: startZ }, 'polmav', natives, ReservedLandingSpots, 2);

    if (!heliPos) {
        notifyApi.general.send(player, {
            icon: notifyApi.general.getTypes().INFO,
            title: hospitalName,
            subtitle: 'Notfallzentrum',
            message: 'Keinen sicheren Landeplatz gefunden!',
            duration: 5000
        });
        await useMedicalService().respawn(player); 
        player.emit(DeathEvents.toClient.disableControls, false);
        notifyApi.general.send(player, {
            icon: notifyApi.general.getTypes().SUCCESS,
            title: hospitalName,
            subtitle: 'Notfallzentrum',
            message: 'Bitte lassen Sie sich nochmal nachbehandeln.',
            duration: 5000
        });
        return;
    }

    ReservedLandingSpots.push(heliPos);

    notifyApi.general.send(player, { 
        icon: notifyApi.general.getTypes().INFO, 
        title: hospitalName, 
        subtitle: 'Notfallzentrum', 
        message: 'Es wurde ein Rettungshelikopter entsendet', 
        oggFile: 'notification', 
        duration: 5000
    }); 

    const headingToPlayer = Math.atan2(player.pos.y - heliPos.y, player.pos.x - heliPos.x) * (180 / Math.PI);
    const heading = headingToPlayer - 90;
    const rad = (heading + 90) * (Math.PI / 180);
    const leftX = Math.cos(rad);
    const leftY = Math.sin(rad);
    const startRot = new alt.Vector3(0, 0, heading);
    const pilotPos = { x: heliPos.x + leftX * 2, y: heliPos.y + leftY * 2, z: startZ + 1 }; 
    
    player.emit(DeathEvents.toClient.disableControls, true);
    world.setScreenFade(1000); 
    await alt.Utils.wait(1200);
    player.spawn(player.pos);
    player.playAnimation('missfinale_c1@', 'lying_dead_player0', 8.0, 8.0, -1, 1);
    await alt.Utils.wait(100);
    
    const helicopter = new alt.Vehicle('polmav', new alt.Vector3(heliPos.x, heliPos.y, heliPos.z), startRot);
    const pilot = new alt.Ped('s_m_m_pilot_02', new alt.Vector3(pilotPos.x, pilotPos.y, pilotPos.z), startRot);
    
    helicopter.livery = 2; 
    helicopter.setNetOwner(player); 
    pilot.setNetOwner(player); 

    const ped = Rebar.controllers.usePed(pilot); 
    ped.setOption('makeStupid', true);

    natives.invoke('placeObjectOnGroundProperly', helicopter);
    natives.invoke('placeObjectOnGroundProperly', pilot);

    const flyCtrl = useHelicopter(player, pilot, helicopter, ped, natives); 

    const cleanup = () => {
        const index = ReservedLandingSpots.indexOf(heliPos!);
        if (index !== -1) ReservedLandingSpots.splice(index, 1);
    };
    
    const document = Rebar.document.character.useCharacter(player);
    if (!document.isValid()) {
        try { helicopter.destroy(); } catch {} 
        try { pilot.destroy(); } catch {} 
        cleanup();
        try {
            await useMedicalService().respawn(player); 
            notifyApi.general.send(player, {
                icon: notifyApi.general.getTypes().SUCCESS,
                title: hospitalName,
                subtitle: 'Notfallzentrum',
                message: 'Bitte lassen Sie sich nochmal durch die Ärzte im Krankenhaus nachbehandeln.',
                oggFile: 'notification'
            });
            player.emit(DeathEvents.toClient.disableControls, false);
        } catch {}
        return;
    }

    const charId = document.getField('_id');
    const resetAction = async () => {
        ActiveRescue.delete(charId);
        try { helicopter.destroy(); } catch {} 
        try { pilot.destroy(); } catch {} 
        cleanup();
        try {
            await useMedicalService().respawn(player); 
            notifyApi.general.send(player, {
                icon: notifyApi.general.getTypes().SUCCESS,
                title: hospitalName,
                subtitle: 'Notfallzentrum',
                message: 'Bitte lassen Sie sich nochmal durch die Ärzte im Krankenhaus nachbehandeln.',
                oggFile: 'notification'
            });
            player.emit(DeathEvents.toClient.disableControls, false);
        } catch {}
    };

    if (ActiveLabels.has(charId)) {
        const label = ActiveLabels.get(charId)!;
        label.destroy();
        ActiveLabels.delete(charId);
    }

    if (ActiveRescue.has(charId)) {
        const data = ActiveRescue.get(charId)!;
        try { data.helicopter.destroy(); } catch {} 
        try {data. pilot.destroy(); } catch {} 
    }

    if (TimeOfDeath.has(charId)) TimeOfDeath.delete(charId);

    if (ActiveTasks.has(charId)) {
        const timeout = ActiveTasks.get(charId)!;
        if (timeout) alt.clearTimeout(timeout);
        ActiveTasks.delete(charId);
    }

    ActiveRescue.set(charId, { helicopter, pilot });
    player.emit(DeathEvents.toClient.respawned);
    await document.setBulk({ pos: player.pos, rot: player.rot });
    
    player.frozen = false; 
    player.clearTasks(); 
    await alt.Utils.wait(500);
    world.setScreenFade(0); 
    await alt.Utils.wait(1000);
    player.clearTasks();
    await alt.Utils.wait(500);
    player.setIntoVehicle(helicopter, 4);
    world.clearScreenFade(3000);
    await alt.Utils.wait(1500);

    const okIn = await flyCtrl.getIn(); 
    if (!okIn) {
        await resetAction();
        cleanup();
        return;
    }

    const okTakeOff = await flyCtrl.takeoff(heliPos.x, heliPos.y, heliPos.z + 20, { 
        heading: -1, maxHeight: -1, minHeight: -1, 
        missionFlags: MissionFlag.StartEngineImmediately, 
        missionType: MissionType.GoTo, 
        radius: 10, slowDistance: -1, speed: 12 
    }); 
    if (!okTakeOff) {
        await resetAction();
        return;
    }

    const okClimb = await flyCtrl.climb(heliPos.x, heliPos.y, heliPos.z + 45, { 
        heading: -1, maxHeight: -1, minHeight: -1, 
        missionFlags: MissionFlag.None, 
        missionType: MissionType.GoTo, 
        radius: 5, slowDistance: -1, speed: 20 
    }); 
    if (!okClimb) {
        await resetAction();
        return;
    }

    const okCruise = await flyCtrl.cruise(hospitalPos.x, hospitalPos.y, hospitalPos.z + 45, { 
        heading: -1, maxHeight: -1, minHeight: -1, 
        missionFlags: MissionFlag.HeightMapOnlyAvoidance,
        missionType: MissionType.GoTo, 
        radius: 8, slowDistance: -1, speed: 50 
    }); 
    if (!okCruise) {
        await resetAction();
        return;
    }

    const helipad = await circleUntilFree(flyCtrl, hospitalName, new alt.Vector3(hospitalPos), 5000);
    setHelipadUsage(helipad.name, true);
    
    const okDesc1 = await flyCtrl.descend(helipad.pos.x, helipad.pos.y, helipad.pos.z + 20, { 
        heading: -1, maxHeight: -1, minHeight: -1, 
        missionFlags: MissionFlag.None, 
        missionType: MissionType.GoTo, 
        radius: 5, slowDistance: -1, speed: 20 
    });
    if (!okDesc1) {
        await resetAction();
        setHelipadUsage(helipad.name, false);
        return;
    }

    const okDesc2 = await flyCtrl.descend(helipad.pos.x, helipad.pos.y, helipad.pos.z + 5, { 
        heading: -1, maxHeight: -1, minHeight: -1, 
        missionFlags: MissionFlag.None, 
        missionType: MissionType.GoTo, 
        radius: 3, slowDistance: -1, speed: 12
    });
    if (!okDesc2) {
        await resetAction();
        setHelipadUsage(helipad.name, false);
        return;
    }

    const okLand = await flyCtrl.land(helipad.pos.x, helipad.pos.y, helipad.pos.z, { 
        heading: -1, maxHeight: -1, minHeight: -1, 
        missionFlags: MissionFlag.LandOnArrival,
        missionType: MissionType.LandAndWait, 
        radius: 3, slowDistance: -1, speed: 12
    });
    if (!okLand) {
        await resetAction();
        setHelipadUsage(helipad.name, false);
        return;
    }

    try {
        helicopter.pos = new alt.Vector3(helipad.pos);
        helicopter.rot = new alt.Vector3(helipad.rot);
        natives.invoke('placeObjectOnGroundProperly', helicopter);
    } catch {}

    await alt.Utils.wait(1000);

    const okOut = await flyCtrl.getOut();
    if (!okOut) {
        await resetAction();
        setHelipadUsage(helipad.name, false);
        return;
    }

    try {
        natives.invoke('taskLeaveVehicle', player, helicopter, 1);
        while (await natives.invokeWithResult('isPedInAnyVehicle', player, false))
            await alt.Utils.wait(100);
        player.rot = new alt.Vector3(hospitalRot);
        player.playAnimation('missfinale_c1@', 'lying_dead_player0', 8.0, 8.0, -1, 1);
        await resetAction();
        setHelipadUsage(helipad.name, false);
    } catch {}
};

const handleDeathScreen = async (player: alt.Player) => {
    Rebar.player.useWebview(player).show('DeathScreen', 'persistent');
    const document = Rebar.document.character.useCharacter(player);
    if (!document.isValid()) return;

    if (document.getField('isDead')) 
        await useMedicalService().unconscious(player);
};

Rebar.services.useServiceRegister().register('medicalService', {
    hospital(pos: alt.IVector3) {
        const sorted = config.hospitals.slice().sort((a, b) => {
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

        await document.setBulk({ isDead: true, health: 124, food: 100, water: 100, armour: 0 });

        const charId = document.getField('_id');
        const label = Rebar.controllers.useTextLabelGlobal({ 
            pos: player.pos, 
            text: '[H] - Person stabilisieren', 
            dimension: player.dimension, 
            uid: `reanimate-${charId}`
        }, 3.0);
        ActiveLabels.set(charId, label);

        // TTL setzen
        const respawnAt = Date.now() + config.respawnTime;
        TimeOfDeath.set(charId, respawnAt);
        player.emit(DeathEvents.toClient.startTimer, respawnAt - Date.now());

        if (ActiveTasks.has(charId)) 
            alt.clearTimeout(ActiveTasks.get(charId)!);

        const timeout = alt.setTimeout(() => {
            if (player && player.valid) player.emit(DeathEvents.toClient.stopTimer);

            alt.clearTimeout(timeout);
            ActiveTasks.delete(charId);
        }, config.respawnTime);
        ActiveTasks.set(charId, timeout);
    },

    async revive(reviver: alt.Player, victim: alt.Player) {
        if (!reviver || !victim || !reviver.valid || !victim.valid) return;
        //TODO: Abfrage ob Mediziner im Dienst sind, sende Dispatch zu diesen!

        const natives = Rebar.player.useNative(reviver);
        const victimDoc = Rebar.document.character.useCharacter(victim);
        if (!victimDoc.isValid() || !victimDoc.getField('isDead')) return;
        victim.frozen = true;
        natives.invoke('placeObjectOnGroundProperly', victim);

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

        victim.spawn(victim.pos);
        reviver.clearTasks();
        victim.clearTasks();
        reviver.playAnimation('mini@cpr@char_a@cpr_def', 'cpr_intro', 8.0, 8.0, 5000, 1);
        victim.playAnimation('mini@cpr@char_b@cpr_def', 'cpr_intro', 8.0, 8.0, 5000, 1);
        natives.invoke('placeObjectOnGroundProperly', victim);

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
        alt.setTimeout(() => player.clearTasks(), config.coolDown);
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

        Rebar.player.useWorld(player).setScreenFade(config.fadeDelay);
        await alt.Utils.wait(config.coolDown);

        player.frozen = false;
        player.spawn(data.pos);
        player.pos = new alt.Vector3(data.pos);
        player.clearBloodDamage();
        player.emit(DeathEvents.toClient.respawned);
        Rebar.player.useWorld(player).clearScreenFade(config.fadeDelay);
    },

    async respawn(player: alt.Player, pos: alt.IVector3) {
        if (!player || !player.valid) return;

        const document = Rebar.document.character.useCharacter(player);
        if (!document.isValid() || !document.getField('isDead')) return;

        // Aufräumen: alle temporären Einträge
        const world = Rebar.player.useWorld(player);
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
        const { pos: hospitalPos, rot: hospitalRot } = useMedicalService().hospital(player.pos);
        const data = pos ? { pos, rot: player.rot } : { pos: hospitalPos, rot: hospitalRot };

        await document.setBulk({
            isDead: false,
            food: 100,
            water: 100,
            health: 124,
            pos: data.pos,
            rot: data.rot,
        });

        // Visual respawn
        world.setScreenFade(config.fadeDelay);
        await alt.Utils.wait(config.coolDown);

        player.spawn(data.pos);
        player.frozen = false;
        player.pos = new alt.Vector3(data.pos);
        player.rot = new alt.Vector3(data.rot);
        player.clearTasks();
        player.clearBloodDamage();
        world.clearScreenFade(config.fadeDelay);
        player.emit(DeathEvents.toClient.respawned);
    },

    called(player: alt.Player) {
        const document = Rebar.document.character.useCharacter(player);
        if (!document.isValid() || !document.getField('isDead')) return;
        player.emit(DeathEvents.toClient.confirmEms);

        // TODO: später Broadcast an Medics; aktuell nur confirm an den Spieler
    },
});

alt.on('mg-config:createdConfig', async (_id: string) => {
    const cfg = await useConfigService().get(_id);
    if (cfg.name !== 'DeathScreen-Einstellungen') return;
    if (cfg && cfg.data) config = cfg.data;
    else config = DeathConfig;
});

alt.on('mg-config:changedConfig', (changed: boolean, _id: string, key: keyof DefaultConfig, value: DefaultConfig[keyof DefaultConfig]) => {
    if (!changed) return;
    if (key === 'name' || key === '_id') return;
    if (!(key in config)) return;
    config[key] = value;
});

async function init() {
    const charEditorApi = await Rebar.useApi().getAsync('character-creator-api');
    if (!charEditorApi) {
        alt.logError('[mg-death]', 'character-creator-api not found');
        return;
    }

    charEditorApi.onCreate(handleDeathScreen);
    charEditorApi.onSkipCreate(handleDeathScreen);

    await useConfigService().create('DeathScreen-Einstellungen', DeathConfig);

    for (const helipad of config.helipads) {
        const marker: Marker = {
            type: MarkerType.FLAT_CIRCLE_SKINNY_SPLIT,
            pos: { ...helipad.pos, z: helipad.pos.z - 0.9 },
            scale: new alt.Vector3(10),
            bobUpAndDown: false,
            faceCamera: false,
            rotate: true,
            color: new alt.RGBA(255, 0, 0, 100),
            uid: helipad.name,
        };
        const markerCtrl = Rebar.controllers.useMarkerGlobal(marker);
        padMarkers.set(marker.uid, markerCtrl);
    }

    // Server Events
    alt.on('playerDeath', async (player: alt.Player) => {
        const document = Rebar.document.character.useCharacter(player);
        if (!document.isValid() || document.getField('isDead')) return;
        //TODO: handle log entry for character death with time and data
        alt.log('[mg-death]', document.getField('name') ?? player.name, 'ist ohnmächtig geworden');
        await useMedicalService().unconscious(player);
    });

    // Client Events
    alt.onClient(DeathEvents.toServer.reviveComplete, useMedicalService().revived);
    alt.onClient(DeathEvents.toServer.toggleRevive, useMedicalService().revive);
    alt.onClient(DeathEvents.toServer.toggleRespawn, handleRescue);
    alt.onClient(DeathEvents.toServer.toggleEms, useMedicalService().called);
}
init();

alt.on('rebar:onTick', () => {
    // [H] Input Nachricht
    for (const [charId, label] of ActiveLabels.entries()) {
        if (!label) {
            ActiveLabels.delete(charId);
            continue;
        }

        const baseLabel = label.getLabel();
        if (!baseLabel) {
            ActiveLabels.delete(charId);
            continue;
        }

        const player = alt.Player.all.find(x => {
            if (!x || !x.valid) return false;
            const charDoc = Rebar.document.character.useCharacter(x);
            if (!charDoc || !charDoc.isValid()) return false;
            return charDoc.getField('_id') === charId;
        });
        if (!player || !player.valid) continue;

        const distance = Utility.vector.distance(player.pos, baseLabel.pos);
        if (distance <= 0.5) continue;

        try { label.update({ pos: { ...player.pos, z: player.pos.z + 0.5 } }); } 
        catch {}
    }
});