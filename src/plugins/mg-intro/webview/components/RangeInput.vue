<script lang="ts" setup>
import { ref, computed, watch } from 'vue';

const props = defineProps<{
    volume: number;
    min: number;
    max: number;
}>()

const emits = defineEmits<{
    (e: 'update', value: number): void
}>()

const sliderValue = ref(props.volume)

// Wenn Volume von außen geändert wird, aktualisiere sliderValue
watch(() => props.volume, (val) => { sliderValue.value = val });

// Prozentwert für Thumb-Position und Füllung
const percent = computed(() => Math.max(0, ((sliderValue.value - props.min) / (props.max - props.min)) * 100));

const handleInput = (e: Event) => {
    const target = e.target as HTMLInputElement
    sliderValue.value = Number(target.value)
    emits('update', sliderValue.value)
}
</script>

<template>
    <div class="relative w-full h-6 flex items-center">
        <!-- Track -->
        <div class="absolute w-full h-1.5 bg-gray-600/40 rounded-full overflow-hidden">
            <div
                class="h-full bg-gradient-to-r from-[#007a2e] via-[#00c26b] to-[#008736] transition-all duration-100 ease-out"
                :style="{ width: percent + '%' }"
            ></div>
        </div>

        <!-- Thumb -->
        <div
            class="absolute w-5 h-5 rounded-full border-2 border-white bg-[#00c26b] shadow-[0_0_10px_#00c26b80] transition-all duration-100 ease-out"
            :style="{ left: `calc(${percent}% - 0.625rem)` }"
        ></div>

        <!-- Unsichtbares Input -->
        <input
            type="range"
            class="absolute w-full h-6 opacity-0 cursor-pointer z-10"
            :min="props.min"
            :max="props.max"
            :value="sliderValue"
            @input="handleInput"
        />
    </div>
</template>
