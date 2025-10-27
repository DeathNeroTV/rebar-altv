import alt from "alt-server";
import {useRebar} from "@Server/index.js";
import {Account} from "@Shared/types/index.js";

type PlayerCallback = (player: alt.Player, account: Account) => void;

const Rebar = useRebar();
const loginCallbacks: Array<PlayerCallback> = [];
const logoutCallbacks: Array<PlayerCallback> = [];

export function invokeLogin(player: alt.Player, account: Account) {
    for ( const cb of loginCallbacks ) {
        cb(player, account);
    }
}

export function invokeLogout(player: alt.Player, account: Account) {
    for ( const cb of logoutCallbacks ) {
        cb(player, account);
    }
}

export function useDiscordAuth() {
    function onLogin(callback: (player: alt.Player) => void) {
        loginCallbacks.push(callback);
    }

    function onLogout(callback: (player: alt.Player) => void) {
        logoutCallbacks.push(callback);
    }

    return {
        onLogin,
        onLogout
    };
}

declare global {
    export interface ServerPlugin {
        ['discord-auth-api']: ReturnType<typeof useDiscordAuth>;
    }
}

Rebar.useApi().register('discord-auth-api', useDiscordAuth());