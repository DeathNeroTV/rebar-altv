<script lang="ts" setup>
	import { ref } from 'vue';
	import { Item } from '@Shared/types/items.js';
	import { Weapon } from '../../shared/interfaces';
	import Draggable from './Draggable.vue';

	defineProps<{
		uid: string; // z.B. "weapons"
		weapons: Weapon[];
	}>();

	const emits = defineEmits<{
		(e: 'hoverOver', weapon: Weapon | null): void;
		(e: 'dragged', fromId: string, toId: string): void;
	}>();

	const draggingItem = ref<Weapon | null>(null);
	const ghostStyle = ref<{ top: string; left: string }>({ top: '0px', left: '0px' });
	let dragOffsetX = 0;
	let dragOffsetY = 0;

	function startDragging(weapon: Weapon, event: MouseEvent) {
		draggingItem.value = weapon;

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
</script>

<template>
	<div class="min-w-64 h-full bg-neutral-950/90 rounded-3xl p-3 shadow-md">
		<h3 class="w-full text-center text-gray-100 bg-[#008736] rounded-full font-semibold px-2 py-1 mt-4 mb-2">Ausgerüstete Waffen</h3>

		<div class="w-full grid grid-cols-1 gap-3 px-5 pt-5">
			<!-- Waffen-Slots -->
			<template v-for="(weapon, index) in weapons.slice(0, 4)">
				<Draggable
					v-if="weapon"
					:key="`weapons-${weapon.uid}-${index}`"
					@onDrag="(from, to) => emits('dragged', from, to)"
					@onLeftClick="(id) => console.log('LeftClick', id)"
					@onMiddleClick="(id) => console.log('MiddleClick', id)"
					@onRightClick="(id) => console.log('RightClick', id)"
				>
					<div
						:id="`${uid}-${index}`"
						@mousedown.left.prevent="startDragging(weapon, $event)"
						@mouseenter="emits('hoverOver', weapon)"
						@mouseleave="emits('hoverOver', null)"
						class="w-50 h-44 bg-neutral-800 rounded-xl border border-neutral-600 flex items-center justify-center"
					>
						<img :id="`${uid}-${index}`" :src="`/images/${weapon?.uid}.png`" class="h-24 w-24 object-contain" />
					</div>
				</Draggable>
				<div v-else :id="`${uid}-${index}`" class="w-50 h-44 bg-neutral-800 border border-neutral-700 rounded-xl" />
			</template>

			<!-- Leere Slots -->
			<template v-for="i in Math.max(0, 4 - weapons.length)" :key="`empty-${i}`">
				<div :id="`${uid}-${weapons.length + i}`" class="w-50 h-44 bg-neutral-800 border border-neutral-700 rounded-xl" />
			</template>
		</div>
	</div>
</template>
