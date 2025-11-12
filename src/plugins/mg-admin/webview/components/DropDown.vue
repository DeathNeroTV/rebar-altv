<script lang="ts" setup>
import { DropDownOption } from '@Plugins/mg-admin/shared/interfaces';
import { ref, defineProps, defineEmits, watch } from 'vue';

const props = defineProps<{
    options: DropDownOption[];
    placeholder?: string;
    modelValue?: string | number | null;
}>();

const emits = defineEmits<{
    (e: 'update:modelValue', value: string | number): void;
    (e: 'selected', value: string | number): void;
}>();

const showDropdown = ref(false);
const selected = ref<string | number | null>(props.modelValue ?? null);

watch(() => props.modelValue, (val) => selected.value = val);

function selectOption(option: DropDownOption) {
    selected.value = option.value;
    showDropdown.value = false;
    emits('update:modelValue', option.value);
    emits('selected', option.value);
}

function toggleDropdown() {
    showDropdown.value = !showDropdown.value;
}
</script>

<template>
    <div class="relative w-full">
        <!-- Trigger -->
        <div 
            @click="toggleDropdown"
            class="cursor-pointer p-2 rounded-lg bg-neutral-800 text-white hover:bg-[#008736] flex justify-between items-center"
        >
            <span>{{ selected ? options.find(o => o.value === selected)?.label : (props.placeholder || 'Auswählen') }}</span>
            <svg class="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
            </svg>
        </div>

        <!-- Dropdown -->
        <ul v-if="showDropdown" class="absolute mt-1 w-full min-h-[20vh] max-h-[20vh] bg-neutral-800 rounded-lg overflow-x-hidden overflow-y-auto z-10 shadow-lg">
            <li v-for="option in options" :key="option.value"
                @click="selectOption(option)"
                class="p-2 cursor-pointer hover:bg-[#008736] text-white"
            >
                {{ option.label }}
            </li>
        </ul>
    </div>
</template>

<style scoped>
::-webkit-scrollbar {
    display: none;
}
</style>