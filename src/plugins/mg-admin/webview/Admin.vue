<script lang="ts" setup>
	import { ref, reactive, computed, onMounted } from 'vue';
	import { useEvents } from '@Composables/useEvents';

	import Sidebar from './components/Sidebar.vue';
	import Dashboard from './views/Dashboard.vue';
	import WhitelistManager from './views/WhitelistManager.vue';
	import PlayerManager from './views/PlayerManager.vue';
	import VehicleManager from './views/VehicleManager.vue';
	import JobManager from './views/JobManager.vue';
	import SettingsManager from './views/SettingsManager.vue';
	import GarageManager from './views/GarageManager.vue';
	import { AdminEvents } from '../shared/events';
	import { AdminConfig } from '../shared/config';
	import { DashboardStat } from '../shared/interfaces';
	import ItemManager from './views/ItemManager.vue';

	const events = useEvents();

	const activePage = ref<string>('dashboard');
	const audio = ref<HTMLAudioElement>(new Audio('../sounds/anti-spam.ogg'));
	const spamList = ref<{ id: number; top: string; left: string }[]>([]);
	const infos = reactive<DashboardStat[]>(AdminConfig.infos);

	const pages = {
		dashboard: Dashboard,
		whitelist: WhitelistManager,
		players: PlayerManager,
		vehicles: VehicleManager,
		jobs: JobManager,
		garages: GarageManager,
		items: ItemManager,
		settings: SettingsManager,
	};

	const activeComponent = computed(() => pages[activePage.value]);
	const spamming = () => {
		if (audio.value) {
			audio.value.pause();
			audio.value.currentTime = 0;
			audio.value.volume = 0.35;
			audio.value.play().catch((err) => console.warn('Audio konnte nicht abgespielt werden:', err));
		}
		const total = 20; // Anzahl der Symbole
		const delayStep = 150; // ms zwischen den Popups

		for (let i = 0; i < total; i++) {
			setTimeout(() => {
				let top: number;
				let left: number;
				let attempts = 0;

				// Random Position mit Abstand prüfen
				do {
					top = Math.random() * 70 + 10; // 10–80%
					left = Math.random() * 70 + 10; // 10–80%
					attempts++;
				} while (
					spamList.value.some((s) => {
						const sTop = parseFloat(s.top);
						const sLeft = parseFloat(s.left);
						return Math.abs(sTop - top) < 8 && Math.abs(sLeft - left) < 15;
					}) &&
					attempts < 10
				);

				const id = Date.now() + Math.random(); // eindeutige ID
				spamList.value.push({ id, top: `${top}%`, left: `${left}%` });

				// Automatisch wieder entfernen nach 1.5–3 Sekunden
				setTimeout(() => {
					spamList.value = spamList.value.filter((s) => s.id !== id);
				}, 7400);
			}, i * delayStep);
		}
	};

	const setActivePage = (page: string) => (activePage.value = page);
	const logout = () => events.emitServer(AdminEvents.toServer.logout);

	onMounted(() => {
		audio.value.pause();
		audio.value.currentTime = 0;
	});
</script>

<template>
	<div class="w-screen h-screen flex flex-row bg-transparent text-gray-100 z-50">
		<Sidebar :active="activePage" @navigate="setActivePage" @logout="logout" :language="AdminConfig.language" :sections="infos" @spamming="spamming" />

		<!-- Main Content -->
		<div class="flex flex-1 flex-col bg-neutral-950/95">
			<!-- Content -->
			<main class="flex-1 overflow-y-auto">
				<component :is="activeComponent" @navigate="setActivePage" :language="AdminConfig.language" />
			</main>
		</div>

		<div v-if="spamList.length > 0" class="absolute top-0 left-0 w-screen h-screen bg-neutral-950">
			<transition-group name="spam-fly" tag="div">
				<div
					v-for="spam in spamList"
					:key="spam.id"
					class="fixed text-red-500/90 text-6xl font-extrabold select-none pointer-events-none animate-bounce-fast"
					:style="{ top: spam.top, left: spam.left }"
				>
					🧠 SPAM!
				</div>
			</transition-group>
		</div>
	</div>
</template>

<style scoped>
	@keyframes bounceFast {
		0% {
			transform: translateY(0) scale(1);
		}
		25% {
			transform: translateY(-25px) scale(1.1) rotate(-5deg);
		}
		50% {
			transform: translateY(0) scale(1);
		}
		75% {
			transform: translateY(-20px) scale(1.05) rotate(5deg);
		}
		100% {
			transform: translateY(0) scale(1);
			opacity: 0;
		}
	}

	.animate-bounce-fast {
		animation: bounceFast 1.5s ease-in-out infinite;
	}

	.spam-fly-enter-active,
	.spam-fly-leave-active {
		transition: opacity 0.3s ease;
	}
	.spam-fly-enter-from,
	.spam-fly-leave-to {
		opacity: 0;
	}
</style>
