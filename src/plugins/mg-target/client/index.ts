import * as alt from 'alt-client';
import * as natives from 'natives';
import { TargetDefinition } from '../shared/interfaces.js';
import { useRebarClient } from '@Client/index.js';
import { TargetingEvents } from '../shared/events.js';
import { useClientApi } from '@Client/api/index.js';

const Rebar = useRebarClient();
const view = Rebar.webview.useWebview();

let targets: TargetDefinition[] = [];
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
            if (alt.Player.local.isDead || Rebar.menus.isWorldMenuOpen() || Rebar.menus.isNativeMenuOpen() || alt.isMenuOpen() || view.isAnyPageOpen()) return;
            isTargetingActive = true;
            view.emit(TargetingEvents.toClient.showTarget);
            Rebar.player.useControls().setControls(false);
            Rebar.player.useControls().setCameraFrozen(true);
        },
        keyUp: () => {
            if (alt.Player.local.isDead || Rebar.menus.isWorldMenuOpen() || Rebar.menus.isNativeMenuOpen() || alt.isMenuOpen() || view.isAnyPageOpen()) return;
            isTargetingActive = false;
            currentTarget = null;
            view.emit(TargetingEvents.toClient.hideTarget);
            Rebar.player.useControls().setControls(true);
            Rebar.player.useControls().setCameraFrozen(false);
        },
        restrictions: { isOnFoot: true }
    },
    {
        key: alt.KeyCode.MouseRight,
        identifier: 'targeting-trigger-menu',
        description: 'Öffne das InteraktionsmenÜ',
        keyDown: () => {
            if (alt.Player.local.isDead || Rebar.menus.isWorldMenuOpen() || Rebar.menus.isNativeMenuOpen() || alt.isMenuOpen() || view.isAnyPageOpen()) return;
            if (!currentTarget) return;
            view.emit(TargetingEvents.toClient.openMenu, currentTarget.options || []);
            view.showCursor(true);
            Rebar.player.useControls().setControls(false);
        },
        restrictions: { isOnFoot: true }
    },
];

const keyBindApi = await useClientApi().getAsync('keyBinds-api');
keyBinds.forEach(keyBind => keyBindApi.add(keyBind));

alt.onServer(TargetingEvents.toClient.listTargets, (list: TargetDefinition[]) => {
    targets = list;
});

alt.everyTick(() => {
    if (!isTargetingActive) return;

    const hit = getScreenRaycastHit();
    let matchedTarget: TargetDefinition | null = null;

    view.emit(TargetingEvents.toClient.hasTarget, hit);

    if (hit) {
        matchedTarget = findMatchingTarget(hit);

        if (!matchedTarget && hit.entity !== 0) {
            try { Rebar.screen.text.drawText3D(`Model: ${natives.getEntityModel(hit.entity)}`, hit.pos, 0.5, new alt.RGBA(255, 255, 255, 155), new alt.Vector2(0, 0.02));} 
            catch(err) { }
        }
    }
    
    if (matchedTarget && (!currentTarget || currentTarget.id !== matchedTarget.id)) {
        currentTarget = matchedTarget;
    } else if (!matchedTarget && currentTarget) {
        currentTarget = null;
    }

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

function findMatchingTarget(hit: { entity: number; pos: alt.Vector3 }): TargetDefinition | null {
    for (const t of targets) {
        if (t.type === 'model' && hit.entity && natives.getEntityModel(hit.entity) === t.model) return t;
        if (t.type === 'entity' && hit.entity && t.entityId === hit.entity) return t;
        if (t.type === 'zone' && t.position && t.radius) {
            const dist = natives.getDistanceBetweenCoords(
                hit.pos.x, hit.pos.y, hit.pos.z,
                t.position.x, t.position.y, t.position.z,
                true
            );
            if (dist <= t.radius) return t;
        }
    }
    return null;
}

function getScreenRaycastHit(): { entity: number; pos: alt.Vector3 } | null {
    const player = alt.Player.local.scriptID;
    const camPos = natives.getGameplayCamCoord();
    const camRot = natives.getGameplayCamRot(2);
    const dir = Rebar.utility.math.rotationToDirection(camRot);
    const end = { x: camPos.x + dir.x * 6, y: camPos.y + dir.y * 6, z: camPos.z + dir.z * 6 };

    const ray = natives.startExpensiveSynchronousShapeTestLosProbe(
        camPos.x, camPos.y, camPos.z, end.x, end.y, end.z, -1, player, 0
    );
    const [_, hit, hitCoords, _surfaceNormal, entityHit] = natives.getShapeTestResult(ray);

    return !hit ? null : { entity: entityHit, pos: hitCoords };
}