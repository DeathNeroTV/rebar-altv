import * as alt from 'alt-client';
import * as natives from 'natives';

import { AdminEvents } from '../shared/events.js';
import { useRebarClient } from '@Client/index.js';
import { useTranslate } from '@Shared/translate.js';
import { AdminConfig } from '../shared/config.js';

const { t } = useTranslate(AdminConfig.language);

const Rebar = useRebarClient();
const view = Rebar.webview.useWebview();

alt.everyTick(() => natives.disableControlAction(0, 199, true));

const keyBind: KeyInfo = {
    identifier: 'admin-toggle',
    description: 'Öffne das Admin-Menü',
    key: alt.KeyCode.P,
    allowIfDead: true,
    keyDown: handleAdminView,
};

function handleAdminView() {
    if (alt.isConsoleOpen() || alt.isMenuOpen() || view.isAnyPageOpen()) return;
    alt.emitServer(AdminEvents.toServer.login);
}

async function init() {
    const keyBindApi = await Rebar.useClientApi().getAsync('keyBinds-api');
    keyBindApi.add(keyBind);
}

init();