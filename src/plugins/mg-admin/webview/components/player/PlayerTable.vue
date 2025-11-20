<script lang="ts" setup>
	import { PlayerStats } from '@Plugins/mg-admin/shared/interfaces';

	const { players } = defineProps<{
		players: PlayerStats[];
	}>();

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
				<div>Name</div>
				<div>Ping</div>
				<div>Gesundheit</div>
				<div>Schutzweste</div>
				<div>Beruf(e)</div>
			</div>
		</div>

		<!-- Tabelleninhalt -->
		<div class="flex-1 overflow-y-auto overflow-x-hidden text-gray-300 select-none">
			<div
				v-for="p in players"
				:key="p.id"
				class="grid grid-cols-6 text-center items-center py-2 px-3 border-b border-[#008736] hover:bg-neutral-800/25 cursor-pointer transition-all"
				@dblclick="emits('selectPlayer', p)"
			>
				<div>{{ p.id }}</div>
				<div class="font-medium text-emerald-400 truncate">{{ p.name }}</div>
				<div :class="p.ping > 100 ? 'text-red-400' : 'text-emerald-400'">{{ p.ping }}</div>
				<div :class="p.health < 50 ? 'text-red-400' : 'text-emerald-400'">{{ p.health }}</div>
				<div :class="p.armour > 0 ? 'text-blue-400' : 'text-gray-400'">{{ p.armour }}</div>
				<div class="text-gray-400 truncate">
					{{ Array.isArray(p.job!) ? p.job.join(', ') : p.job || 'arbeitslos' }}
				</div>
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
