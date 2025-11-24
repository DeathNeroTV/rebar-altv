import * as alt from 'alt-server';
import { useRebar } from "@Server/index.js";

import { AdminEvents } from '../shared/events.js';
import { AdminConfig } from '../shared/config.js';

const Rebar = useRebar();
const ghosts: Map<string, boolean> = new Map();

export function isMemberOfAllowedGroups(player: alt.Player) {
    const document = Rebar.document.character.useCharacter(player);
    if (!document.isValid()) return false;

    for (const key in AdminConfig.discordRoles) {
        if (!document.groups.memberOf(key)) continue;
        return true;
    }

    return false;
}

export function handleNoClipToggle(player: alt.Player) {
    const document = Rebar.document.character.useCharacter(player);
    if (!document.isValid()) return false;
    if (!isMemberOfAllowedGroups(player)) return false;

    const charId = document.getField('_id');
    const newState = !ghosts.get(charId);
    ghosts.set(charId, newState);

    player.frozen = newState;
    player.collision = !newState;
    player.visible = !newState;

    Rebar.player.useAudio(player).playSound('/sounds/ghosting.ogg', 0.25);
    player.emit(AdminEvents.toClient.ghosting.toggle, newState);
    return newState;
}

export function handleNoClipRequest(player: alt.Player) {
    if (!isMemberOfAllowedGroups(player)) return false;

    const document = Rebar.document.character.useCharacter(player);
    if (!document.isValid()) return false;

    const charId = document.getField('_id');
    if (!ghosts.has(charId)) ghosts.set(charId, false);

    return ghosts.get(charId);
}