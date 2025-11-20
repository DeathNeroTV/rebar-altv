<script setup lang="ts">
	import { ref, computed, watch } from 'vue';
	import { PlayerLog } from '../../../../shared/interfaces';

	const props = defineProps<{
		logs: PlayerLog[] | null;
		visible: boolean;
	}>();

	const emits = defineEmits<{
		(e: 'close'): void;
	}>();

	const show = ref(props.visible);
	const activeCategory = ref<'trade' | 'bank' | 'rule' | 'job' | 'team' | 'other'>('trade');

	const categoryTitles: Record<PlayerLog['category'], string> = {
		trade: 'Ver-/Kauf',
		bank: 'Bankwesen',
		rule: 'Regelbrüche',
		job: 'Jobs',
		team: 'Teams',
		other: 'Sonstige',
	};

	// Array der Kategorien für Buttons
	const categories: PlayerLog['category'][] = ['trade', 'bank', 'rule', 'job', 'team', 'other'];

	watch(
		() => props.visible,
		(v) => (show.value = v)
	);

	// Filtered logs based on category
	const filteredLogs = computed(() => {
		return (props.logs ?? []).filter((log) => log.category === activeCategory.value);
	});

	// Copy log details
	const copyLog = (log: PlayerLog) => {
		const el = document.createElement('textarea');
		el.value = `[${new Date(log.timestamp).toLocaleString()}] ${log.action}: ${log.details ?? ''}`;
		document.body.appendChild(el);
		el.select();
		document.execCommand('copy');
		document.body.removeChild(el);
	};
</script>

<template>
	<div v-if="show" class="fixed inset-0 bg-neutral-950/70 flex justify-end z-50 select-none">
		<div class="w-[45vw] h-full bg-neutral-900 border-l border-[#008736]/40 p-6 flex flex-col transition-all duration-500 transform translate-x-0 animate-slideInRight">
			<!-- HEADER -->
			<div class="flex justify-between items-center mb-6">
				<h2 class="text-2xl font-semibold text-[#008736]">Spieler-Logs</h2>
				<font-awesome-icon :icon="['fas', 'xmark']" class="text-neutral-400 hover:text-red-500 cursor-pointer text-2xl" @click="emits('close')" />
			</div>

			<!-- Kategorien -->
			<div class="flex gap-2 mb-4 flex-wrap items-center justify-center">
				<button
					v-for="cat in categories"
					:key="cat"
					class="px-3 py-1 rounded-lg"
					:class="activeCategory === cat ? 'bg-[#008736] text-gray-100' : 'bg-neutral-800 text-[#008736]'"
					@click="activeCategory = cat"
				>
					{{ categoryTitles[cat] }}
				</button>
			</div>

			<!-- Log-Liste -->
			<div class="flex-1 overflow-y-auto bg-neutral-800 rounded-xl p-4 space-y-2">
				<div v-for="log in filteredLogs" :key="log.timestamp + log.action" class="p-3 rounded-lg bg-neutral-700 hover:bg-neutral-600 flex justify-between items-start">
					<div class="text-gray-200">
						<p class="text-sm text-gray-400">{{ new Date(log.timestamp).toLocaleString() }}</p>
						<p class="font-medium">{{ log.action }}</p>
						<p class="text-gray-300 text-sm">{{ log.details }}</p>
					</div>
					<font-awesome-icon :icon="['fas', 'copy']" class="text-gray-400 hover:text-[#008736] cursor-pointer ml-2 mt-1" @click="copyLog(log)" />
				</div>
				<div v-if="filteredLogs.length === 0" class="text-gray-400 text-center py-6">Keine Einträge in dieser Kategorie.</div>
			</div>
		</div>
	</div>
</template>

<style scoped>
	@keyframes slideInRight {
		0% {
			transform: translateX(100%);
			opacity: 0;
		}
		100% {
			transform: translateX(0);
			opacity: 1;
		}
	}
	.animate-slideInRight {
		animation: slideInRight 0.35s ease-out;
	}
</style>
