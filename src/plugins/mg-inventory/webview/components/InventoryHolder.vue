<script lang="ts" setup>
	import { computed, ref } from 'vue';
	import { Item } from '@Shared/types/items.js';

	import type { Inventory as InventoryType, Modifiers } from '../../shared/interfaces';

	import Draggable from './Draggable.vue';

	const props = defineProps<{
		uid: string;
		inventory: InventoryType;
		hasBar: boolean;
	}>();

	const emits = defineEmits<{
		(e: 'hoverOver', item: Item | null): void;
		(e: 'leftClick', uid: string, modifiers: { shift: boolean; ctrl: boolean }): void;
		(e: 'doubleClick', uid: string): void;
		(e: 'rightClick', uid: string): void;
		(e: 'middleClick', uid: string): void;
		(e: 'dragStart', uid: string): void;
		(e: 'dragStop', uid: string): void;
		(e: 'dragged', fromId: string, toId: string): void;
	}>();

	const searchQuery = ref('');
	const selectedCategory = ref<'all' | 'medical' | 'eatable' | 'weapons' | 'drugs' | 'resources'>('all');

	const categories = [
		{ value: 'all', icon: 'bars' },
		{ value: 'medical', icon: 'kit-medical' },
		{ value: 'eatable', icon: 'utensils' },
		{ value: 'weapons', icon: 'gun' },
		{ value: 'drugs', icon: 'cannabis' },
		{ value: 'resources', icon: 'screwdriver-wrench' },
	] as const;

	const displayedItems = computed(() => {
		const slots = props.inventory.slots;

		// Wenn weder Suche noch Kategorie aktiv → alle Slots zurückgeben
		const isSearching = searchQuery.value.trim().length > 0;
		const isCategory = selectedCategory.value !== 'all';

		if (!isSearching && !isCategory) {
			return slots.map((x) => x);
		}

		const filtered = slots.filter((item) => {
			if (!item) return false;
			const matchesSearch = isSearching ? item.name.toLowerCase().includes(searchQuery.value.toLowerCase()) : true;
			const matchesCategory = isCategory ? item.category.toLowerCase() === selectedCategory.value.toLowerCase() : true;
			return matchesSearch && matchesCategory;
		});

		const totalSlots = Math.max(filtered.length, 30);
		const grid: (Item | null)[] = [];
		for (let i = 0; i < totalSlots; i++) {
			grid.push(filtered[i] || null);
		}

		return grid;
	});

	const draggingItem = ref<Item | null>(null);
	const ghostStyle = ref<{ top: string; left: string }>({ top: '0px', left: '0px' });
	let dragOffsetX = 0;
	let dragOffsetY = 0;

	function startDragging(item: Item, event: MouseEvent) {
		draggingItem.value = item;

		const target = event.target as HTMLElement;
		const rect = target.getBoundingClientRect();

		dragOffsetX = event.clientX - rect.left + rect.width * 2;
		dragOffsetY = event.clientY - rect.top + rect.height;

		updateGhostPosition(event);

		document.addEventListener('mousemove', onMouseMove);
		document.addEventListener('mouseup', stopDragging);

		document.body.style.overflow = 'hidden';
	}

	function onMouseMove(event: MouseEvent) {
		updateGhostPosition(event);
	}

	function updateGhostPosition(event: MouseEvent) {
		ghostStyle.value.top = `${event.clientY - dragOffsetY}px`;
		ghostStyle.value.left = `${event.clientX - dragOffsetX}px`;
	}

	function stopDragging() {
		document.removeEventListener('mousemove', onMouseMove);
		document.removeEventListener('mouseup', stopDragging);
		document.body.style.overflow = '';
		draggingItem.value = null;
	}

	// Klick-Events
	function handleLeftClick(uid: string, modifiers: Modifiers) {
		emits('leftClick', uid, modifiers);
	}

	function handleRightClick(uid: string) {
		emits('rightClick', uid);
	}
	function handleMiddleClick(uid: string) {
		emits('middleClick', uid);
	}
	function handleDoubleClick(uid: string) {
		emits('doubleClick', uid);
	}
	function handleDrag(fromId: string, toId: string) {
		emits('dragged', fromId, toId);
	}
	function handleDragStart(uid: string) {
		emits('dragStart', uid);
	}
	function handleDragStop(uid: string) {
		emits('dragStart', uid);
	}
</script>

<template>
	<div class="flex flex-col gap-2 p-5 bg-neutral-950/90 rounded-3xl w-full h-full overflow-hidden">
		<!-- Ghost Item -->
		<div v-if="draggingItem" class="pointer-events-none z-[9999] w-24 h-24 fixed" :style="{ top: ghostStyle.top, left: ghostStyle.left }">
			<img :src="'/images/' + draggingItem.icon + '.png'" />
		</div>

		<!-- Searchbar -->
		<div class="flex gap-5 items-center">
			<div class="w-1/2 flex flex-row gap-2 p-2 rounded-full bg-neutral-800 items-center">
				<font-awesome-icon :icon="['fas', 'search']" class="text-neutral-600 pl-3" />
				<div class="bg-neutral-600 w-0.5 h-5"></div>
				<input type="text" v-model="searchQuery" placeholder="Suchen..." class="flex-1 bg-neutral-800 text-gray-100 focus:outline-none placeholder-neutral-600" />
			</div>
			<div class="w-1/2 flex flex-row gap-5 text-gray-100 text-3xl items-center justify-end">
				<font-awesome-icon
					v-for="cat in categories"
					:icon="['fas', cat.icon]"
					:key="cat.value"
					@click="selectedCategory = cat.value"
					class="transition-all duration-300"
					:class="[selectedCategory === cat.value ? 'text-[#008736]' : 'hover:text-[#008736]']"
				/>
			</div>
		</div>

		<!-- Inventory Grid -->
		<div class="w-full h-full overflow-y-auto">
			<div class="w-full h-full grid grid-cols-5 gap-3 p-2" @mousedown.middle.prevent="handleMiddleClick(`${uid}-0`)">
				<template v-for="(item, index) in displayedItems">
					<Draggable
						v-if="item"
						:key="uid + '-' + index"
						@onDrag="handleDrag"
						@onLeftClick="handleLeftClick"
						@onDblClick="handleDoubleClick"
						@onMiddleClick="handleMiddleClick"
						@onRightClick="handleRightClick"
						@onDragStart="handleDragStart"
						@onDragStop="handleDragStop"
					>
						<div
							v-if="!searchQuery && selectedCategory === 'all'"
							:id="uid + '-' + index"
							@mousedown.left.prevent="startDragging(item, $event)"
							@mouseenter="emits('hoverOver', item)"
							@mouseleave="emits('hoverOver', null)"
							draggable="false"
							class="flex items-center justify-center bg-neutral-800 rounded-lg relative border border-neutral-700 hover:border-[#008736] transition-transform cursor-pointer"
						>
							<img :id="uid + '-' + index" :src="'/images/' + item.icon + '.png'" class="w-24 h-24 object-contain" draggable="false" />
							<span v-if="item.quantity > 1" class="absolute bottom-1 right-1 text-xs text-gray-100 bg-neutral-900 px-2 py-1 rounded">
								{{ item.quantity }}
							</span>
						</div>
						<div
							v-else
							@mouseenter="emits('hoverOver', item)"
							@mouseleave="emits('hoverOver', null)"
							draggable="false"
							class="flex items-center justify-center bg-neutral-800 rounded-lg relative border border-neutral-700 hover:border-[#008736] transition-transform cursor-pointer"
						>
							<img :src="'/images/' + item.icon + '.png'" class="w-24 h-24 object-contain" draggable="false" />
							<span v-if="item.quantity > 1" class="absolute bottom-1 right-1 text-xs text-gray-100 bg-neutral-900 px-2 py-1 rounded">
								{{ item.quantity }}
							</span>
						</div>
					</Draggable>
					<div
						v-else
						:id="uid + '-' + index"
						@mousedown.middle.prevent="handleMiddleClick(uid + '-' + index)"
						class="w-full h-24 bg-neutral-800 rounded-lg border border-neutral-700"
					></div>
				</template>
			</div>
		</div>

		<!-- Schnellleiste (4 Slots) -->
		<div v-if="hasBar" class="flex gap-2 justify-center">
			<div v-for="n in 4" :key="n" class="w-full h-24 bg-neutral-800 rounded-lg border border-neutral-700 flex items-center justify-center text-white font-semibold">
				{{ n }}
			</div>
		</div>
	</div>
</template>

<style scoped>
	::-webkit-scrollbar {
		width: 8px;
	}
	::-webkit-scrollbar-track {
		background: rgba(31, 31, 31, 0.8); /* dunkler Hintergrund */
		border-radius: 8px;
	}
	::-webkit-scrollbar-thumb {
		background: #008736; /* dein GTA-RP Grün */
		border-radius: 8px;
		transition: background-color 0.3s ease;
	}
	::-webkit-scrollbar-thumb:hover {
		background: #00a74b; /* etwas helleres Grün beim Hover */
	} /* Firefox-Unterstützung */
	* {
		scrollbar-width: thin;
		scrollbar-color: #008736 rgba(31, 31, 31, 0.8);
	}
</style>
