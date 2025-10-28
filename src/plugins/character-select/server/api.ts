import * as alt from 'alt-server';
import { useRebar } from "@Server/index.js";
import { Character } from '@Shared/types/character.js';

type PlayerCharacterCallback = (player: alt.Player, character: Character) => void;

const API_NAME = 'character-select-api';
const Rebar = useRebar();

const selectCallbacks: Array<PlayerCharacterCallback> = [];

export function invokeSelect(player: alt.Player, character: Character) {
    selectCallbacks.forEach(cb => cb(player, character));
}

export function useApi() {
    function onSelect(callback: PlayerCharacterCallback) {
        selectCallbacks.push(callback);
    }

    return {
        onSelect
    };
}

declare global {
    export interface ServerPlugin {
        [API_NAME]: ReturnType<typeof useApi>;
    }
}

Rebar.useApi().register(API_NAME, useApi());