import * as alt from 'alt-server';
import { useRebar } from '@Server/index.js';

type PlayerCharacterCallback = (player: alt.Player) => void;

const API_NAME = 'character-creator-api';
const Rebar = useRebar();

const createCallbacks: Array<PlayerCharacterCallback> = [];
const skipCreateCallbacks: Array<PlayerCharacterCallback> = [];

export function invokeCreate(player: alt.Player) {
    createCallbacks.forEach(cb => cb(player));
}

export function invokeSkipCreate(player: alt.Player) {
    skipCreateCallbacks.forEach(cb => cb(player));
}

function useApi() {
    function onCreate(callback: PlayerCharacterCallback) {
        createCallbacks.push(callback);
    }

    function onSkipCreate(callback: PlayerCharacterCallback) {
        skipCreateCallbacks.push(callback);
    }

    return {
        onCreate,
        onSkipCreate,
    };
}

declare global {
    export interface ServerPlugin {
        [API_NAME]: ReturnType<typeof useApi>;
    }
}

Rebar.useApi().register(API_NAME, useApi());
