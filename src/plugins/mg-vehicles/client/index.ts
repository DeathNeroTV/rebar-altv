import * as alt from 'alt-client';
import { VehicleEvents } from '../shared/events.js';
import { useRebarClient } from '@Client/index.js';

const keyBinds: KeyInfo[] = [
    { 
        identifier: 'toggle-vehicle-engine',
        key: alt.KeyCode.M,
        description: 'Motor an-/ausschalten',
        keyDown: () => alt.emitServer(VehicleEvents.toServer.toggle.engine),
        restrictions: { isVehicleDriver: true }
    },
    { 
        identifier: 'toggle-vehicle-lock',
        key: alt.KeyCode.L,
        description: 'Tüten auf-/abschließen',
        keyDown: () => alt.emitServer(VehicleEvents.toServer.toggle.lock),
    }
];

async function init() {
    const keyBindApi = await useRebarClient().useClientApi().getAsync('keyBinds-api');
    if (!keyBindApi) throw new Error('keyBinds-api wurde nicht gefunden');
    keyBinds.forEach(keyBindApi.add);
}
init();