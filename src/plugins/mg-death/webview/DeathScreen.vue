<script setup lang="ts">
	import { ref, computed, onUnmounted } from 'vue';
	import { useEvents } from '@Composables/useEvents.js';
	import { DeathEvents } from '../shared/events.js';
	import { useTranslate } from '@Shared/translate.js';
	import '../translate/index';
	import { DeathConfig } from '../shared/config.js';

	const { t } = useTranslate('de');
	const events = useEvents();

	// === Core Reactive States ===
	const isDead = ref(false);
	const canRespawn = ref(false);
	const doRespawn = ref(false);
	const calledEMS = ref(false);

	// === Revive HUD ===
	const isReviving = ref(false);
	const reviveProgress = ref(0);

	// === Timer Logic ===
	const timeLeft = ref(0);
	const totalTime = ref(0);
	let reviveInterval: NodeJS.Timeout | null = null;
	let timerInterval: NodeJS.Timeout | null = null;

	// === Computed Properties ===
	const formattedTime = computed(() => {
		const seconds = Math.max(0, Math.floor(timeLeft.value / 1000));
		const minutes = Math.floor(seconds / 60)
			.toString()
			.padStart(2, '0');
		const sec = (seconds % 60).toString().padStart(2, '0');
		return `${minutes}:${sec}`;
	});

	const progress = computed(() => {
		if (totalTime.value <= 0) return 0;
		return isReviving.value ? reviveProgress.value : (timeLeft.value / totalTime.value) * 100;
	});

	// === Internal Helpers ===
	const resetState = () => {
		isDead.value = false;
		isReviving.value = false;
		canRespawn.value = false;
		doRespawn.value = false;
		calledEMS.value = false;
		reviveProgress.value = 0;
		clearTimer();
	};

	const clearTimer = () => {
		if (!!timerInterval) {
			clearInterval(timerInterval);
			timerInterval = null;
		}
		if (!!reviveInterval) {
			clearInterval(reviveInterval);
			reviveInterval = null;
		}
	};

	const startTimer = (ms: number) => {
		clearTimer();
		isDead.value = true;
		isReviving.value = false;
		canRespawn.value = false;

		totalTime.value = ms;
		timeLeft.value = ms;

		timerInterval = setInterval(() => {
			if (timeLeft.value <= 1000) {
				clearTimer();
				canRespawn.value = true;
				timeLeft.value = 0;
				return;
			}
			timeLeft.value -= 1000;
		}, 1000);
	};

	// === Event Bindings ===
	events.on(DeathEvents.toWebview.startTimer, startTimer);

	events.on(DeathEvents.toWebview.stopTimer, () => {
		clearTimer();
		totalTime.value = 0;
		timeLeft.value = 0;
		canRespawn.value = true;
	});

	events.on(DeathEvents.toWebview.startRevive, () => {
		if (reviveInterval) return;

		isReviving.value = true;
		reviveProgress.value = 0;

		reviveInterval = setInterval(() => {
			if (reviveProgress.value >= 100) {
				clearInterval(reviveInterval);
				events.emitClient(DeathEvents.toClient.reviveComplete);
				resetState();
				reviveInterval = null;
				return;
			}

			reviveProgress.value += 5;
		}, DeathConfig.reviveTime / 20);
	});

	events.on(DeathEvents.toWebview.stopRevive, () => {
		isReviving.value = false;
		reviveProgress.value = 0;
	});

	events.on(DeathEvents.toWebview.confirmEms, () => {
		calledEMS.value = true;
	});

	events.on(DeathEvents.toWebview.requestRespawn, () => (doRespawn.value = true));

	events.on(DeathEvents.toWebview.respawned, resetState);

	// === Cleanup ===
	onUnmounted(() => resetState());
</script>

<template>
	<transition name="fade">
		<div v-if="isDead || isReviving" class="fixed inset-0 z-50 flex items-center justify-center bg-neutral-950/70 text-gray-100">
			<!-- === Death HUD === -->
			<div
				v-if="isDead && !isReviving"
				class="relative w-[380px] p-6 text-center backdrop-blur-sm bg-neutral-950/60 border border-[#008736]/60 rounded-2xl shadow-[0_0_25px_#00873640]"
			>
				<div class="mx-auto mb-4 h-1 w-24 select-none rounded-full bg-[#008736] animate-pulseGlow"></div>

				<h1 class="mb-2 select-none text-3xl font-bold uppercase tracking-wider text-[#008736]">
					{{ t('death.downed') }}
				</h1>

				<p class="mb-4 text-xs uppercase tracking-widest text-gray-300">
					{{ t('death.critical') }}
				</p>

				<div class="mb-4 select-none font-mono text-5xl font-semibold text-[#008736] drop-shadow-[0_0_8px_#008736aa]">
					{{ formattedTime }}
				</div>

				<!-- Timer Progress -->
				<div class="mb-6 h-1.5 w-full overflow-hidden rounded-full bg-neutral-800/50">
					<div class="h-1.5 bg-[#008736] transition-all duration-1000 ease-linear" :style="{ width: `${progress}%` }"></div>
				</div>

				<!-- EMS Call -->
				<div v-if="!calledEMS && !canRespawn" class="select-none py-1 text-xs uppercase tracking-widest text-gray-300">
					{{ t('death.callEMS') }}
				</div>
				<div v-else-if="calledEMS && !canRespawn" class="select-none py-1 text-xs font-semibold uppercase text-[#008736] animate-pulseGlow">
					{{ t('death.emsCalled') }}
				</div>

				<!-- Respawn -->
				<div v-if="canRespawn" class="mt-2 select-none text-xs font-semibold uppercase tracking-wider text-[#008736] animate-pulseGlow">
					{{ t('death.pressEToRespawn') }}
				</div>

				<!-- Handled-Respawn -->
				<div v-else-if="doRespawn" class="mt-2 select-none text-xs font-semibold uppercase tracking-wider text-[#008736] animate-pulseGlow">
					{{ t('death.pressedEToRespawn') }}
				</div>
			</div>

			<!-- === Reviver HUD === -->
			<div
				v-else-if="isReviving"
				class="relative w-[380px] p-6 text-center backdrop-blur-sm bg-neutral-950/60 border border-[#008736]/60 rounded-2xl shadow-[0_0_25px_#00873640]"
			>
				<div class="mx-auto mb-4 h-1 w-24 select-none rounded-full bg-[#008736] animate-pulseGlow"></div>

				<h1 class="mb-3 select-none text-2xl font-bold uppercase tracking-wider text-[#008736]">
					{{ t('death.downed') }}
				</h1>

				<div class="mb-4 select-none text-sm uppercase tracking-widest text-gray-300">
					{{ t('death.beingRevived') }}
				</div>

				<div class="mb-4 h-2 w-full overflow-hidden rounded-full bg-neutral-800/50">
					<div class="h-2 bg-[#008736] transition-all duration-300 ease-linear" :style="{ width: `${reviveProgress}%` }"></div>
				</div>

				<div class="text-xs uppercase text-gray-400">{{ reviveProgress.toFixed(0) }}%</div>
			</div>
		</div>
	</transition>
</template>

<style scoped>
	.fade-enter-active,
	.fade-leave-active {
		transition: opacity 0.8s;
	}
	.fade-enter-from,
	.fade-leave-to {
		opacity: 0;
	}

	@keyframes pulseGlow {
		0%,
		100% {
			box-shadow: 0 0 10px #008736aa;
			opacity: 1;
		}
		50% {
			box-shadow: 0 0 25px #008736ff;
			opacity: 0.8;
		}
	}
	.animate-pulseGlow {
		animation: pulseGlow 2s infinite;
	}
</style>
