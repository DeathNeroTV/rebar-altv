import * as alt from 'alt-client';
import * as natives from 'natives';
import { TargetDefinition } from '../shared/interfaces.js';
import { useRebarClient } from '@Client/index.js';
import { TargetingEvents } from '../shared/events.js';
import { useClientApi } from '@Client/api/index.js';

const Rebar = useRebarClient();
const view = Rebar.webview.useWebview();

const targets: TargetDefinition[] = [];
let currentTarget: TargetDefinition | null = null;
let isTargetingActive = false;

const COLOR_ACTIVE = { r: 0, g: 180, b: 255, a: 255 }; // hellblau
const COLOR_IDLE = { r: 255, g: 255, b: 255, a: 200 }; // weiß

const keyBinds: KeyInfo[] = [
    {
        key: alt.KeyCode.Alt,
        identifier: 'targeting-toggle-eye',
        description: 'Zeige/Verstecke das dritte Auge',
        keyDown: () => {
            if (Rebar.menus.isWorldMenuOpen() || Rebar.menus.isNativeMenuOpen() || alt.isMenuOpen() || view.isAnyPageOpen()) return;
            isTargetingActive = true;
            Rebar.player.useControls().setAttackControlsDisabled(true);
            view.emit(TargetingEvents.toClient.showTarget);
        },
        keyUp: () => {
            if (Rebar.menus.isWorldMenuOpen() || Rebar.menus.isNativeMenuOpen() || alt.isMenuOpen() || view.isAnyPageOpen()) return;
            isTargetingActive = false;
            currentTarget = null;
            Rebar.player.useControls().setAttackControlsDisabled(false);
            view.emit(TargetingEvents.toClient.hideTarget);
        }
    },
    {
        key: alt.KeyCode.MouseRight,
        identifier: 'targeting-trigger-menu',
        description: 'Öffne das InteraktionsmenÜ',
        keyDown: () => {
            if (Rebar.menus.isWorldMenuOpen() || Rebar.menus.isNativeMenuOpen() || alt.isMenuOpen() || view.isAnyPageOpen()) return;
            if (!currentTarget) return;
            view.emit(TargetingEvents.toClient.openMenu, currentTarget?.options || []);
            view.showCursor(true);
            Rebar.player.useControls().setControls(false);
        }
    },
];

const keyBindApi = await useClientApi().getAsync('keyBinds-api');
keyBinds.forEach(keyBind => keyBindApi.add(keyBind));

alt.onServer(TargetingEvents.toClient.listTargets, (newTargets: TargetDefinition[]) => {
    newTargets.forEach(t => {
        if (!targets.find(x => x.id === t.id)) targets.push(t); 
    });
    alt.log('targets', targets);
});

alt.everyTick(() => {
    if (!isTargetingActive) return;

    const hit = getScreenRaycastHit();
    const matchedTarget = findMatchingTarget(hit, 45);

    view.emit(TargetingEvents.toClient.hasTarget, !!matchedTarget);
    
    if (matchedTarget && (!currentTarget || currentTarget.id !== matchedTarget.id)) currentTarget = matchedTarget;
    else if (!matchedTarget && currentTarget) currentTarget = null;

    drawAllTargetDots(matchedTarget);
});

function drawAllTargetDots(active?: TargetDefinition | null) {
    for (const t of targets) {
        let pos: alt.Vector3 | undefined;

        if (t.type === 'entity' && t.entityId) {
            if (!natives.doesEntityExist(t.entityId)) continue;
            pos = natives.getEntityCoords(t.entityId, true);
        } else if (t.type === 'zone' && t.position) {
            pos = t.position as alt.Vector3;
        } else if (t.type === 'model' && t.position) {
            pos = t.position as alt.Vector3;
        }

        if (!pos) continue;

        const [onScreen, screenX, screenY] = natives.getScreenCoordFromWorldCoord(
            pos.x,
            pos.y,
            pos.z + 1.0 
        ) as [boolean, number, number];

        if (!onScreen) continue;

        const dist = natives.getDistanceBetweenCoords(
            pos.x, pos.y, pos.z,
            alt.Player.local.pos.x, alt.Player.local.pos.y, alt.Player.local.pos.z,
            true
        );

        const size = Math.max(0.002, 0.008 - dist * 0.0008);
        const color = active && active.id === t.id ? COLOR_ACTIVE : COLOR_IDLE;

        natives.requestStreamedTextureDict('shared', true);
        if (!natives.hasStreamedTextureDictLoaded('shared')) continue;
        natives.drawSprite('shared', 'dot', screenX, screenY, size, size, 0, color.r, color.g, color.b, color.a, false, 0);
    }
}

function findMatchingTarget(hit?: { entity: number; pos: alt.Vector3 }, fovAngle = 30): TargetDefinition | null {
    const playerPos = alt.Player.local.pos;
    const camRot = natives.getGameplayCamRot(2);
    const camDir = Rebar.utility.math.rotationToDirection(camRot);

    // 1️⃣ Prüfe Entities/Models über Raycast
    if (hit) {
        for (const t of targets) {
            if (t.type === 'model' && hit.entity && natives.getEntityModel(hit.entity) === t.model) return t;
            if (t.type === 'entity' && hit.entity && t.entityId === hit.entity) return t;
        }
    }

    // 2️⃣ Prüfe Zonen
    for (const t of targets) {
        if (t.type !== 'zone' || !t.position || !t.radius) continue;

        const dist = natives.getDistanceBetweenCoords(
            playerPos.x, playerPos.y, playerPos.z,
            t.position.x, t.position.y, t.position.z,
            true
        );

        if (dist > t.radius) continue; // Spieler außerhalb der Zone

        // Optional: Sichtlinienprüfung
        const dirToZone = { x: t.position.x - playerPos.x, y: t.position.y - playerPos.y, z: t.position.z - playerPos.z };
        const lengthDir = Math.sqrt(dirToZone.x**2 + dirToZone.y**2 + dirToZone.z**2);
        const lengthCam = Math.sqrt(camDir.x**2 + camDir.y**2 + camDir.z**2);
        const dot = (dirToZone.x * camDir.x + dirToZone.y * camDir.y + dirToZone.z * camDir.z) / (lengthDir * lengthCam);
        const angle = Math.acos(dot) * (180 / Math.PI);
        if (angle <= fovAngle) return t;
    }

    return null;
}

function getScreenRaycastHit(): { entity: number; pos: alt.Vector3 } | null {
    const player = alt.Player.local.scriptID;
    const camPos = natives.getGameplayCamCoord();
    const camRot = natives.getGameplayCamRot(2);
    const dir = Rebar.utility.math.rotationToDirection(camRot);
    const end = { x: camPos.x + dir.x * 6, y: camPos.y + dir.y * 6, z: camPos.z + dir.z * 6 };
    const ray = natives.startExpensiveSynchronousShapeTestLosProbe(camPos.x, camPos.y, camPos.z, end.x, end.y, end.z, 511, player, 4);
    const [_, hit, hitCoords, _surfaceNormal, entityHit] = natives.getShapeTestResult(ray);

    return !hit ? null : { entity: entityHit, pos: hitCoords };
}