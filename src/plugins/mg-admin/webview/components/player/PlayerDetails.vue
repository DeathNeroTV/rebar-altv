<script lang="ts" setup>
import { ref, watch } from 'vue';

import PlayerActions from './PlayerActions.vue';
import { PlayerStats } from '@Plugins/mg-admin/shared/interfaces';

const props = defineProps<{ 
    player: PlayerStats | null; 
    visible: boolean; 
}>();

const emits = defineEmits<{
    (e: 'close'): void;
}>();

const show = ref<boolean>(props.visible);

watch(() => props.visible, val => (show.value = val));

/* 💡 Formulardaten für Aktionen */
const reason = ref('');
const amount = ref<number | null>(null);
</script>

<template>
    <div v-if="show" class="fixed inset-0 bg-neutral-950/95 flex items-center justify-center z-50 select-none">
        <div class="bg-neutral-900 rounded-2xl shadow-2xl w-[500px] h-fit border-2 border-[#008736]/40 p-6 text-gray-200">
            <!-- 🧍 Spieler Header -->
            <div class="flex items-center justify-between mb-2">
                <h2 class="text-3xl font-semibold text-[#008736]">{{ props.player?.name || 'Unbekannter Spieler' }}</h2>
                <font-awesome-icon :icon="['fas', 'xmark']" @click="emits('close')" class="text-gray-500 hover:text-red-500 transition text-2xl cursor-pointer" />
            </div>

            <div class="text-sm text-gray-400 mb-6">
                ID: <span class="text-gray-300">{{ props.player?.id }}</span> •
                PING: <span class="text-gray-300">{{ props.player?.id }}</span>
            </div>

            <!-- 🌍 Health -->
            <div class="mb-6 bg-neutral-800 rounded-xl p-4 text-gray-300 text-sm">
                <p><span class="text-gray-400">Health:</span></p>
                <p>{{ props.player?.health }}</p>
            </div>

            <!-- 🌍 Armour -->
            <div class="mb-6 bg-neutral-800 rounded-xl p-4 text-gray-300 text-sm">
                <p><span class="text-gray-400">Armour:</span></p>
                <p>{{ props.player?.armour }}</p>
            </div>

            <!-- 🌍 Position -->
            <div class="mb-6 bg-neutral-800 rounded-xl p-4 text-gray-300 text-sm">
                <p><span class="text-gray-400">Position:</span></p>
                <p>X: {{ props.player?.pos?.x?.toFixed(4) }} | Y: {{ props.player?.pos?.y?.toFixed(4) }} | Z: {{ props.player?.pos?.z?.toFixed(4) }}</p>
            </div>

            <PlayerActions :player="player" @close="emits('close')"/>
        </div>
    </div>
</template>

<style scoped>
::-webkit-scrollbar {
    width: 0;
}
::-webkit-scrollbar-thumb {
    background-color: #008736;
    border-radius: 4px;
}
</style>
