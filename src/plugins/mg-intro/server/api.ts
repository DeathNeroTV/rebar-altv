import * as alt from 'alt-server';
import { useRebar } from '@Server/index.js';

type PlayerCallback = (player: alt.Player) => Promise<void> | void;

const Rebar = useRebar();
const callbacks: Array<PlayerCallback> = [];

export async function invokeFinished(player: alt.Player) {
    for (const cb of callbacks) {
        try {
            const result = cb(player);

            // Prüfen, ob Promise
            if (result && typeof result.then === 'function') {
                await result;
            }
        } catch (err) {
            console.error(`invokeFinished Callback Error:`, err);
        }
    }
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