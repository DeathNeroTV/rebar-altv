import * as alt from 'alt-server';
import { useRebar } from '@Server/index.js';
import { TargetingEvents } from '../shared/events.js';
import { invokeSelect } from './api.js';

const Rebar = useRebar();
const api = Rebar.useApi();

function handleSkipCreate(player: alt.Player): void {
    Rebar.player.useWebview(player).show('Targeting', 'overlay');
}

async function init() {
    await alt.Utils.waitFor(() => api.isReady('character-creator-api'), 30000);
    const charCreatorApi = api.get('character-creator-api');
    charCreatorApi.onSkipCreate(handleSkipCreate);

    alt.onClient(TargetingEvents.toServer.showTarget, invokeSelect);
}

init();