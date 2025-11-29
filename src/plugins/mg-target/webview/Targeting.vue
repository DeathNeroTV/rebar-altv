<template>
	<div v-if="isActive" class="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-row gap-2 justify-between items-center text-center select-none z-[9999]">
		<font-awesome-icon :icon="['fas', 'eye']" class="rounded-full h-12 w-12 shadow-[0_0_25px_#00873640]" :class="hasTarget ? 'text-[#008736]/90' : 'text-neutral-950/90'" />

		<Transition name="fade">
			<div v-if="showMenu" class="flex flex-col gap-2 p-1.5 min-w-[250px] max-w-[350px] rounded-lg text-gray-100 bg-neutral-950/25 border border-neutral-800/25 shadow-lg">
				<button
					v-for="opt in options"
					:key="opt.label"
					@click="handleSelect(opt)"
					class="flex flex-1 gap-2 transition-all duration-200 px-4 py-2 rounded-xl cursor-pointer bg-neutral-950/10 hover:bg-[#007836]/25 text-center items-center justify-between"
				>
					<font-awesome-icon :icon="['fas', opt.icon]" class="min-w-5" />
					<span class="w-full uppercase">{{ opt.label }}</span>
				</button>
			</div>
		</Transition>
	</div>
</template>

<script setup lang="ts">
	import { ref } from 'vue';
	import { useEvents } from '@Composables/useEvents.js';
	import { TargetOption } from '../shared/interfaces.js';
	import { TargetingEvents } from '../shared/events.js';

	const events = useEvents();

	const hasTarget = ref<boolean>(false);
	const isActive = ref<boolean>(false);
	const showMenu = ref<boolean>(false);
	const options = ref<TargetOption[]>([]);

	function handleShowTarget() {
		isActive.value = true;
	}

	function handleHasTarget(value: boolean) {
		hasTarget.value = value;
	}

	function handleOpenMenu(_options: TargetOption[]) {
		if (!isActive.value) return;
		options.value = _options;
		hasTarget.value = true;
		showMenu.value = true;
	}

	function handleHideTarget() {
		isActive.value = false;
		showMenu.value = false;
	}

	events.on(TargetingEvents.toClient.openMenu, handleOpenMenu);
	events.on(TargetingEvents.toClient.hasTarget, handleHasTarget);
	events.on(TargetingEvents.toClient.showTarget, handleShowTarget);
	events.on(TargetingEvents.toClient.hideTarget, handleHideTarget);

	function handleSelect(opt: TargetOption) {
		if (opt.type === 'server') events.emitServer(opt.event, opt.data);
		else events.emitClient(opt.event, opt.data);
		events.emitClient(TargetingEvents.toClient.hideTarget);
	}
</script>

<style scoped>
	.fade-enter-active,
	.fade-leave-active {
		transition: all 0.25s ease;
	}
	.fade-enter-from,
	.fade-leave-to {
		opacity: 0;
		transform: translateY(10px);
	}
</style>
