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

</script>

<template>
    <div v-if="show" class="fixed inset-0 bg-neutral-950/95 flex items-center justify-center z-50 select-none">
        <div class="bg-neutral-900 rounded-2xl shadow-2xl w-[50vw] max-h-[90vh] border-2 border-[#008736]/40 p-6 text-gray-200 flex flex-col transition-all duration-500">
            <!-- 🧍 Header: Name / ID / Ping -->
            <div class="flex items-center justify-between mb-2">
                <div class="flex flex-col gap-1 text-lg">
                    <h2 class="text-3xl font-semibold text-[#008736]">
                        {{ props.player?.name || 'Unbekannter Spieler' }}
                    </h2>
                    <div class="flex flex-row gap-5 ml-4">
                        <p class="text-neutral-500">
                            ID: <span class="text-gray-100">{{ props.player?.id }}</span>
                        </p>
                        <p class="text-neutral-500">
                            PING: <span class="text-gray-100">{{ props.player?.ping ?? '—' }}</span>
                        </p>
                    </div>
                </div>

                <font-awesome-icon
                    :icon="['fas', 'xmark']"
                    @click="emits('close')"
                    class="text-neutral-600 hover:text-red-500 transition text-2xl cursor-pointer"
                />
            </div>

            <!-- 🔹 Zwei Spalten: Spielerinfos links, Aktionen rechts -->
            <div class="flex gap-2">
                <!-- 🔸 Linke Seite: Statusinformationen -->
                <div class="flex-1 space-y-2">
                    <!-- Health -->
                    <div class="bg-neutral-800 rounded-xl p-4 text-gray-100 text-md">
                        <p class="text-gray-400">Health</p>
                        <div class="w-full h-[1px] bg-[#008736] mb-2"></div>
                        <p class="text-lg font-medium text-gray-200">{{ props.player?.health ?? '—' }}</p>
                    </div>

                    <!-- Armour -->
                    <div class="bg-neutral-800 rounded-xl p-4 text-gray-100 text-md">
                        <p class="text-gray-400">Armour</p>
                        <div class="w-full h-[1px] bg-[#008736] mb-2"></div>
                        <p class="text-lg font-medium text-gray-200">{{ props.player?.armour ?? '—' }}</p>
                    </div>

                    <!-- Position -->
                    <div class="bg-neutral-800 rounded-xl p-4 text-gray-100 text-md">
                        <p class="text-gray-400">Position</p>
                        <div class="w-full h-[1px] bg-[#008736] mb-2"></div>
                        <p class="text-lg font-medium text-gray-200">
                            X: {{ props.player?.pos?.x?.toFixed(3) ?? '—' }} |
                            Y: {{ props.player?.pos?.y?.toFixed(3) ?? '—' }} |
                            Z: {{ props.player?.pos?.z?.toFixed(3) ?? '—' }}
                        </p>
                    </div>
                </div>

                <!-- 🔸 Rechte Seite: Aktionen -->
                <div class="w-[40%] bg-neutral-900 ring-1 ring-[#008736]/60 rounded-xl">
                    <PlayerActions :player="player" @close="emits('close')" />
                </div>
            </div>
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
