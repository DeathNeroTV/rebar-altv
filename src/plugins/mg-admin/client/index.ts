import * as alt from 'alt-client';
import * as natives from 'natives';

import { AdminEvents } from '../shared/events.js';
import { useRebarClient } from '@Client/index.js';
import { useTranslate } from '@Shared/translate.js';
import { AdminConfig } from '../shared/config.js';

const { t } = useTranslate(AdminConfig.language);

const Rebar = useRebarClient();
const view = Rebar.webview.useWebview();

const keyBind: KeyInfo = {
    identifier: 'admin-toggle',
    description: t('admin.keyBind.desc'),
    key: alt.KeyCode.P,
    allowIfDead: true,
    keyDown: () => {        
        if (alt.isConsoleOpen() || alt.isMenuOpen() || view.isAnyPageOpen()) return;
        alt.emitServer(AdminEvents.toServer.login);
    },
};

alt.everyTick(() => natives.disableControlAction(0, 199, true));

async function init() {
    const keyBindApi = await Rebar.useClientApi().getAsync('keyBinds-api');
    keyBindApi.add(keyBind);
}

init();