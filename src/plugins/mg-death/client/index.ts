import * as alt from 'alt-client';
import * as natives from 'natives';
import { useRebarClient } from '@Client/index.js';
import { DeathEvents } from '../shared/events.js';

const Rebar = useRebarClient();
const view = Rebar.webview.useWebview();

const NOTRUF_KEY = 0x47; // G
const RESPAWN_KEY = 0x45; // E
const REVIVE_KEY = 0x48; // H

let canRespawn = false;
let calledEMS = false;
let isReviving = false;

alt.onServer(DeathEvents.toClient.reviveProgress, (progress: number) => {
    view.emit(DeathEvents.toClient.reviveProgress, progress);
});

alt.onServer(DeathEvents.toClient.startRevive, () => {
    view.emit(DeathEvents.toClient.startRevive);
});

alt.onServer(DeathEvents.toClient.stopRevive, () => {
    view.emit(DeathEvents.toClient.stopRevive);
    isReviving = false;
});

alt.onServer(DeathEvents.toClient.reviveComplete, () => {
    view.emit(DeathEvents.toClient.reviveComplete);
    isReviving = false;
});

alt.onServer(DeathEvents.toClient.startTimer, () => {
    canRespawn = false;
});

alt.onServer(DeathEvents.toClient.updateTimer, (timeLeft: number) => {
    view.emit(DeathEvents.toClient.updateTimer, timeLeft);
    if (timeLeft <= 0) canRespawn = true;
});

alt.everyTick(() => {
    // ⛑️ Notruf
    if (!calledEMS && alt.Player.local.isDead && alt.isKeyDown(NOTRUF_KEY)) {
        alt.emitServer(DeathEvents.toServer.callEms);
        calledEMS = true;
    }

    // ☠️ Respawn
    if (canRespawn && alt.Player.local.isDead && alt.isKeyDown(RESPAWN_KEY)) {
        natives.doScreenFadeOut(3000);

        alt.setTimeout(() => {
            natives.doScreenFadeIn(3000);
            alt.emitServer(DeathEvents.toServer.toggleRespawn);
            canRespawn = false;
            calledEMS = false;
        }, 3100);
    }

    if (!isReviving && alt.isKeyDown(REVIVE_KEY)) {
        const closest = getClosestPlayer(3.0);
        if (closest && closest.isDead) {
            alt.emitServer(DeathEvents.toServer.reviveTarget, closest);
            isReviving = true;
        }
    }
});

// 🔍 Utility: Nächster Spieler
function getClosestPlayer(radius: number): alt.Player | null {
    let closest: alt.Player | null = null;
    let minDist = radius;
    let players = [...alt.Player.all];
    for (const player of players) {
        if (!player.valid || player.id === alt.Player.local.id) continue;
        const dist = natives.getDistanceBetweenCoords(
            player.pos.x, player.pos.y, player.pos.z,
            alt.Player.local.pos.x, alt.Player.local.pos.y, alt.Player.local.pos.z,
            true
        );
        if (dist < minDist) {
            closest = player;
            minDist = dist;
        }
    }

    return closest;
}
