import * as alt from 'alt-client';
import * as native from 'natives';
import { useRebarClient } from '@Client/index.js';
import { useWebview } from '@Client/webview/index.js';

const Rebar = useRebarClient();
const view = useWebview();

let camera: number | null = null;
let peds: { [key: number]: number } = {};
let currentCamTarget: number | null = null;
let cameraInterval: number | null = null;

alt.onServer('charselect:characters', (characters: any[], maxChars: number) => {
    native.displayRadar(false);
    native.freezeEntityPosition(alt.Player.local.scriptID, true);

    if (characters.length > 0) {
        const pos = characters[0].pos;
        setupCamera(pos.x, pos.y, pos.z);
    }

    // Charaktere spawnen
    characters.forEach((char) => {
        const ped = native.createPed(
            4,
            alt.hash(char.skin),
            char.pos.x,
            char.pos.y,
            char.pos.z,
            180,
            false,
            false
        );
        native.taskStandStill(ped, -1);
        peds[char.id] = ped;
    });

    view.show('CharacterSelect', 'page');
    view.emit('charselect:characters', characters, maxChars)
});

alt.onServer('charselect:focusCamera', (charId: number) => {
    if (currentCamTarget === charId) return;
    currentCamTarget = charId;

    if (!peds[charId]) return;
    
    const pos = native.getEntityCoords(peds[charId], true);
    smoothMoveCameraTo(pos.x, pos.y + 2, pos.z + 1.2, pos.x, pos.y, pos.z + 1.0, 700);
});

alt.onServer('charselect:fadeOut', () => {
    if (!camera) return;

    native.doScreenFadeOut(1000);

    alt.setTimeout(() => {
        if (camera) {
            native.renderScriptCams(false, false, 0, true, false);
            native.destroyCam(camera, true);
            camera = null;
        }

        for (const pedId in peds) {
            native.deletePed(peds[pedId]);
        }
        peds = {};

        native.displayRadar(true);
        native.freezeEntityPosition(alt.Player.local.scriptID, false);

        alt.setTimeout(() => {
            native.doScreenFadeIn(800);
        }, 1200);
    }, 1000);
});

function setupCamera(x: number, y: number, z: number) {
    if (camera) native.destroyCam(camera, true);
    camera = native.createCamWithParams(
        'DEFAULT_SCRIPTED_CAMERA',
        x,
        y + 2,
        z + 1.2,
        0,
        0,
        0,
        60.0,
        true,
        0
    );
    native.pointCamAtCoord(camera, x, y, z + 1.0);
    native.setCamActive(camera, true);
    native.renderScriptCams(true, false, 0, true, false);
}

function smoothMoveCameraTo(x: number, y: number, z: number, lookX: number, lookY: number, lookZ: number, duration: number = 800) {
    if (!camera) return;

    if (cameraInterval) {
        alt.clearInterval(cameraInterval);
        cameraInterval = null;
    }

    const camPos = native.getCamCoord(camera);
    const camRot = native.getCamRot(camera, 2);
    const start = Date.now();

    cameraInterval = alt.setInterval(() => {
        const progress = Math.min(1, (Date.now() - start) / duration);
        const ease = 1 - Math.pow(1 - progress, 3); // cubic easeOut

        const newX = camPos.x + (x - camPos.x) * ease;
        const newY = camPos.y + (y - camPos.y) * ease;
        const newZ = camPos.z + (z - camPos.z) * ease;

        native.setCamCoord(camera!, newX, newY, newZ);
        native.pointCamAtCoord(camera!, lookX, lookY, lookZ);

        if (progress >= 1) {
            alt.clearInterval(cameraInterval!);
            cameraInterval = null;
        }
    }, 16);
}