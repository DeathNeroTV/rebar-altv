<script lang="ts" setup>
	import { ref, computed } from 'vue';
	import type { Inventory as InventoryType, Modifiers, Player, Weapon } from '../../shared/interfaces';
	import InventoryHolder from '../components/InventoryHolder.vue';
	import { Item } from '@Shared/types/items.js';
	import WeaponHolder from '../components/WeaponHolder.vue';
	import { useEvents } from '@Composables/useEvents';
	import { InventoryEvents } from '@Plugins/mg-inventory/shared/events';

	const events = useEvents();

	const props = defineProps<{
		inventory: InventoryType;
		player?: Player;
		playerWeapons?: Weapon[];
	}>();

	const hoveringItem = ref<Item | null>(null);

	// Gewicht berechnen
	const currentWeight = computed(() => {
		return props.inventory.slots.reduce((sum, item) => sum + (item?.weight * item?.quantity || 0), 0);
	});

	const maxWeight = props.inventory.capacity;

	// Kreisberechnung
	const radius = 70; // muss mit SVG übereinstimmen
	const circumference = 2 * Math.PI * radius;
	const dashOffset = computed(() => {
		const progress = Math.min(Math.max(0, currentWeight.value / maxWeight), 1);
		return circumference - progress * circumference;
	});

	const circleColor = computed(() => {
		const progress = currentWeight.value / maxWeight;
		if (progress < 0.75) return '#008736'; // grün
		if (progress < 1) return '#facc15'; // gelb
		return '#dc2626'; // rot
	});

	function formatCurrency(value: number) {
		return new Intl.NumberFormat('de-DE', {
			style: 'currency',
			currency: 'USD',
			minimumFractionDigits: 2,
		}).format(value);
	}

	function showToolTip(item: Item | null) {
		hoveringItem.value = item;
	}

	function onLeftClick(uid: string, modifiers: Modifiers) {
		if (!modifiers.alt && !modifiers.ctrl && !modifiers.shift) return;
		events.emitServer(InventoryEvents.toServer.leftClick, uid, modifiers);
	}

	function onRightClick(uid: string) {
		events.emitServer(InventoryEvents.toServer.rightClick, uid);
	}

	function onMiddleClick(uid: string) {
		events.emitServer(InventoryEvents.toServer.middleClick, uid);
	}

	function onItemDragged(fromId: string, toId: string) {
		events.emitServer(InventoryEvents.toServer.dragItem, fromId, toId);
	}
</script>

<template>
	<div class="w-full h-full flex gap-2 select-none overflow-hidden">
		<!-- Linke Seite: Spielerwaffen / zusätzliche Infos -->
		<WeaponHolder uid="weapons" :weapons="playerWeapons" @dragged="onItemDragged" @hover-over="" />

		<!-- Mittlere Spalte: Inventar Slots + Schnellleiste + Such/Filter -->
		<InventoryHolder
			uid="player"
			:inventory="inventory"
			:hasBar="true"
			@hoverOver="showToolTip"
			@dragged="onItemDragged"
			@leftClick="onLeftClick"
			@middleClick="onMiddleClick"
			@rightClick="onRightClick"
		/>

		<!-- Rechte Spalte: Spielerinformationen -->
		<div class="min-w-96 flex flex-col gap-2">
			<!-- Spielerinfo oben -->
			<div class="w-full bg-neutral-950/90 rounded-3xl p-3 shadow-md text-gray-100">
				<div class="w-full flex flex-row gap-5 items-center mt-4 mb-2 ml-4">
					<div class="rounded-full w-12 h-12 ring-1 ring-[#008736] p-3">
						<img src="/images/mg-admin-logo.png" />
					</div>
					<p class="text-2xl text-[#008736]">{{ player?.name ?? 'Unbekannt' }}</p>
				</div>
				<div class="w-full flex flex-row gap-2 justify-between items-center uppercase px-4"><strong class="text-[#008736]">ID:</strong> {{ player.id }}</div>
				<div class="w-full flex flex-row gap-2 justify-between items-center uppercase px-4"><strong class="text-[#008736]">Job:</strong> {{ player.job }}</div>
				<div class="w-full flex flex-row gap-2 justify-between items-center uppercase px-4"><strong class="text-[#008736]">Telefon:</strong> {{ player.phone }}</div>
				<div class="relative left-1/2 w-2/3 -translate-x-1/2 h-[2px] items-center bg-[#008736] my-2"></div>
				<div class="flex flex-row items-center justify-between px-4 gap-2">
					<div class="flex flex-row gap-1 items-center text-2xl text-[#008736]">
						<font-awesome-icon :icon="['fas', 'wallet']" />
						<p class="text-lg uppercase">bargeld</p>
					</div>
					<p class="text-2xl text-gray-100 uppercase truncate">
						{{ formatCurrency(player?.bank ?? 0) }}
					</p>
				</div>
			</div>

			<!-- Gewicht & Tooltip unten -->
			<div class="relative h-full bg-neutral-950/90 rounded-3xl p-5 shadow-md text-gray-100 flex flex-col gap-5 items-center justify-start overflow-hidden">
				<h3 class="text-[#008736] text-lg font-semibold mb-2 uppercase">Traglast</h3>

				<!-- Kreis -->
				<div class="relative w-40 h-40 flex items-center justify-center">
					<svg class="w-full h-full transform -rotate-90" :viewBox="`0 0 ${(radius + 5) * 2} ${(radius + 5) * 2}`">
						<circle class="text-neutral-800/75" stroke="currentColor" stroke-width="5" fill="transparent" :r="radius" :cx="radius + 5" :cy="radius + 5" />
						<circle
							class="transition-all duration-500 ease-out"
							:stroke="circleColor"
							stroke-width="10"
							stroke-linecap="round"
							fill="transparent"
							:stroke-dasharray="circumference"
							:stroke-dashoffset="dashOffset"
							:r="radius"
							:cx="radius + 5"
							:cy="radius + 5"
						/>
					</svg>

					<div class="absolute text-center">
						<p class="text-2xl font-bold" :style="{ color: circleColor }">{{ currentWeight.toFixed(1) }} kg</p>
						<p class="text-sm text-neutral-500">von {{ maxWeight }} kg</p>
					</div>
				</div>

				<!-- Tooltip (unten zentriert) -->
				<transition name="fade">
					<div
						v-if="hoveringItem"
						class="absolute bottom-6 left-1/2 -translate-x-1/2 bg-neutral-900/95 border border-[#008736]/70 shadow-lg shadow-[#008736]/20 rounded-2xl p-4 w-72 flex flex-col items-center text-center z-50"
					>
						<img :src="'/images/' + hoveringItem.icon + '.png'" class="w-20 h-20 object-contain mb-3" />
						<h3 class="text-lg font-bold text-[#008736] uppercase tracking-wide">
							{{ hoveringItem.name }}
						</h3>
						<p class="text-neutral-500 text-sm mt-1 leading-snug px-2">
							{{ hoveringItem.desc }}
						</p>
					</div>
				</transition>
			</div>
		</div>
	</div>
</template>

<style scoped>
	.fade-enter-active,
	.fade-leave-active {
		transition: opacity 0.3s ease;
	}
	.fade-enter-from,
	.fade-leave-to {
		opacity: 0;
	}
</style>
