import * as alt from 'alt-server';
import { useRebar } from '@Server/index.js';

const Rebar = useRebar();
const loginCallbacks: Array<(player: alt.Player) => void> = [];

export function invokeLogin(player: alt.Player) {
    for (let cb of loginCallbacks) {
        cb(player);
    }
}

export function useApi() {
    function onLogin(callback: (player: alt.Player) => void) {
        loginCallbacks.push(callback);
    }
    
    return {
        onLogin,
    };
}

declare global {
    export interface ServerPlugin {
        ['auth-api']: ReturnType<typeof useApi>;
    }
}

Rebar.useApi().register('auth-api', useApi());