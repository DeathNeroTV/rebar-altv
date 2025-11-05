<script lang="ts" setup>
    defineProps<{
        icon: string;
        label: string;
        id: string;
        active: boolean;
    }>();
</script>

<template>
    <div class="relative group w-full items-center text-center">
        <button
            @click="$emit('click')"
            class="p-3 text-center hover:bg-neutral-800/95 transition text-gray-100 rounded-full items-center justify-center"
            :class="active ? 'ring-2 ring-[#008736] bg-neutral-900/95 font-semibold' : 'bg-transparent'"
        >
            <font-awesome-icon :icon="['fas', icon]" class="text-2xl" />
        </button>
        <div class="absolute left-20 top-1/2 -translate-y-1/2 bg-neutral-800/95 ring-2 ring-neutral-700 text-gray-100 px-2 py-1 min-w-48 rounded-full text-lg opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity shadow-lg whitespace-nowrap z-50">
            {{ label }}
        </div>
    </div>
</template>