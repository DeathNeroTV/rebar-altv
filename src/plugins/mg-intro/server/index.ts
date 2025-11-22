/* 

'./webview/src/main.ts mit unten stehenden code erweitern

import { library } from '@fortawesome/fontawesome-svg-core'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { fas } from '@fortawesome/free-solid-svg-icons';    
import { far } from '@fortawesome/free-regular-svg-icons';    
import { fab } from '@fortawesome/free-brands-svg-icons';    

library.add(fas, far, fab);

app.component('font-awesome-icon', FontAwesomeIcon);
*/
import * as alt from 'alt-server';
import { useRebar } from '@Server/index.js';
import { IntroEvents } from '../shared/events.js';
import { invokeFinished } from './api.js';
import { readdir } from "fs/promises";
import { Character } from '@Shared/types/character.js';

const sessionKey = 'can-see-intro';
const Rebar = useRebar();
const db = Rebar.database.useDatabase();

alt.on('playerConnect', (player: alt.Player) => {
    Rebar.player.useWebview(player).show('Intro', 'page');
    Rebar.player.useWorld(player).setScreenFade(0);
    Rebar.player.useWorld(player).disableControls();
    Rebar.player.useWorld(player).disableCameraControls(true);
    
    player.setMeta(sessionKey, true);
});

alt.onRpc(IntroEvents.toServer.request, async (player: alt.Player) => {
    const getDirectories = async source => (await readdir(source, { withFileTypes: true }))
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name);

    const result = await getDirectories("src/plugins/");
    return result;
});



alt.onClient(IntroEvents.toServer.finished, async (player: alt.Player) => {
    player.deleteMeta(sessionKey);

    Rebar.player.useWebview(player).hide('Intro');
    Rebar.player.useWorld(player).clearScreenFade(0);
    Rebar.player.useWorld(player).enableControls();
    Rebar.player.useWorld(player).disableCameraControls(false);
    Rebar.player.useAudio(player).stopAudio();

    // Wichtig: async callbacks werden sauber awaited
    await invokeFinished(player);
});