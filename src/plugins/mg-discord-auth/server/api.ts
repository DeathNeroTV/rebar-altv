import alt from "alt-server";
import {useRebar} from "@Server/index.js";
import {Account} from "@Shared/types/index.js";
import { WhitelistRequest } from "../shared/interfaces.js";

type PlayerLoginCallback = (player: alt.Player, account: Account) => void;
type PlayerLogoutCallback = (player: alt.Player) => void;
type WhitelistCallback = (player: alt.Player, request: WhitelistRequest) => void;

const Rebar = useRebar();
const loginCallbacks: Array<PlayerLoginCallback> = [];
const logoutCallbacks: Array<PlayerLogoutCallback> = [];
const whitelistCallbacks: Array<WhitelistCallback> = [];

export function invokeLogin(player: alt.Player, account: Account) {
    loginCallbacks.forEach(cb => cb(player, account));
}

export function invokeLogout(player: alt.Player) {
    logoutCallbacks.forEach(cb => cb(player));
}

export function invokeWhitelistRequest(player: alt.Player, request: WhitelistRequest) {
    whitelistCallbacks.forEach(cb => cb(player, request));
}

export function useDiscordAuth() {
    function onLogin(callback: (player: alt.Player) => void) {
        loginCallbacks.push(callback);
    }

    function onLogout(callback: (player: alt.Player) => void) {
        logoutCallbacks.push(callback);
    }

    function onWhitelistRequest(callback: (player: alt.Player, request: WhitelistRequest) => void) {
        whitelistCallbacks.push(callback);
    }

    return {
        onLogin,
        onLogout,
        onWhitelistRequest,
    };
}

declare global {
    export interface ServerPlugin {
        ['discord-auth-api']: ReturnType<typeof useDiscordAuth>;
    }
}

Rebar.useApi().register('discord-auth-api', useDiscordAuth());