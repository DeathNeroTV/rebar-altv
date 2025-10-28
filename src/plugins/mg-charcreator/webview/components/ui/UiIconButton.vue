<script lang="ts" setup>
import { computed } from 'vue';

const props = defineProps<{ selected?: boolean; size: String }>();

const getClasses = computed(() => {
    if (!props.selected) {
        return [
            //
            'bg-gray-100/20',
            'hover:bg-green-500',
            'hover:bg-gradient-to-r',
            'hover:from-green-700',
            props.size,
        ];
    }

    return [
        //
        'bg-green-500',
        'bg-gradient-to-r',
        'from-green-700',
        props.size,
    ];
});
</script>

<template>
    <div>
        <button
            class="flex items-center justify-center rounded-lg text-center font-medium text-white shadow-md active:scale-95"
            :class="getClasses"
        >
            <slot></slot>
        </button>
    </div>
</template>
