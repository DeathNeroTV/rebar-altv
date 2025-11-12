import * as alt from 'alt-server';
import { useRebar } from "@Server/index.js";

import { AdminConfig } from "../shared/config.js";

const Rebar = useRebar();

export function isMemberOfAllowedGroups(player: alt.Player) {
    const document = Rebar.document.character.useCharacter(player);
    if (!document.isValid()) return false;

    for (const key in AdminConfig.discordRoles) {
        if (!document.groups.memberOf(key)) continue;
        return true;
    }

    return false;
}