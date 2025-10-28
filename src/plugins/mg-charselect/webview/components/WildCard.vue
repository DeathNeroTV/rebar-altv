<script lang="ts" setup>
	const props = defineProps<{
		selected: boolean;
	}>();
</script>

<template>
	<div
		@click="$emit('click')"
		class="select-none transition-all bg-neutral-950/25 backdrop-blur-md p-4 border-2 border-gray-100/25 rounded-lg hover:bg-neutral-700/25"
		:class="[
			props.selected
				? 'scale-105 animate-pulse'
				: 'scale-100'
		]"
	>
		<div class="flex flex-row justify-center text-center items-center gap-4">
			<h2 class="w-full text-xl font-bold text-gray-100 tracking-wide">
				+ Neuer Charakter
			</h2>
		</div>
	</div>
</template>