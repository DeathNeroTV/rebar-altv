import * as alt from 'alt-client';
import * as natives from 'natives';
import { useRebarClient } from '@Client/index.js';
import { DeathEvents } from '../shared/events.js';

const Rebar = useRebarClient();
const view = Rebar.webview.useWebview();

const NOTRUF_KEY = 0x47; // G
const RESPAWN_KEY = 0x45; // E

let canRespawn = false;
let calledEMS = false;

alt.everyTick(() => {
    // Notruf
    if (!calledEMS && alt.isKeyDown(NOTRUF_KEY)) {
        alt.emitServer(DeathEvents.toServer.callEms);
        calledEMS = true;
    }

    // Respawn
    if (canRespawn && alt.isKeyDown(RESPAWN_KEY)) {
        natives.doScreenFadeOut(3000);

        alt.setTimeout(() => {
            natives.doScreenFadeIn(3000);            
            alt.emitServer(DeathEvents.toServer.toggleRespawn);
            canRespawn = false;
            calledEMS = false;
        }, 3100);
        
    }
});

alt.onServer(DeathEvents.toClient.startTimer, () => {
    view.show('DeathScreen', 'overlay');
    canRespawn = false;
});

alt.onServer(DeathEvents.toClient.updateTimer, (timeLeft: number) => {
    view.emit(DeathEvents.toClient.updateTimer, timeLeft);
    if (timeLeft <= 0) canRespawn = true;
});
