import * as alt from 'alt-client';
import { useRebarClient } from '@Client/index.js';
import { InventoryEvents } from '../shared/events.js';
import { ActiveInventorySession } from '../shared/interfaces.js';

const Rebar = useRebarClient();
const view = Rebar.webview.useWebview();

async function handleInventoryToggle() {
    if (view.isAnyPageOpen()) return;
    const [player, weapons, playerInventory, otherInventory] = await alt.emitRpc(InventoryEvents.toServer.fetchLocalData);
    view.show('Inventory', 'page', true);
    const session: ActiveInventorySession = { player, otherInventory, playerInventory, weapons };
    view.emit(InventoryEvents.toWebview.updateView, session);
}

async function init() {  
    const keyBind: KeyInfo = {
        description: 'Inventar anzeigen/verstecken',
        identifier: 'inventory-toggle',
        key: alt.KeyCode.Tab,
        keyDown: async() => await handleInventoryToggle(),
        restrictions: { isOnFoot: true, isVehicle: true }
    };

    const keyBindApi = await Rebar.useClientApi().getAsync('keyBinds-api');
    if (!keyBindApi) throw Error('KeyBind Api not found');
    keyBindApi.add(keyBind);
}
init();