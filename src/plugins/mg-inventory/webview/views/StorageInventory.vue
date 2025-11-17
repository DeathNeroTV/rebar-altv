<script lang="ts" setup>
	import { ref } from 'vue';
	import { Item } from '@Shared/types/items.js';

	import InventoryHolder from '../components/InventoryHolder.vue';
	import type { Inventory, Modifiers } from '../../shared/interfaces';
	import { useEvents } from '@Composables/useEvents';
	import { InventoryEvents } from '@Plugins/mg-inventory/shared/events';

	const props = defineProps<{
		playerInventory: Inventory;
		otherInventory: Inventory;
	}>();

	const emits = defineEmits<{
		(e: 'updateInventories', playerInv: Inventory, otherInv: Inventory): void;
	}>();

	const events = useEvents();

	// Dragging Item global für beide Inventare
	const draggingItem = ref<Item | null>(null);

	function handleLeftClick(uid: string, modifiers: Modifiers) {
		if (!modifiers.shift && !modifiers.ctrl && !modifiers.alt) return;
		events.emitServer(InventoryEvents.toServer.leftClick, uid, modifiers);
	}

	function handleRightClick(uid: string) {
		events.emitServer(InventoryEvents.toServer.rightClick, uid);
	}

	function handleMiddleClick(uid: string) {
		events.emitServer(InventoryEvents.toServer.middleClick, uid);
	}

	// Handles Cross-Inventar Drag
	function handleDrag(fromId: string, toId: string) {
		events.emitServer(InventoryEvents.toServer.dragItem, fromId, toId);
	}

	function handleDragStart(uid: string) {
		const [inv, slot] = uid.split('-');
		const sourceInventory = inv === 'player' ? props.playerInventory : props.otherInventory;
		const index = Number(slot);
		const item = sourceInventory.slots[index];
		if (!item) return;
		draggingItem.value = item;
	}

	function handleDragStop(uid: string) {
		draggingItem.value = null;
	}

	function handleHover(item: Item | null) {}
</script>

<template>
	<div class="w-full h-full flex gap-2">
		<!-- Player Inventory -->
		<InventoryHolder
			uid="player"
			:inventory="playerInventory"
			:hasBar="false"
			@hoverOver="handleHover"
			@dragged="handleDrag"
			@middleClick="handleMiddleClick"
			@rightClick="handleRightClick"
			@leftClick="handleLeftClick"
			@dragStart="handleDragStart"
			@dragStop="handleDragStop"
		/>

		<!-- Partner / Storage Inventory -->
		<InventoryHolder
			uid="other"
			:inventory="otherInventory"
			:hasBar="false"
			@hoverOver="handleHover"
			@dragged="handleDrag"
			@middleClick="handleMiddleClick"
			@rightClick="handleRightClick"
			@leftClick="handleLeftClick"
			@dragStart="handleDragStart"
			@dragStop="handleDragStop"
		/>
	</div>
</template>

<style scoped></style>
