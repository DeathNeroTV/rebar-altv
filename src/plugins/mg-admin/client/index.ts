import * as alt from 'alt-client';
import * as natives from 'natives';

import { AdminEvents } from '../shared/events.js';
import { useRebarClient } from '@Client/index.js';
import { useTranslate } from '@Shared/translate.js';
import { AdminConfig } from '../shared/config.js';
import { WhitelistRequest } from '../shared/interfaces.js';

import './no_clip.js';

const { t } = useTranslate(AdminConfig.language);

const Rebar = useRebarClient();
const view = Rebar.webview.useWebview();

const keyBind: KeyInfo = {
    identifier: 'admin-toggle',
    description: t('admin.keyBind.desc'),
    allowIfDead: true,
    key: alt.KeyCode.P,
    keyDown: () => alt.emitServer(AdminEvents.toServer.login),
};

alt.everyTick(() => {
    natives.disableControlAction(0, 199, true);
});

function handleWhitelistRequest(request: WhitelistRequest) {
    if (!view.isSpecificPageOpen('Admin')) return;
    view.emit(AdminEvents.toWebview.whitelist.add, request);
}

function handleWhitelistUpdate(request: WhitelistRequest) {
    if (!view.isSpecificPageOpen('Admin')) return;
    view.emit(AdminEvents.toWebview.whitelist.add, request);
}

function handleWaypointRequest() {
    // Checken ob ein Wegpunkt aktiv ist
    if (!natives.isWaypointActive()) return null;

    // Blip ID 8 = Waypoint
    const blip = natives.getFirstBlipInfoId(8);
    if (!natives.doesBlipExist(blip)) return null;

    // Koordinaten des Blips holen
    const coords = natives.getBlipInfoIdCoord(blip);
    return coords;
}

async function init() {
    const keyBindApi = await Rebar.useClientApi().getAsync('keyBinds-api');
    if (!keyBindApi) throw Error('KeyBind Api not found');
    keyBindApi.add(keyBind);

    view.on(AdminEvents.toClient.give.license, (data: { item: string; quantity: number; }) => {
        const target = alt.Utils.getClosestPlayer({ pos: alt.Player.local.pos, range: 3 });
        if (!target) return;
        alt.emitServer(AdminEvents.toServer.give.license, target, data);
    });

    alt.onRpc(AdminEvents.toClient.waypoint, handleWaypointRequest);
    alt.onServer(AdminEvents.toClient.whitelist.add, handleWhitelistRequest);
    alt.onServer(AdminEvents.toClient.whitelist.update, handleWhitelistUpdate);
}
init();