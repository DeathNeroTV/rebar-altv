import * as alt from 'alt-server';
import { useRebar } from '@Server/index.js';
import { TargetDefinition, TargetOption } from '../shared/interfaces.js';

type TargetAddModelCallback = (model: string, options: TargetOption[]) => void;
type TargetAddEntityCallback = (entityId: number, options: TargetOption[]) => void;
type TargetAddZoneCallback = (pos: alt.IVector3, radius: number, options: TargetOption[]) => void;
type TargetRemoveCallback = (id: string) => void;
type TargetSelectCallback = (player: alt.Player, data: TargetDefinition) => void;

const Rebar = useRebar();
const API_NAME = 'targeting-api';

const modelCallbacks: TargetAddModelCallback[] = [];
const entityCallbacks: TargetAddEntityCallback[] = [];
const zoneCallbacks: TargetAddZoneCallback[] = [];
const removeCallbacks: TargetRemoveCallback[] = [];
const selectCallbacks: TargetSelectCallback[] = [];

export function invokeAddModel(model: string, options: TargetOption[]) {
    modelCallbacks.forEach(cb => cb(model, options));
}

export function invokeAddZone(pos: alt.IVector3, radius: number, options: TargetOption[]) {
    zoneCallbacks.forEach(cb => cb(pos, radius, options));
}

export function invokeAddEntity(entityId: number, options: TargetOption[]) {
    entityCallbacks.forEach(cb => cb(entityId, options));
}

export function invokeRemoveTarget(id: string) {
    removeCallbacks.forEach(cb => cb(id));
}

export function invokeSelect(player: alt.Player, target: TargetDefinition) {
    selectCallbacks.forEach(cb => cb(player, target));
}

export function useApi() {
    function onAddModel(callback: TargetAddModelCallback) {
        modelCallbacks.push(callback);
    }

    function onAddZone(callback: TargetAddZoneCallback) {
        zoneCallbacks.push(callback);
    }

    function onAddEntity(callback: TargetAddEntityCallback) {
        entityCallbacks.push(callback);
    }

    function onRemoveTarget(callback: TargetRemoveCallback) {
        removeCallbacks.push(callback);
    }

    function onSelectTarget(callback: TargetSelectCallback) {
        selectCallbacks.push(callback);
    }

    return {
        onAddModel,
        onAddZone,
        onAddEntity,
        onRemoveTarget,
        onSelectTarget
    };
}

declare global {
    export interface ServerPlugin {
        [API_NAME]: ReturnType<typeof useApi>;
    }
}

Rebar.useApi().register(API_NAME, useApi());