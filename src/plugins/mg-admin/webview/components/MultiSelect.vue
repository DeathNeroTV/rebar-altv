<script lang="ts" setup>
	import { DropDownOption } from '@Plugins/mg-admin/shared/interfaces';
	import { ref, watch } from 'vue';

	const props = defineProps<{
		options: DropDownOption[];
		placeholder?: string;
		modelValue?: Array<string | number>;
	}>();

	const emits = defineEmits<{
		(e: 'update:modelValue', value: Array<string | number>): void;
		(e: 'selected', value: Array<string | number>): void;
	}>();

	const showDropdown = ref(false);

	// interner Zustand
	const selectedValues = ref<Array<string | number>>(props.modelValue ?? []);

	watch(
		() => props.modelValue,
		(val) => (selectedValues.value = val ?? [])
	);

	function toggleValue(value: string | number) {
		const exists = selectedValues.value.includes(value);

		if (exists) selectedValues.value = selectedValues.value.filter((v) => v !== value);
		else selectedValues.value.push(value);

		emits('update:modelValue', [...selectedValues.value]);
		emits('selected', [...selectedValues.value]);
	}

	function removeValue(value: string | number) {
		selectedValues.value = selectedValues.value.filter((v) => v !== value);

		emits('update:modelValue', [...selectedValues.value]);
		emits('selected', [...selectedValues.value]);
	}

	function toggleDropdown() {
		showDropdown.value = !showDropdown.value;
	}
</script>

<template>
	<div class="relative w-full">
		<!-- Trigger -->
		<div @click="toggleDropdown" class="cursor-pointer p-2 rounded-lg bg-neutral-800 text-white hover:bg-[#008736] flex justify-between items-center">
			<div class="flex gap-2 flex-wrap">
				<!-- Breadcrumb Chips -->
				<span v-for="value in selectedValues" :key="value" class="bg-[#008736] px-2 py-1 rounded-full flex items-center gap-1" @click.stop>
					{{ options.find((o) => o.value === value)?.label }}
					<span class="cursor-pointer ml-1" @click="removeValue(value)">✕</span>
				</span>

				<!-- Placeholder -->
				<span v-if="selectedValues.length === 0">{{ props.placeholder || 'Auswählen' }}</span>
			</div>

			<svg class="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
			</svg>
		</div>

		<!-- Dropdown -->
		<ul v-if="showDropdown" class="absolute mt-1 w-full min-h-[20vh] max-h-[20vh] bg-neutral-800 rounded-lg overflow-x-hidden overflow-y-auto z-10 shadow-lg">
			<li
				v-for="option in options"
				:key="option.value"
				@click="toggleValue(option.value)"
				class="p-2 cursor-pointer flex items-center justify-between hover:bg-[#008736] text-white"
			>
				{{ option.label }}

				<!-- Checkmark wenn ausgewählt -->
				<span v-if="selectedValues.includes(option.value)">✔</span>
			</li>
		</ul>
	</div>
</template>

<style scoped>
	::-webkit-scrollbar {
		display: none;
	}
</style>
