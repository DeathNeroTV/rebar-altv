import * as alt from 'alt-client';
import * as native from 'natives';
import { useRebarClient } from '@Client/index.js';
import { AdminEvents } from '../shared/events.js';
import { useAudio } from '@Composables/useAudio.js';

let noClip = false;
let speedMultiplier = 1.0;

let alphaPulse = 255;
let pulseDir = -3;

// UI Overlay Zustand
let overlayAlpha = 0;
let overlayTimer = 0;

const Rebar = useRebarClient();

// Sounds laden
const sound = useAudio();

alt.onServer(AdminEvents.toClient.ghosting.toggle, (state: boolean) => {
    noClip = state;

    const player = alt.Player.local;
    sound.play('/sounds/ghosting.ogg', 0.25);

    if (state) {
        // Aktivierung
        native.freezeEntityPosition(player.scriptID, true);
        native.setEntityCollision(player.scriptID, false, false);

        // Ghost Optik
        native.setEntityVisible(player.scriptID, false, false);
        alphaPulse = 180;

        // Overlay anzeigen
        overlayAlpha = 255;
        overlayTimer = Date.now() + 2500;
    } else {
        // Deaktivierung
        native.freezeEntityPosition(player.scriptID, false);
        native.setEntityCollision(player.scriptID, true, true);
        native.setEntityVisible(player.scriptID, true, true);
        native.resetEntityAlpha(player.scriptID);

        overlayAlpha = 255;
        overlayTimer = Date.now() + 2000;
    }
});


// MAIN LOOP
alt.everyTick(() => {
    if (!noClip) return;
    renderOverlay();
    renderControlsOverlay();

    const player = alt.Player.local;
    // Alpha-Puls Effekt (leichter Flackereffekt)
    alphaPulse += pulseDir;
    if (alphaPulse <= 80) pulseDir = +3;
    if (alphaPulse >= 180) pulseDir = -3;

    native.setEntityAlpha(player.scriptID, alphaPulse, false);

    // Bewegung
    const camRot = native.getGameplayCamRot(2);
    const camDir = rotationToDirection(camRot);

    let pos = { ...player.pos };

    // Speed Control
    if (alt.isKeyDown(alt.KeyCode.Shift)) speedMultiplier = 3.0;     // SHIFT
    else if (alt.isKeyDown(alt.KeyCode.Ctrl)) speedMultiplier = 0.5; // STRG
    else speedMultiplier = 1.0;

    // Move
    if (alt.isKeyDown(alt.KeyCode.W)) { // W
        pos.x += camDir.x * speedMultiplier;
        pos.y += camDir.y * speedMultiplier;
        pos.z += camDir.z * speedMultiplier;
    }
    if (alt.isKeyDown(alt.KeyCode.S)) { // S
        pos.x -= camDir.x * speedMultiplier;
        pos.y -= camDir.y * speedMultiplier;
        pos.z -= camDir.z * speedMultiplier;
    }
    if (alt.isKeyDown(alt.KeyCode.A)) { // A
        pos.x += camDir.y * speedMultiplier;
        pos.y -= camDir.x * speedMultiplier;
    }
    if (alt.isKeyDown(alt.KeyCode.D)) { // D
        pos.x -= camDir.y * speedMultiplier;
        pos.y += camDir.x * speedMultiplier;
    }

    if (alt.isKeyDown(alt.KeyCode.Space)) pos.z += 0.5 * speedMultiplier; // SPACE
    if (alt.isKeyDown(alt.KeyCode.C)) pos.z -= 0.5 * speedMultiplier; // C
    player.pos = new alt.Vector3(pos);

    disableControls();
});

function renderControlsOverlay() {
    const startX = 0.75; // rechts
    const startY = 0.85; // unten
    const lineHeight = 0.03;
    const alpha = 220;

    const controls = [
        { key: 'W', action: 'Vorwärts' },
        { key: 'S', action: 'Rückwärts' },
        { key: 'A', action: 'Links' },
        { key: 'D', action: 'Rechts' },
        { key: 'SPACE', action: 'Hoch' },
        { key: 'C', action: 'Runter' },
        { key: 'SHIFT', action: 'Schnell' },
        { key: 'CTRL', action: 'Langsam' },
        { key: 'NO CLIP HOTKEY', action: 'Modus an/aus' },
    ];

    native.setTextFont(0);
    native.setTextScale(0.35, 0.35);
    native.setTextColour(255, 255, 255, alpha);
    native.setTextOutline();
    native.setTextCentre(false);

    controls.forEach((ctrl, i) => {
        const y = startY + i * lineHeight;
        native.beginTextCommandDisplayText("STRING");
        native.addTextComponentSubstringPlayerName(`${ctrl.key} → ${ctrl.action}`);
        native.endTextCommandDisplayText(startX, y, 0);
    });
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
    native.addTextComponentSubstringPlayerName(`~b~Geistermodus ~s~${alt.Player.local.frozen ? "~g~AKTIV" : "~r~INAKTIV"}`);
    native.endTextCommandDisplayText(0.5, 0.05, 0); // Top-center
}

function disableControls() {
    for (let i = 0; i < 32; i++) {
        native.disableControlAction(0, i, true);
    }
}

// Kamera-Rotation → Bewegungsrichtung
function rotationToDirection(rot) {
    const z = rot.z * (Math.PI / 180.0);
    const x = rot.x * (Math.PI / 180.0);
    const num = Math.abs(Math.cos(x));
    return {
        x: -Math.sin(z) * num,
        y: Math.cos(z) * num,
        z: Math.sin(x)
    };
}