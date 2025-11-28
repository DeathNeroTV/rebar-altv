<script lang="ts" setup>
	import { computed, onMounted, ref } from 'vue';
	import { useEvents } from '@Composables/useEvents';

	import { AdminEvents } from '../../shared/events';

	import ItemTable from '../components/items/ItemTable.vue';
	import ItemDetails from '../components/items/ItemDetails.vue';
	import { TlrpItem } from '@Plugins/mg-inventory/shared/interfaces';

	const events = useEvents();
	const items = ref<TlrpItem[]>([]);
	const search = ref<string>('');
	const selectedItem = ref<TlrpItem | null>(null);
	const defaultItem: TlrpItem = {
		uid: '',
		desc: '',
		icon: '',
		maxStack: 1,
		category: 'resources',
		name: 'Neuer Gegenstand',
		weight: 0.0,
		id: 0,
		quantity: 1,
		data: {},
	};

	async function refreshItems() {
		const result: TlrpItem[] = await events.emitServerRpc(AdminEvents.toServer.request.items);
		if (Array.isArray(result)) items.value = result;
	}

	const filteredItems = computed(() => {
		const s = search.value.toLowerCase();
		return items.value.filter((p) => p.name?.toLowerCase().includes(s) || String(p.id).includes(s));
	});

	async function saveItem(item: TlrpItem) {
		const success = await events.emitServerRpc(AdminEvents.toServer.item.save, item);
		if (!success) return;

		selectedItem.value = null;
		await refreshItems();
	}

	async function deleteItem(id: number) {
		selectedItem.value = null;

		const success = await events.emitServerRpc(AdminEvents.toServer.item.delete, id);
		if (!success) return;

		await refreshItems();
	}

	onMounted(async () => await refreshItems());
</script>

<template>
	<div class="h-full flex flex-col p-4 text-gray-100">
		<!-- 🧩 Titel & Suche -->
		<div class="flex justify-between items-center mb-4">
			<h1 class="text-2xl font-semibold select-none">Gegenstandsverwaltung</h1>

			<div class="flex items-center gap-3">
				<input
					v-model="search"
					type="text"
					placeholder="🔍 Gegenstand suchen..."
					class="bg-neutral-800 text-gray-100 rounded-lg px-4 py-2 focus:ring-2 focus:ring-[#008736] focus:outline-none w-72"
				/>

				<button
					@click="selectedItem = { ...defaultItem }"
					class="bg-[#008736]/90 hover:bg-[#008736] text-gray-100 px-5 py-3 rounded-lg transition-all flex items-center gap-2"
				>
					<font-awesome-icon :icon="['fas', 'plus']" />
				</button>

				<button @click="refreshItems" class="bg-[#008736]/90 hover:bg-[#008736] text-gray-100 px-5 py-3 rounded-lg transition-all flex items-center gap-2">
					<font-awesome-icon :icon="['fas', 'rotate']" />
				</button>
			</div>
		</div>

		<!-- 📊 Spielertabelle -->
		<div class="flex-1 overflow-hidden ring ring-neutral-800 rounded-lg">
			<ItemTable :items="filteredItems" @selectItem="(item: TlrpItem) => selectedItem = { ...item }" />
		</div>

		<!-- 🧍 Detailmodal -->
		<ItemDetails :visible="selectedItem !== null" :item="selectedItem" @close="selectedItem = null" @delete="deleteItem" @save="saveItem" />
	</div>
</template>

<style scoped>
	/* Dezente Scrollbar für dunkle Themes */
	::-webkit-scrollbar {
		width: 6px;
	}
	::-webkit-scrollbar-thumb {
		background: #333;
		border-radius: 3px;
	}
	::-webkit-scrollbar-thumb:hover {
		background: #555;
	}
</style>
