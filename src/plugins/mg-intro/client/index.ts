import * as alt from 'alt-client';
import { useRebarClient } from "@Client/index.js";
import { IntroEvents } from '../shared/events.js';

const Rebar = useRebarClient();
const view = Rebar.webview.useWebview();

view.show('Intro', 'page');
view.onWebviewReady(() => alt.emitServer(IntroEvents.toServer.start));