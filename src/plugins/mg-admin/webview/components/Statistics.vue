<script setup lang="ts">
	import { Line } from 'vue-chartjs';
	import { Chart as ChartJS, Title, Tooltip, Legend, LineElement, PointElement, LinearScale, CategoryScale } from 'chart.js';
	import { ref, onMounted, onUnmounted, computed } from 'vue';

	import { useEvents } from '@Composables/useEvents';
	import { useTranslate } from '@Shared/translate';
	import { AdminEvents } from '@Plugins/mg-admin/shared/events';

	ChartJS.register(Title, Tooltip, Legend, LineElement, PointElement, LinearScale, CategoryScale);

	const { language } = defineProps({ language: String });

	const { t } = useTranslate(language);
	const events = useEvents();
	const CHECK_INTERVAL = 1 * 60 * 1000;

	let interval: NodeJS.Timeout | null;
	const labels = ref<string[]>([]);
	const cpuData = ref<number[]>([]);
	const ramData = ref<number[]>([]);
	const diskData = ref<number[]>([]);

	const chartData = computed(() =>
		Object.freeze({
			labels: [...labels.value],
			datasets: [
				{
					label: t('admin.panel.monitoring.cpu'),
					backgroundColor: '#ef4444',
					data: [...cpuData.value],
					fill: false,
					tension: 0.3,
				},
				{
					label: t('admin.panel.monitoring.ram'),
					backgroundColor: '#3b82f6',
					data: [...ramData.value],
					fill: false,
					tension: 0.3,
				},
				{
					label: t('admin.panel.monitoring.disk'),
					backgroundColor: '#22c55e',
					data: [...diskData.value],
					fill: false,
					tension: 0.3,
				},
			],
		})
	);

	const chartOptions = Object.freeze({
		responsive: true,
		maintainAspectRatio: false,
		animation: { duration: 300 },
		scales: {
			y: {
				beginAtZero: true,
				max: 100,
				ticks: { color: '#ccc' },
				grid: { color: '#333' },
			},
			x: {
				ticks: { color: '#aaa' },
				grid: { color: '#222' },
			},
		},
		plugins: {
			legend: { labels: { color: '#fff' } },
		},
	});

	onMounted(async () => {
		const payload = await events.emitServerRpc(AdminEvents.toServer.request.usage);
		if (payload) {
			const time = new Date().toLocaleTimeString();
			labels.value.push(time);
			cpuData.value.push(payload.cpuUsage);
			ramData.value.push(payload.ramUsage);
			diskData.value.push(payload.diskUsage);
		}
		interval = setInterval(async () => {
			const stats = await events.emitServerRpc(AdminEvents.toServer.request.usage);
			const time = new Date().toLocaleTimeString();

			if (labels.value.length > 20) {
				labels.value.shift();
				cpuData.value.shift();
				ramData.value.shift();
				diskData.value.shift();
			}

			labels.value.push(time);
			cpuData.value.push(stats.cpuUsage);
			ramData.value.push(stats.ramUsage);
			diskData.value.push(stats.diskUsage);
		}, CHECK_INTERVAL);
	});

	onUnmounted(() => {
		if (interval) clearInterval(interval);
	});
</script>

<template>
	<div class="min-w-full max-w-full select-none bg-neutral-900/50 px-5 pt-5 pb-10 rounded-2xl shadow-lg overflow-hidden">
		<h2 class="text-xl font-semibold text-gray-100">{{ t('admin.panel.monitoring.title') }}</h2>
		<Line :data="chartData" :options="chartOptions" key="server-stats-chart" />
	</div>
</template>
