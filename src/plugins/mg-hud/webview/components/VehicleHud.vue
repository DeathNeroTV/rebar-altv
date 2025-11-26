<script setup lang="ts">
	import { computed, onMounted, reactive, ref } from 'vue';

	import { useEvents } from '@Composables/useEvents';
	import { HudEvents } from '@Plugins/mg-hud/shared/events';
	import { Vehicle } from '@Shared/types';

	const events = useEvents();

	let isVisible = ref<boolean>(false);
	const data = reactive<Partial<Vehicle>>({
		speed: 0,
		gear: 0,
		fuel: 0,
		rpm: 0,
		maxSpeed: 0,
		stateProps: { engineOn: false, lightState: 1, bodyHealth: 0, engineHealth: 0 },
	});

	const uPerMinute = computed(() => Math.floor(data.rpm * 8000));

	const pct = computed(() => Math.max(0, Math.min(100, (data.stateProps.engineHealth / 1000) * 100)));
	const color = computed(() => {
		const t = pct.value / 100;
		const r1 = 255,
			g1 = 0,
			b1 = 0;
		const r2 = 0,
			g2 = 135,
			b2 = 54;
		const r = Math.floor(r1 + (r2 - r1) * t);
		const g = Math.floor(g1 + (g2 - g1) * t);
		const b = Math.floor(b1 + (b2 - b1) * t);
		return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
	});

	onMounted(() => {
		events.on(HudEvents.toWebview.toggleVehicle, (value: boolean) => {
			isVisible.value = value;
			events.emitClient(HudEvents.toWebview.toggleVehicle, value);
		});
		events.on(HudEvents.toWebview.updateVehicle, <K extends keyof Vehicle>(payload: { key: K; value: Vehicle[K] }) => {
			if (!payload) return;
			data[payload.key] = payload.value;
		});
	});
</script>

<template>
	<div v-if="isVisible" class="fixed bottom-0 right-0 w-[300px] h-fit flex flex-col gap-1 bg-neutral-950/25 text-gray-100 p-2 rounded-tl-lg select-none pointer-events-none">
		<!-- Horizontal Armor and Health Bars -->
		<div class="w-full h-full flex flex-col gap-1">
			<!-- Armor Bar (One Row, 3 Main Segments, 4 Sub-Segments Each) -->
			<div class="relative flex w-full h-3 gap-2">
				<!-- 3 Main Segments -->
				<div v-for="segment in 3" :key="'armor-main-segment-' + segment" class="relative flex-1 flex gap-0.5 h-full">
					<!-- Background Sub-Segments -->
					<div v-for="subSegment in 4" :key="'armor-bg-' + segment + '-' + subSegment" class="flex-1 h-full bg-neutral-950/25"></div>
				</div>

				<!-- Foreground Sub-Segments (linear fill over 12 segments) -->
				<div class="absolute top-0 left-0 flex h-full w-full gap-0.5">
					<div
						v-for="i in 12"
						:key="'armor-fg-linear-' + i"
						class="flex-1 h-full"
						:class="{ 'bg-gray-100': i <= Math.ceil((data.stateProps.bodyHealth / 1000) * 12) }"
					></div>
				</div>
			</div>

			<!-- Health Bar -->
			<div class="relative h-2 bg-neutral-950/25">
				<div class="absolute top-0 left-0 h-full bg-green-700" :style="{ width: data.fuel + '%' }"></div>
			</div>
		</div>

		<!-- Main Stats Section -->
		<div class="w-full flex flex-row gap-1 justify-between items-start overflow-hidden">
			<!-- Icons & Time -->
			<div class="w-full flex flex-col gap-1.5">
				<div class="flex text-center justify-between gap-1">
					<div class="relative w-full h-8 flex items-center border-t border-b">
						<div class="flex flex-1 gap-2 w-full bg-transparent text-center items-center">
							<font-awesome-icon :icon="['fas', 'tachometer-alt']" class="ml-1 text-lg text-gray-100" />
							<span class="w-full">{{ uPerMinute.toFixed(0) }}</span>
						</div>
					</div>
					<div class="relative w-full h-8 flex items-center justify-center border-t border-b">
						<div class="flex flex-1 gap-2 w-full bg-transparent text-center items-center">
							<font-awesome-icon :icon="['fas', 'gear']" class="ml-1 text-lg text-gray-100" />
							<span class="w-full">{{ data.gear.toFixed(0) }}</span>
						</div>
					</div>
					<div class="relative min-w-8 h-8 flex items-center justify-center border-t border-b">
						<div class="absolute bottom-0 left-0 w-full h-full" :style="{ backgroundColor: data.stateProps.engineOn ? color : 'transparent' }"></div>
						<div class="relative items-center place-content-center">
							<font-awesome-icon :icon="['fas', 'car-battery']" class="text-lg text-gray-100" />
						</div>
					</div>
					<div class="relative min-w-8 h-8 flex items-center justify-center border-t border-b">
						<div class="absolute bottom-0 left-0 w-full h-full" :class="data.stateProps.lightState !== 0 ? 'bg-[#008736]' : 'bg-transparent'"></div>
						<div class="z-10 items-center place-content-center">
							<font-awesome-icon :icon="['fas', 'lightbulb']" class="text-lg text-gray-100" />
						</div>
					</div>
				</div>
				<div class="flex flex-1 gap-2 w-full h-7 border-t border-b items-center justify-center">
					<font-awesome-icon :icon="['fas', 'dashboard']" class="text-lg text-gray-100" />
					<div class="text-center">{{ data.speed.toFixed(0) }} KM/H</div>
				</div>
			</div>
		</div>
	</div>
</template>
