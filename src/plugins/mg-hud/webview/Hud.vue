<script lang="ts" setup>
	import PlayerHud from './components/PlayerHud.vue';
	import VehicleHud from './components/VehicleHud.vue';
	import '../translate/index';
</script>

<template>
	<PlayerHud />
	<VehicleHud />
	<div class="fixed bottom-0 left-1/2 -translate-x-1/2 text-xl text-gray-100 font-extrabold bg-neutral-950/25 rounded-t-lg px-4 py-2 select-none uppercase">
		early access alpha
	</div>
</template>
