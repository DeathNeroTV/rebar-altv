import * as alt from 'alt-client';
import * as natives from 'natives';
import { TargetDefinition } from '../shared/interfaces.js';
import { useRebarClient } from '@Client/index.js';
import { TargetingEvents } from '../shared/events.js';

const Rebar = useRebarClient();
const view = Rebar.webview.useWebview();


let targets: TargetDefinition[] = [];
let currentTarget: TargetDefinition | null = null;
let isTargetingActive = false;

const COLOR_ACTIVE = { r: 0, g: 180, b: 255, a: 255 }; // hellblau
const COLOR_IDLE = { r: 255, g: 255, b: 255, a: 200 }; // weiß

alt.onServer(TargetingEvents.toClient.listTargets, (list: TargetDefinition[]) => {
    targets = list;
});

alt.on('keydown', (key: alt.KeyCode) => {
    if (key !== alt.KeyCode.Alt) return;
    isTargetingActive = true;
    view.emit(TargetingEvents.toClient.showTarget);
});

alt.on('mousedown', (button: number) => {
    if (!currentTarget) return;
    if (button !== 1) return;

    view.emit(TargetingEvents.toClient.openMenu, currentTarget.options || []);
});

alt.on('keyup', (key: alt.KeyCode) => {
    if (key !== alt.KeyCode.Alt) return;
    isTargetingActive = false;
    if (currentTarget) {
        currentTarget = null;
        view.emit(TargetingEvents.toClient.hideTarget);
    }
});

alt.everyTick(() => {
    if (!isTargetingActive) return;

    const hit = getScreenRaycastHit();
    let matchedTarget: TargetDefinition | null = null;

    if (hit) matchedTarget = findMatchingTarget(hit);

    if (matchedTarget && (!currentTarget || currentTarget.id !== matchedTarget.id)) {
        currentTarget = matchedTarget;
        view.emit(TargetingEvents.toClient.hasTarget, true);
    } else if (!matchedTarget && currentTarget) {
        currentTarget = null;
        view.emit(TargetingEvents.toClient.hasTarget, false);
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
    const [hit, hitCoords, _surfaceNormal, entityHit] = natives.getShapeTestResult(ray) as unknown as [
        number, number[], number[], number
    ];

    if (!hit) return null;
    return {
        entity: entityHit,
        pos: new alt.Vector3(hitCoords[0], hitCoords[1], hitCoords[2])
    };
}