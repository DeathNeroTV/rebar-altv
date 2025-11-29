import * as alt from 'alt-client';
import * as natives from 'natives';
import { RayCastHit, TargetDefinition } from '../shared/interfaces.js';
import { useRebarClient } from '@Client/index.js';
import { TargetingEvents } from '../shared/events.js';
import { useClientApi } from '@Client/api/index.js';

const Rebar = useRebarClient();
const view = Rebar.webview.useWebview();

const targets: TargetDefinition[] = [];
let currentTarget: TargetDefinition | null = null;
let isTargetingActive = false;
let isMenuOpen = false;

const COLOR_ACTIVE = { r: 0, g: 135, b: 54, a: 255 };
const COLOR_IDLE = { r: 155, g: 155, b: 155, a: 175 };

const keyBinds: KeyInfo[] = [
    {
        key: alt.KeyCode.Alt,
        identifier: 'targeting-toggle-eye',
        description: 'Zeige/Verstecke das dritte Auge',
        keyDown: () => {
            if (Rebar.menus.isWorldMenuOpen() || Rebar.menus.isNativeMenuOpen() || alt.isMenuOpen() || view.isAnyPageOpen() || isMenuOpen) return;
            isTargetingActive = true;
            Rebar.player.useControls().setAttackControlsDisabled(true);
            view.emit(TargetingEvents.toClient.showTarget);
        },
        keyUp: () => {
            if (Rebar.menus.isWorldMenuOpen() || Rebar.menus.isNativeMenuOpen() || alt.isMenuOpen() || view.isAnyPageOpen() || isMenuOpen) return;
            isTargetingActive = false;
            currentTarget = null;
            Rebar.player.useControls().setAttackControlsDisabled(false);
            view.emit(TargetingEvents.toClient.hideTarget);
        }
    },
    {
        key: alt.KeyCode.MouseLeft,
        identifier: 'targeting-trigger-menu',
        description: 'Öffne das InteraktionsmenÜ',
        keyDown: () => {
            if (Rebar.menus.isWorldMenuOpen() || Rebar.menus.isNativeMenuOpen() || alt.isMenuOpen() || view.isAnyPageOpen()) return;
            if (!currentTarget) return;
            isMenuOpen = true;
            view.emit(TargetingEvents.toClient.openMenu, currentTarget.options);
            view.focus();
            Rebar.player.useControls().setControls(false);
        }
    },
];

const keyBindApi = await useClientApi().getAsync('keyBinds-api');
keyBinds.forEach(keyBind => keyBindApi.add(keyBind));

view.on(TargetingEvents.toClient.hideTarget, () => {
    isMenuOpen = false;
    isTargetingActive = false;
    currentTarget = null;
    view.unfocus();
    Rebar.player.useControls().setControls(true);
    view.emit(TargetingEvents.toClient.hideTarget);
});

alt.onServer(TargetingEvents.toClient.listTargets, (newTargets: TargetDefinition[]) => {
    if (!Array.isArray(newTargets) || newTargets.length === 0) return;

    for (const t of newTargets) {
        const exists = targets.some(x => x.id === t.id);
        if (!exists) targets.push(t);
    }
});

alt.everyTick(() => {
    if (!isTargetingActive) return;

    const hit = raycastForward();
    if (!hit) {
        if (currentTarget) {
            currentTarget = null;
            view.emit(TargetingEvents.toClient.hasTarget, false);
        }
        return;
    }

    const matched = matchTarget(hit);
    view.emit(TargetingEvents.toClient.hasTarget, !!matched);

    if (matched && (!currentTarget || currentTarget.id !== matched.id)) {
        currentTarget = matched;
    } else if (!matched && currentTarget) {
        currentTarget = null;
    }

    drawAllTargetDots(matched);
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

        const dist = natives.getDistanceBetweenCoords(alt.Player.local.pos.x, alt.Player.local.pos.y, alt.Player.local.pos.z, pos.x, pos.y, pos.z, true);
        if (dist > t.radius) continue;

        const width = 0.02;
        const height = width * natives.getAspectRatio(false);
        const color = active && active.id === t.id ? COLOR_ACTIVE : COLOR_IDLE;

        natives.requestStreamedTextureDict('shared', true);
        if (!natives.hasStreamedTextureDictLoaded('shared')) continue;
        natives.setDrawOrigin(pos.x, pos.y, pos.z, false);
        natives.drawSprite('shared', 'emptydot_32', 0, 0, width, height, 0, color.r, color.g, color.b, color.a, false, 0);
    }
    natives.clearDrawOrigin();
}

function matchTarget(hit: RayCastHit) {
    for (const t of targets) {
        // Entity
        if (t.type === 'entity' && t.entityId === hit.entityHit) {
            return t;
        }

        // Model
        if (t.type === 'model') {
            const model = natives.getEntityModel(hit.entityHit);
            if (model === t.model) return t;
        }

        // Zone
        if (t.type === 'zone') {
            const dist = natives.getDistanceBetweenCoords(
                hit.pos.x, hit.pos.y, hit.pos.z,
                t.position.x, t.position.y, t.position.z,
                false
            );

            if (dist <= t.radius) return t;
        }
    }

    return null;
}

function raycastForward(maxDistance: number = 25): { pos: alt.Vector3, entityHit: number } | null {
    const camPos = natives.getGameplayCamCoord();
    const camRot = natives.getGameplayCamRot(2);
    const dir = Rebar.utility.math.rotationToDirection(camRot);
    const end = { x: camPos.x + dir.x * maxDistance, y: camPos.y + dir.y * maxDistance, z: camPos.z + dir.z * maxDistance };
    const entity = alt.Player.local.vehicle ?? alt.Player.local;
    const mask = 1|2|4|8|16|32|256;
    const result = natives.startShapeTestLosProbe(camPos.x, camPos.y, camPos.z, end.x, end.y, end.z, mask, entity, 4);
    const [_, hit, hitPos, _surfaceNormal, entityHit] = natives.getShapeTestResult(result);
    return !hit ? { pos: entity.pos, entityHit: 0 } : { pos: new alt.Vector3(hitPos.x, hitPos.y, hitPos.z), entityHit };
}