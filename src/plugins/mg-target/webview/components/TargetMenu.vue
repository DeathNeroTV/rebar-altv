<template>
    <div class="flex flex-col gap-2 p-1.5 min-w-[250px] max-w-[350px] rounded-lg text-gray-100 backdrop-blur-sm bg-neutral-950/25 border border-neutral-800/25 shadow-lg">
        <div v-for="opt in options" :key="opt.label" @click="$emit('select', opt)" class="flex flex-1 gap-2 transition-all duration-200 px-4 py-2 rounded-xl cursor-pointer bg-neutral-950/25 hover:bg-[#007836]/25 text-center items-center justify-between">
            <font-awesome-icon :icon="['fas', opt.icon]" class="min-w-5"/>
            <span class="w-full">{{ opt.label }}</span>
        </div>
    </div>
</template>

<script setup lang="ts">
import { TargetOption } from '../../shared/interfaces.js';

defineProps<{ options: TargetOption[] }>();

</script>
