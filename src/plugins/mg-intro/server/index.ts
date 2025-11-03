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

const Rebar = useRebar();

const showIntro = async (player: alt.Player) => {
    const isReady = await Rebar.player.useWebview(player).isReady('Intro', 'page');
    if (!isReady) {
        await showIntro(player);
        return;
    }
        
    Rebar.player.useAudio(player).playSound('./sounds/intro.ogg', 0.35);
    Rebar.player.useWorld(player).setScreenFade(0);
    Rebar.player.useWorld(player).disableControls();
    Rebar.player.useWorld(player).freezeCamera(true);
};

alt.onClient(IntroEvents.toServer.start, async (player: alt.Player) => {
    await showIntro(player);
});

alt.onRpc(IntroEvents.toServer.request, async (player: alt.Player) => {
    const getDirectories = async source => (await readdir(source, { withFileTypes: true }))
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name);

    const result = await getDirectories("src/plugins/");
    return result;
});

alt.onClient(IntroEvents.toServer.finished, (player: alt.Player) => {
    Rebar.player.useWebview(player).hide('Intro');
    Rebar.player.useWorld(player).clearScreenFade(0);
    Rebar.player.useWorld(player).enableControls();
    Rebar.player.useWorld(player).freezeCamera(false);
    Rebar.player.useAudio(player).stopAudio();
    invokeFinished(player);
});