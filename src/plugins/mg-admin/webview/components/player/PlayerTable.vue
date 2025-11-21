<script lang="ts" setup>
	import { PlayerStats } from '@Plugins/mg-admin/shared/interfaces';

	const props = defineProps<{
		players: PlayerStats[];
	}>();

	const playerJob = (_id: string) => {
		const player = props.players.find((x) => x.account_id === _id);
		if (typeof player.name === 'number') return '—';
		return Array.isArray(player.job!) ? player.job!.join(', ') : player.job! || 'arbeitslos';
	};

	const emits = defineEmits<{
		(e: 'selectPlayer', player: PlayerStats): void;
	}>();
</script>

<template>
	<div class="h-full w-full overflow-hidden flex flex-col rounded-lg ring ring-neutral-800">
		<!-- Tabellenkopf -->
		<div class="bg-neutral-800 text-gray-200 uppercase text-xl font-semibold select-none">
			<div class="grid grid-cols-6 text-center py-2 px-3 border-b border-neutral-700">
				<div>ID</div>
				<div>Name/Discord-ID</div>
				<div>Ping</div>
				<div>Gesundheit</div>
				<div>Schutzweste</div>
				<div>Beruf(e)</div>
			</div>
		</div>

		<!-- Tabelleninhalt -->
		<div class="flex-1 overflow-y-auto overflow-x-hidden text-gray-300 select-none">
			<div
				v-for="player in players"
				:key="player.id"
				class="grid grid-cols-6 text-center items-center py-2 px-3 border-b border-[#008736] hover:bg-neutral-800/25 cursor-pointer transition-all"
				@dblclick="emits('selectPlayer', player)"
			>
				<div>{{ player.id }}</div>
				<div class="font-medium text-emerald-400 truncate">{{ player.name }}</div>
				<div class="text-emerald-400">{{ player.ping ?? '—' }}</div>
				<div class="text-emerald-400">{{ player.health ?? '—' }}</div>
				<div class="text-gray-400">{{ player.armour ?? '—' }}</div>
				<div class="text-gray-400 truncate">{{ playerJob(player.account_id) }}</div>
			</div>

			<div v-if="players.length === 0" class="text-center text-gray-500 py-10 select-none">Keine Spieler online</div>
		</div>
	</div>
</template>

<style scoped>
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
