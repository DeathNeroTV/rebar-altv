<template>
    <div class="p-4 bg-neutral-900 rounded-lg w-max">
        <h2 class="text-white font-bold mb-2">{{ title }}</h2>
        <div class="grid grid-cols-5 gap-2">
            <Draggable
                v-for="(item, index) in inventory.slots"
                :key="index"
                @onLeftClick="handleLeftClick"
                @onDblClick="handleDblClick"
                @onMiddleClick="handleMiddleClick"
                @onRightClick="handleRightClick"
                @onDragStart="handleDragStart"
                @onDragStop="handleDragStop"
                @onDrag="handleDrag"
            >
                <div
                    v-if="item"
                    :id="item.id.toString()"
                    class="w-16 h-16 flex items-center justify-center bg-gray-700 rounded relative"
                >
                    <img :src="'/images/' + item.icon + '.png'" class="w-10 h-10 object-contain" />
                    <span v-if="item.quantity > 1"
                        class="absolute bottom-0 right-0 text-xs text-white bg-gray-900 px-1 rounded"
                    >
                        {{ item.quantity }}
                    </span>
                </div>
            </Draggable>
        </div>
    </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import type { Inventory as InventoryType } from '../../shared/interfaces';

const props = defineProps<{
    inventory: InventoryType;
    title?: string;
}>();

const draggedItemId = ref<string | null>(null);

function findSlotIndexById(id: string) {
    return props.inventory.slots.findIndex((item) => item?.id.toString() === id);
}

// Klick-Events
function handleLeftClick(id: string) {
    console.log('LeftClick', id);
}

function handleRightClick(id: string) {
    console.log('RightClick', id);
}

function handleMiddleClick(id: string) {
    console.log('MiddleClick', id);
}

function handleDblClick(id: string) {
    console.log('DoubleClick', id);
}

// Drag & Drop
function handleDragStart(id: string) {
    draggedItemId.value = id;
}

function handleDragStop(id: string) {
    draggedItemId.value = null;
}

function handleDrag(fromId: string, toId: string) {
    const fromIndex = findSlotIndexById(fromId);
    const toIndex = findSlotIndexById(toId);
    if (fromIndex === -1 || toIndex === -1) return;

    const temp = props.inventory.slots[toIndex];
    props.inventory.slots[toIndex] = props.inventory.slots[fromIndex];
    props.inventory.slots[fromIndex] = temp;
}
</script>
