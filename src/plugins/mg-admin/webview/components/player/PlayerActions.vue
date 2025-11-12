<script lang="ts" setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useEvents } from '@Composables/useEvents';
import { ActionType, GiveType, TeleportType } from '@Plugins/mg-admin/shared/enums';
import { AdminEvents } from '@Plugins/mg-admin/shared/events';
import type { AdminAction, PlayerStats } from '@Plugins/mg-admin/shared/interfaces';

import Dropdown from '../DropDown.vue';
import { AdminConfig } from '@Plugins/mg-admin/shared/config';
import { Item } from '@Shared/types/items';

const events = useEvents();
const props = defineProps<{ player: PlayerStats | null }>();

const emits = defineEmits<{
    (e: 'close'): void;
}>();

const actions = [
    { type: ActionType.KICK, label: 'Kicken' },
    { type: ActionType.TELEPORT, label: 'Teleportieren' },
    { type: ActionType.BAN, label: 'Bannen' },
    { type: ActionType.HEAL, label: 'Heilen' },
    { type: ActionType.SPECTATE, label: 'Beobachten' },
    { type: ActionType.GIVE, label: 'Geben' },
    { type: ActionType.TAKE, label: 'Nehmen' },
    { type: ActionType.FREEZE, label: 'Einfrieren/Auftauen' },
];

const teleports = [
    { type: TeleportType.GO_TO, label: 'Hingehen' },
    { type: TeleportType.GET_HERE, label: 'Herholen' },
];

const gives = [
    { type: GiveType.BANK, label: 'Konto' },
    { type: GiveType.CASH, label: 'Bargeld' },
    { type: GiveType.ITEM, label: 'Gegenstand' },
    { type: GiveType.WEAPON, label: 'Waffe & Munition' },
];

// Reactive state
const selectedAction = ref<ActionType | null>(null);
const selectedGive = ref<GiveType | null>(null);
const selectedTeleport = ref<TeleportType | null>(null);
const reason = ref<string | null>(null);
const amount = ref<number | null>(null);
const itemId = ref<string | null>(null);
const weaponId = ref<string | null>(null);
const items = ref<{ label: string; value: string }[]>([]);
const weapons = ref<{ label: string; value: string }[]>([]);

// Computed: Prüfen, ob alle Pflichtfelder ausgefüllt sind
const canExecute = computed(() => {
    if (!selectedAction.value) return false;

    switch (selectedAction.value) {
        case ActionType.KICK:
        case ActionType.BAN:
            return !!reason.value;
        case ActionType.GIVE:
        case ActionType.TAKE:
            if (!selectedGive.value) return false;
            if (selectedGive.value === GiveType.ITEM) {
                return !!itemId.value && !!amount.value;
            }
            if (selectedGive.value === GiveType.WEAPON) {
                return !!weaponId.value && !!amount.value;
            }
            return !!amount.value;
        case ActionType.TELEPORT:
            return !!selectedTeleport.value;
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
        itemId: itemId.value || undefined,
        weaponId: weaponId.value || undefined,
        giveType: selectedGive.value || undefined,
        teleportType: selectedTeleport.value || undefined,
    };

    events.emitServer(AdminEvents.toServer.action, data);
    emits('close');
    // Reset
    selectedAction.value = null;
    selectedGive.value = null;
    selectedTeleport.value = null;
    reason.value = null;
    amount.value = null;
    itemId.value = null;
    weaponId.value = null;
}

watch(selectedGive, (val) => {
    amount.value = null;
    itemId.value = null;
    weaponId.value = null;
});

onMounted(async() => {
    const itemList: Partial<Item>[] = (await events.emitServerRpc(AdminEvents.toServer.request.items)) ?? [
        { uid: 'hamburger', name: 'Hamburger' }
    ];
    items.value = itemList.map(x => ({ label: x.name ?? 'Unbekannt', value: x.uid ?? '' }));

    const weaponList: ({ name: string; model: string })[] = (await events.emitServerRpc(AdminEvents.toServer.request.weapons)) ?? [
        { name: 'Deine Mamma', model: 'weapon_unarmed' }
    ];
    weapons.value = weaponList.map(x => ({ label: x.name, value: x.model }));
});
</script>

<template>
    <div class="px-4 py-2 text-gray-100 w-full h-fit">
        <h3 class="text-gray-400 text-lg">Spieler-Interaktion</h3>
        
        <div class="w-full h-[1px] bg-[#008736] my-2"></div>

        <div class="flex gap-2 mb-2 items-center justify-between">
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
                :options="AdminConfig.kickAndBanReasons"
                placeholder="Grund auswählen"
                v-model="reason"
                @selected="val => reason = val as string"
            />
        </div>

        <!-- Geben / Nehmen / Setzen -->
        <div v-if="selectedAction && [ActionType.GIVE, ActionType.TAKE].includes(selectedAction)" class="mb-2">
            <Dropdown
                class="mb-2"
                :options="gives.map(g => ({ label: g.label, value: g.type }))"
                placeholder="Typ auswählen"
                v-model="selectedGive"
                @selected="val => selectedGive = val as GiveType"
            />

            <Dropdown 
                v-if="selectedGive === GiveType.ITEM"
                class="mb-2"
                :options="items"
                placeholder="Gegenstand auswählen"
                v-model="itemId"
                @selected="val => itemId = String(val) ?? null"
            />

            <Dropdown 
                v-if="selectedGive === GiveType.WEAPON"
                class="mb-2"
                :options="weapons"
                placeholder="Waffe auswählen"
                v-model="weaponId"
                @selected="val => weaponId = String(val) ?? null"
            />

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