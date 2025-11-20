import * as alt from 'alt-client';
import * as native from 'natives';
import { AdminEvents } from '../shared/events.js';
import { useInstructionalButtons } from '@Client/screen/instructionalButtons.js';
import { useRebarClient } from '@Client/index.js';

const Rebar = useRebarClient();
const view = Rebar.webview.useWebview();
const instructionalButtons = useInstructionalButtons();
const invertX = false;

let noClip = false;
let speedMultiplier = 1.0;
let alphaPulse = 255;
let pulseDir = -3;
let cam: number | null = null;
let camHeading = 0;
let camPitch = 0;
let overlayAlpha = 0;
let overlayTimer = 0;

const keyBind: KeyInfo = {
    identifier: 'toggle-no-clip',
    description: 'Geistermodus de-/aktivieren',
    key: alt.KeyCode.F3,
    keyDown: async () => {
        if (alt.isConsoleOpen() || alt.isMenuOpen() || view.isAnyPageOpen()) return;
        noClip = await alt.emitRpc(AdminEvents.toServer.ghosting.toggle);
    },
    restrictions: { isOnFoot: true }
};

alt.onServer(AdminEvents.toClient.ghosting.toggle, (state: boolean) => {
    noClip = state;
    const player = alt.Player.local;

    if (state) {
        instructionalButtons.create([
            { input: '~INPUT_MOVE_UP_ONLY~', text: 'Vorwärts' },
            { input: '~INPUT_MOVE_DOWN_ONLY~', text: 'Rückwärts' },
            { input: '~INPUT_MOVE_LEFT_ONLY~', text: 'Links' },
            { input: '~INPUT_MOVE_RIGHT_ONLY~', text: 'Rechts' },
            { input: '~INPUT_JUMP~', text: 'Hoch' },
            { input: '~INPUT_LOOK_BEHIND~', text: 'Runter' },
            { input: '~INPUT_SPRINT~', text: 'Schnell' },
            { input: '~INPUT_FRONTEND_RS~', text: 'Langsam' },
        ]);
        
        if (!cam) {
            cam = native.createCamWithParams('DEFAULT_SCRIPTED_CAMERA', player.pos.x, player.pos.y, player.pos.z + 1.5, 0, 0, 0, 75, true, 2);
            native.setCamActive(cam, true);
            native.renderScriptCams(true, false, 0, true, false, 0);
            camHeading = player.rot.z;
        }

        alphaPulse = 180;
        overlayAlpha = 255;
        overlayTimer = Date.now() + 2500;
    } else {
        instructionalButtons.destroy();
        native.resetEntityAlpha(player.scriptID);

        if (cam) {
            native.renderScriptCams(false, false, 0, true, false, 0);
            native.destroyCam(cam, true);
            cam = null;
        }
        overlayAlpha = 255;
        overlayTimer = Date.now() + 2000;
    }
});

alt.everyTick(() => {
    const player = alt.Player.local;
    if (!noClip) return;

    renderOverlay();

    // Alpha-Puls Effekt
    alphaPulse += pulseDir;
    if (alphaPulse <= 80) pulseDir = +3;
    if (alphaPulse >= 180) pulseDir = -3;
    native.setEntityAlpha(player.scriptID, alphaPulse, false);

    // Kamera-Rotation via Mausachsen
    const dx = native.getDisabledControlNormal(0, 1); // LookLeftRight
    const dy = native.getDisabledControlNormal(0, 2); // LookUpDown
    camHeading += dx * 5 * (invertX ? -1 : 1);
    camPitch -= dy * 5;
    camPitch = Math.max(-89, Math.min(89, camPitch));

    // Bewegungsrichtung
    const camDir = headingPitchToVector(camHeading, camPitch);

    // Speed Control
    if (alt.isKeyDown(alt.KeyCode.Shift)) speedMultiplier = 3.0;
    else if (alt.isKeyDown(alt.KeyCode.Ctrl)) speedMultiplier = 0.5;
    else speedMultiplier = 1.0;

    // Position berechnen
    let pos = { ...player.pos };

    if (alt.isKeyDown(alt.KeyCode.W)) {
        pos.x += camDir.x * speedMultiplier;
        pos.y += camDir.y * speedMultiplier;
        pos.z += camDir.z * speedMultiplier;
    }
    if (alt.isKeyDown(alt.KeyCode.S)) {
        pos.x -= camDir.x * speedMultiplier;
        pos.y -= camDir.y * speedMultiplier;
        pos.z -= camDir.z * speedMultiplier;
    }
    if (alt.isKeyDown(alt.KeyCode.A)) {
        pos.x -= camDir.y * speedMultiplier;
        pos.y += camDir.x * speedMultiplier;
    }
    if (alt.isKeyDown(alt.KeyCode.D)) {
        pos.x += camDir.y * speedMultiplier;
        pos.y -= camDir.x * speedMultiplier;
    }
    if (alt.isKeyDown(alt.KeyCode.Space)) pos.z += 0.5 * speedMultiplier;
    if (alt.isKeyDown(alt.KeyCode.C)) pos.z -= 0.5 * speedMultiplier;

    player.pos = new alt.Vector3(pos);

    // Kamera setzen
    if (cam) {
        native.setCamCoord(cam, pos.x, pos.y, pos.z + 1.5);
        native.pointCamAtCoord(cam, pos.x + camDir.x, pos.y + camDir.y, pos.z + camDir.z + 1.5);
    }

    disableControls();
});

function headingPitchToVector(heading: number, pitch: number) {
    const h = heading * (Math.PI / 180);
    const p = pitch * (Math.PI / 180);
    const cosP = Math.cos(p);
    return { x: Math.sin(h) * cosP, y: Math.cos(h) * cosP, z: Math.sin(p) };
}

function renderOverlay() {
    if (overlayAlpha <= 0) return;

    const now = Date.now();
    if (now > overlayTimer) overlayAlpha -= 2;

    native.setTextFont(4);
    native.setTextScale(0.45, 0.45);
    native.setTextColour(255, 255, 255, overlayAlpha);
    native.setTextOutline();
    native.setTextCentre(false);
    native.beginTextCommandDisplayText("STRING");
    native.addTextComponentSubstringPlayerName(`~b~Geistermodus ~s~AKTIV`);
    native.endTextCommandDisplayText(0.5, 0.05, 0);
}

function disableControls() {
    for (let i = 0; i < 32; i++) {
        native.disableControlAction(0, i, true);
    }
}

async function init() {
    const keyBindApi = await Rebar.useClientApi().getAsync('keyBinds-api');
    if (!keyBindApi) return;
    keyBindApi.add(keyBind);
}
init();