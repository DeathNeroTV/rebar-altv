<script lang="ts" setup>
import { ref, computed } from 'vue';
import { useEvents } from '@Composables/useEvents';
import { ActionType, GiveType, TeleportType } from '@Plugins/mg-admin/shared/enums';
import { AdminEvents } from '@Plugins/mg-admin/shared/events';
import type { AdminAction, PlayerStats } from '@Plugins/mg-admin/shared/interfaces';

import Dropdown from '../DropDown.vue';

const events = useEvents();
const props = defineProps<{ player: PlayerStats | null }>();

const actions = [
    { type: ActionType.KICK, label: 'Kicken' },
    { type: ActionType.TELEPORT, label: 'Teleportieren' },
    { type: ActionType.BAN, label: 'Bannen' },
    { type: ActionType.HEAL, label: 'Heilen' },
    { type: ActionType.SPECTATE, label: 'Beobachten' },
    { type: ActionType.GIVE, label: 'Etwas geben' },
    { type: ActionType.TAKE, label: 'Etwas nehmen' },
    { type: ActionType.SET, label: 'Etwas setzen' },
    { type: ActionType.FREEZE, label: 'Einfrieren/Auftauen' },
];

const teleports = [
    { type: TeleportType.GO_TO, label: 'Hingehen' },
    { type: TeleportType.GET_HERE, label: 'Herholen' },
];

const gives = [
    { type: GiveType.BANK, label: 'Konto auffüllen' },
    { type: GiveType.CASH, label: 'Bargeld geben' },
    { type: GiveType.ITEM, label: 'Gegenstand geben' },
    { type: GiveType.WEAPON, label: 'Waffe geben' },
];

const kickBanReasons = [
  { label: 'Unfaire Spielweise', value: 'unfair' },
  { label: 'Glitch/Bug ausnutzen', value: 'glitch' },
  { label: 'Beleidigung', value: 'insult' },
  { label: 'RDM', value: 'rdm' },
];

// Reactive state
const selectedAction = ref<ActionType | null>(null);
const selectedGive = ref<GiveType | null>(null);
const selectedTeleport = ref<TeleportType | null>(null);
const reason = ref<string | null>(null);
const amount = ref<number | null>(null);
const itemName = ref<string | null>(null);

// Computed: Prüfen, ob alle Pflichtfelder ausgefüllt sind
const canExecute = computed(() => {
    if (!selectedAction.value) return false;

    switch (selectedAction.value) {
        case ActionType.KICK:
        case ActionType.BAN:
            return !!reason.value;
        case ActionType.GIVE:
        case ActionType.TAKE:
        case ActionType.SET:
            if (!selectedGive.value) return false;
            if ([GiveType.ITEM, GiveType.WEAPON].includes(selectedGive.value) || selectedAction.value === ActionType.SET) {
                return !!itemName.value && !!amount.value;
            }
            return !!amount.value;
        case ActionType.TELEPORT:
            return !!selectedTeleport.value;
        case ActionType.FREEZE:
            return !!reason.value;
        default:
            return true;
    }
});

function doAction() {
    if (!props.player || !canExecute.value) {
        return;
    }

    const data: AdminAction = {
        type: selectedAction.value!,
        playerId: props.player.id,
        reason: reason.value || undefined,
        amount: amount.value || undefined,
        itemName: itemName.value || undefined,
        giveType: selectedGive.value || undefined,
        teleportType: selectedTeleport.value || undefined,
    };

    events.emitServer(AdminEvents.toServer.action, data);

    // Reset
    selectedAction.value = null;
    selectedGive.value = null;
    selectedTeleport.value = null;
    reason.value = null;
    amount.value = null;
    itemName.value = null;
}
</script>

<template>
    <div class="p-4 text-gray-100 w-full h-full">
        <h3 class="text-gray-400 text-sm mb-2">Aktionen</h3>

        <div class="flex gap-2 mb-4 items-center justify-between">
            <!-- Aktion Dropdown -->
            <Dropdown
                :options="actions.map(a => ({ label: a.label, value: a.type }))"
                placeholder="Aktion auswählen"
                v-model="selectedAction"
                @selected="val => selectedAction = val as ActionType"
                class="flex-1"
            />

            <font-awesome-icon 
                :icon="['fas', 'play']"
                :disabled="!canExecute"
                @click="doAction"
                class="p-3 rounded-lg font-medium text-gray-100"
                :class="[canExecute ? 'bg-[#008736] cursor-pointer' : 'bg-neutral-800 cursor-not-allowed']"
            />
        </div>

        <!-- Kicken/Bannen Gründe -->
        <div v-if="selectedAction === ActionType.KICK || selectedAction === ActionType.BAN" class="mb-2">
            <Dropdown
                :options="kickBanReasons"
                placeholder="Grund auswählen"
                v-model="reason"
                @selected="val => reason = val as string"
            />
        </div>

        <!-- Geben / Nehmen / Setzen -->
        <div v-if="[ActionType.GIVE, ActionType.TAKE, ActionType.SET].includes(selectedAction)" class="mb-2">
            <Dropdown
                class="mb-2"
                :options="gives.map(g => ({ label: g.label, value: g.type }))"
                placeholder="Typ auswählen"
                v-model="selectedGive"
                @selected="val => selectedGive = val as GiveType"
            />

            <input v-if="selectedGive === GiveType.ITEM || selectedGive === GiveType.WEAPON || selectedAction === ActionType.SET"
                v-model="itemName"
                placeholder="Name"
                class="w-full p-2 rounded-lg bg-neutral-800 text-gray-100 mb-2"/>

            <input v-if="selectedGive"
                v-model.number="amount"
                type="number"
                placeholder="Menge"
                class="w-full p-2 rounded-lg bg-neutral-800 text-gray-100 mb-2"/>
        </div>

        <!-- Teleportaktionen -->
        <div v-if="selectedAction === ActionType.TELEPORT" class="mb-2">
            <Dropdown
                :options="teleports.map(tp => ({ label: tp.label, value: tp.type }))"
                placeholder="Teleportart auswählen"
                v-model="selectedTeleport"
                @selected="val => selectedTeleport = val as TeleportType"
            />
        </div>

        <!-- Einfrieren / Auftauen -->
        <div v-if="selectedAction === ActionType.FREEZE" class="mb-2">
            <Dropdown
                :options="[{ label: 'Einfrieren', value: 'freeze' }, { label: 'Auftauen', value: 'unfreeze' }]"]
                placeholder="Einfrieren oder Auftauen?"
                v-model="reason"
                @selected="val => reason = val as string"
            />
        </div>
    </div>
</template>