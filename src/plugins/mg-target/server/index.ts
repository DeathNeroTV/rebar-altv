import * as alt from 'alt-server';
import { useRebar } from '@Server/index.js';
import { TargetingEvents } from '../shared/events.js';
import { invokeSelect, useApi } from './api.js';
import { TargetDefinition, TargetOption } from '../shared/interfaces.js';
import { Character } from '@Shared/types/character.js';
import { isMemberOfAllowedGroups } from '@Plugins/mg-admin/server/functions.js';

const Rebar = useRebar();
const api = Rebar.useApi();
const targets: TargetDefinition[] = [];

async function handleTargets(player: alt.Player): Promise<void> {
    await alt.Utils.wait(500);
    Rebar.player.useWebview(player).show('Targeting', 'overlay');

    const allowedTargets = isMemberOfAllowedGroups(player) ? targets : targets.filter(x => !x.id.startsWith('support-'));
    player.emit(TargetingEvents.toClient.assignTargets, allowedTargets);
}

function handleCharacterUpdated<K extends keyof Character>(player: alt.Player, key: K, value: Character[K]) {
    if (key !== 'groups') return;
    const allowedTargets = isMemberOfAllowedGroups(player) ? targets : targets.filter(x => !x.id.startsWith('support-'));
    player.emit(TargetingEvents.toClient.assignTargets, allowedTargets);
}

function handleAddEntity(id: string, entityId: number, options: TargetOption[]) {
    const target: TargetDefinition = { id, type: 'entity', entityId, options };
    targets.push(target);
    alt.emitAllClients(TargetingEvents.toClient.listTargets, [target]);
}

function handleAddModel(id: string, model: string, options: TargetOption[]) {
    const target: TargetDefinition = { id, type: 'model', model: alt.hash(model), options };
    targets.push(target);
    alt.emitAllClients(TargetingEvents.toClient.listTargets, [target]);
}

function handleAddZone(id: string, position: alt.IVector3, radius: number, options: TargetOption[]) {
    const target: TargetDefinition = { id, type: 'zone', position, radius, options };
    targets.push(target);
    alt.emitAllClients(TargetingEvents.toClient.listTargets, [target]);
}

async function init() {
    useApi().onAddEntity(handleAddEntity);
    useApi().onAddModel(handleAddModel);
    useApi().onAddZone(handleAddZone);

    const charCreatorApi = await api.getAsync('character-creator-api');
    if (!charCreatorApi) { 
        alt.logError('[mg-target]', 'char-editor-api not found');
        return;
    }

    charCreatorApi.onCreate(handleTargets);
    charCreatorApi.onSkipCreate(handleTargets);

    alt.on('rebar:playerCharacterUpdated', handleCharacterUpdated);
    alt.onClient(TargetingEvents.toServer.showTarget, invokeSelect);
}

init();