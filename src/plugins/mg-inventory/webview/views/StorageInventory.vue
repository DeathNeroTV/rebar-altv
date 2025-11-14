<script lang="ts" setup>
	import { ref } from 'vue';
	import { Item } from '@Shared/types/items.js';

	import InventoryHolder from '../components/InventoryHolder.vue';
	import type { Inventory, Modifiers } from '../../shared/interfaces';

	const props = defineProps<{
		playerInventory: Inventory;
		otherInventory: Inventory;
	}>();

	const emits = defineEmits<{
		(e: 'updateInventories', playerInv: Inventory, otherInv: Inventory): void;
	}>();

	// Dragging Item global für beide Inventare
	const draggingItem = ref<Item | null>(null);

	function handleLeftClick(uid: string, modifiers: Modifiers) {
		if (!modifiers.shift && !modifiers.ctrl && !modifiers.alt) return;

		const [fromInv, fromSlot] = uid.split('-');
		const sourceInventory = fromInv === 'player' ? props.playerInventory : props.otherInventory;
		const targetInventory = fromInv === 'player' ? props.otherInventory : props.playerInventory;

		const fromIndex = Number(fromSlot);
		const fromItem = sourceInventory.slots[fromIndex];
		if (!fromItem) return;

		// Bestimme die Menge, die übertragen werden soll
		let transferQty = fromItem.quantity;

		if (modifiers.shift) transferQty = Math.floor(fromItem.quantity / 2);
		else if (modifiers.ctrl) transferQty = 1;

		if (transferQty <= 0) return;

		// Zuerst auf bestehende Stapel mergen
		let remaining = transferQty;
		for (let i = 0; i < targetInventory.slots.length; i++) {
			const targetItem = targetInventory.slots[i];
			if (!targetItem) continue;
			if (targetItem.id === fromItem.id && targetItem.quantity < (targetItem.maxStack || 1)) {
				const max = targetItem.maxStack || 1;
				const free = max - targetItem.quantity;
				const moved = Math.min(free, remaining);
				targetItem.quantity += moved;
				remaining -= moved;
				if (remaining === 0) break;
			}
		}

		// Restliche Items auf leeren Slot legen
		while (remaining > 0) {
			const freeIndex = targetInventory.slots.findIndex((i) => i === null);
			if (freeIndex === -1) break; // kein Platz
			const placeQty = Math.min(remaining, fromItem.maxStack || 1);
			targetInventory.slots[freeIndex] = { ...fromItem, quantity: placeQty };
			remaining -= placeQty;
		}

		// Ursprungsstapel reduzieren oder leeren
		const leftover = fromItem.quantity - transferQty;
		sourceInventory.slots[fromIndex] = leftover > 0 ? { ...fromItem, quantity: leftover } : null;

		emits('updateInventories', props.playerInventory, props.otherInventory);
	}

	function handleRightClick(uid: string) {
		const [inv, slot] = uid.split('-');
		const sourceInventory = inv === 'player' ? props.playerInventory : props.otherInventory;
		const index = Number(slot);
		const item = sourceInventory.slots[index];
		if (!item) return;
		const leftOver = Math.max(0, item.quantity--);
		if (leftOver > 0) {
			sourceInventory.slots[index] = {
				...item,
				quantity: leftOver,
			};
		} else sourceInventory.slots[index] = null;

		emits('updateInventories', props.playerInventory, props.otherInventory);
	}

	function handleMiddleClick(uid: string) {
		const [inv] = uid.split('-');
		const sourceInventory = inv === 'player' ? props.playerInventory : props.otherInventory;
		const slots = sourceInventory.slots;
		const totalSlots = slots.length;

		// 1) Alle Items extrahieren
		const items = slots.filter((i): i is Item => i !== null);

		// 2) Items alphabetisch nach UID sortieren
		items.sort((a, b) => a.uid.localeCompare(b.uid));

		// 3) Items nach maxStack zusammenführen
		const merged: Item[] = [];
		for (const item of items) {
			const existing = merged.find((i) => i.id === item.id && i.quantity < (i.maxStack || 1));
			if (existing) {
				const max = existing.maxStack || 1;
				const free = max - existing.quantity;
				if (item.quantity <= free) {
					existing.quantity += item.quantity;
				} else {
					existing.quantity = max;
					merged.push({
						...item,
						quantity: item.quantity - free,
						uid: crypto.randomUUID(),
					});
				}
			} else {
				merged.push({ ...item });
			}
		}

		// 4) Slots neu befüllen
		sourceInventory.slots = [...merged, ...Array(totalSlots - merged.length).fill(null)];

		emits('updateInventories', props.playerInventory, props.otherInventory);
	}

	// Handles Cross-Inventar Drag
	function handleDrag(fromId: string, toId: string) {
		const [fromInv, fromSlot] = fromId.split('-');
		const [toInv, toSlot] = toId.split('-');
		const fromIndex = Number(fromSlot);
		const toIndex = Number(toSlot);
		const sourceInventory = fromInv === 'player' ? props.playerInventory : props.otherInventory;
		const targetInventory = toInv === 'player' ? props.playerInventory : props.otherInventory;
		const fromItem = sourceInventory.slots[fromIndex];
		const toItem = targetInventory.slots[toIndex];

		if (!fromItem) return;

		if (toItem) {
			if (toItem.id === fromItem.id) {
				// Merge, wenn gleiche ID
				const max = toItem.maxStack || 1;
				const free = max - toItem.quantity;
				const moveQty = Math.min(free, fromItem.quantity);

				toItem.quantity += moveQty;
				const leftover = fromItem.quantity - moveQty;

				if (leftover > 0) sourceInventory.slots[fromIndex] = { ...fromItem, quantity: leftover };
				else sourceInventory.slots[fromIndex] = null;
			} else {
				// Tauschen, wenn unterschiedliche Items
				targetInventory.slots[toIndex] = fromItem;
				sourceInventory.slots[fromIndex] = toItem;
			}
		} else {
			// Leerer Slot: Item einfach verschieben
			targetInventory.slots[toIndex] = fromItem;
			sourceInventory.slots[fromIndex] = null;
		}

		emits('updateInventories', props.playerInventory, props.otherInventory);
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
