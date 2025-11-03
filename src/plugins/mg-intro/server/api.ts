import * as alt from 'alt-server';
import { useRebar } from '@Server/index.js';

type PlayerCallback = (player: alt.Player) => void;

const Rebar = useRebar();
const callbacks: Array<PlayerCallback> = [];

export function invokeFinished(player: alt.Player) {
    callbacks.forEach(cb => cb(player));
}

export function useIntroApi() {
    function onFinished(callback: PlayerCallback) {
        callbacks.push(callback);
    }

    return {
        onFinished
    };
}

declare global {
    export interface ServerPlugin {
        ['mg-intro-api']: ReturnType<typeof useIntroApi>;
    }
}

Rebar.useApi().register('mg-intro-api', useIntroApi());