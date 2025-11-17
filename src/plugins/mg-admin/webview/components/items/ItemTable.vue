<script lang="ts" setup>
	import { TlrpItem } from '@Plugins/mg-inventory/shared/interfaces';

	const { items } = defineProps<{
		items: TlrpItem[];
	}>();

	const emits = defineEmits<{
		(e: 'selectItem', item: TlrpItem): void;
	}>();
</script>

<template>
	<div class="h-full w-full overflow-hidden bg-neutral-900 rounded-lg border border-neutral-800 flex flex-col">
		<!-- Tabellenkopf -->
		<div class="bg-neutral-800 text-gray-200 uppercase text-xs font-semibold select-none rounded-t-lg">
			<div class="grid grid-cols-7 text-center py-2 px-3 border-b border-neutral-700">
				<div>ID</div>
				<div>UID</div>
				<div>Name</div>
				<div>Beschreibung</div>
				<div>Maximale Stapelgröße</div>
				<div>Gewicht</div>
			</div>
		</div>

		<!-- Tabelleninhalt -->
		<div class="flex-1 overflow-y-auto overflow-x-hidden text-gray-300 select-none">
			<div
				v-for="data in items"
				:key="data.uid"
				class="grid grid-cols-7 text-center items-center py-2 px-3 border-b border-[#008736]/75 hover:bg-neutral-800/70 cursor-pointer transition-all"
				@dblclick="emits('selectItem', data)"
			>
				<div>{{ data.id }}</div>
				<div class="text-emerald-400">{{ data.uid }}</div>
				<div class="font-medium text-emerald-400 truncate">{{ data.name }}</div>
				<div class="text-gray-400 truncate">{{ data.desc }}</div>
				<div class="text-gray-400">{{ data.maxStack }}</div>
				<div class="text-gray-400">{{ data.weight.toFixed(3) }} kg</div>
			</div>

			<div v-if="items.length === 0" class="text-center text-gray-500 py-10 italic select-none">Keine Items vorhanden</div>
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
