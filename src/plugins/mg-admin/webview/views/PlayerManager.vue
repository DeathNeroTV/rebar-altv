<script lang="ts" setup>
	import { computed, onMounted, ref } from 'vue';
	import { useEvents } from '@Composables/useEvents';

	import { PlayerStats } from '../../shared/interfaces';
	import { AdminEvents } from '../../shared/events';

	import PlayerTable from '../components/player/PlayerTable.vue';
	import PlayerDetails from '../components/player/PlayerDetails.vue';

	const events = useEvents();
	const players = ref<PlayerStats[]>([
		{ id: 1, name: 'Roman Jackson', health: 200, armour: 0, ping: 13, pos: { x: 0, y: 0, z: 0 }, rot: { x: 0, y: 0, z: 0 }, job: ['police', 'ambulance'] },
	]);
	const search = ref<string>('');
	const selectedPlayer = ref<PlayerStats | null>(null);

	async function refreshPlayers() {
		const result: PlayerStats[] = await events.emitServerRpc(AdminEvents.toServer.request.player);
		if (Array.isArray(result)) players.value = result;
	}

	const filteredPlayers = computed(() => {
		const s = search.value.toLowerCase();
		return players.value.filter((p) => p.name?.toLowerCase().includes(s) || String(p.id).includes(s));
	});

	function openPlayerDetails(player: any) {
		selectedPlayer.value = player;
	}

	onMounted(async () => await refreshPlayers());
</script>

<template>
	<div class="h-full flex flex-col p-4 text-gray-100 bg-neutral-900/90 rounded-2xl shadow-lg">
		<!-- 🧩 Titel & Suche -->
		<div class="flex justify-between items-center mb-4">
			<h1 class="text-2xl font-semibold select-none">Spielerverwaltung</h1>

			<div class="flex items-center gap-3">
				<input
					v-model="search"
					type="text"
					placeholder="🔍 Spieler suchen..."
					class="bg-neutral-800 text-gray-100 rounded-lg px-4 py-2 focus:ring-2 focus:ring-[#008736] focus:outline-none w-72"
				/>

				<button @click="refreshPlayers" class="bg-[#008736]/90 hover:bg-[#008736] text-gray-100 px-5 py-3 rounded-lg transition-all flex items-center gap-2">
					<font-awesome-icon :icon="['fas', 'rotate']" />
				</button>
			</div>
		</div>

		<!-- 📊 Spielertabelle -->
		<PlayerTable :players="filteredPlayers" @selectPlayer="openPlayerDetails" />

		<!-- 🧍 Detailmodal -->
		<PlayerDetails v-if="selectedPlayer" :visible="selectedPlayer !== null" :player="selectedPlayer" @close="selectedPlayer = null" />
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
