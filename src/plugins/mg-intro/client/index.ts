import * as alt from 'alt-client';
import { useRebarClient } from "@Client/index.js";
import { introEvents } from '../shared/events.js';

const Rebar = useRebarClient();
const view = Rebar.webview.useWebview();

alt.on('connectionComplete', () => view.show('Intro', 'page'));
view.onWebviewReady(() => alt.emitServer(introEvents.toServer.start));