<script lang="ts" setup>
import { ref } from 'vue';
import { Item } from '@Shared/types/items.js';

import InventoryHolder from '../components/InventoryHolder.vue';
import type { Inventory } from '../../shared/interfaces';

const props = defineProps<{
    playerInventory: Inventory;
    otherInventory: Inventory;
}>()

const emits = defineEmits<{
    (e: 'updateInventories', playerInv: Inventory, otherInv: Inventory): void;
}>();

// Dragging Item global für beide Inventare
const draggingItem = ref<Item | null>(null);

// Handles Cross-Inventar Drag
function handleDrag(fromId: string, fromInv: 'player' | 'other', toId: string, toInv: 'player' | 'other') {
    const sourceInventory = fromInv === 'player' ? props.playerInventory : props.otherInventory;
    const targetInventory = toInv === 'player' ? props.playerInventory : props.otherInventory;

    const fromIndex = sourceInventory.slots.findIndex(i => i?.uid === fromId);
    const toIndex = targetInventory.slots.findIndex(i => i?.uid === toId);

    if (fromIndex === -1) return;

    // Item tauschen
    const temp = targetInventory.slots[toIndex];
    targetInventory.slots[toIndex] = sourceInventory.slots[fromIndex];
    sourceInventory.slots[fromIndex] = temp;

    emits('updateInventories', props.playerInventory, props.otherInventory);
}

function handleHover(item: Item | null) {
}
</script>

<template>
    <div class="w-full h-full flex gap-2">
        <!-- Player Inventory -->
        <InventoryHolder
            :inventory="playerInventory"
            :hasBar="true"
            @hoverOver="handleHover"
            @dragged="(fromId, toId) => handleDrag(fromId, 'player', toId, 'player')"
        />

        <!-- Partner / Storage Inventory -->
        <InventoryHolder
            :inventory="otherInventory"
            :hasBar="false"
            @hoverOver="handleHover"
            @dragged="(fromId, toId) => handleDrag(fromId, 'other', toId, 'other')"
        />
    </div>
</template>

<style scoped>
</style>
