import * as alt from 'alt-client';
import { useRebarClient } from '@Client/index.js';
import { useWebview } from '@Client/webview/index.js';

import { InventoryEvents } from '../shared/events.js';

const Rebar = useRebarClient();
const view = useWebview();

const keyBind: KeyInfo = {
    description: 'Inventar anzeigen/verstecken',
    identifier: 'inventory-toggle',
    key: alt.KeyCode.Tab,
    keyDown: () => {        
        if (alt.isConsoleOpen() || alt.isMenuOpen() || view.isAnyPageOpen()) return;
        alt.emitServer(InventoryEvents.toServer.fetchData);
    },
    restrictions: { isOnFoot: true, isVehicle: true },
};

view.onClose('Inventory', () => alt.emitServer(InventoryEvents.toServer.clearSession));

async function init() { 
    const keyBindApi = await Rebar.useClientApi().getAsync('keyBinds-api');
    if (!keyBindApi) throw Error('KeyBind Api not found');
    keyBindApi.add(keyBind);
}
init();