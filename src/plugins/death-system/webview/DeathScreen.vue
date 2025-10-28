<script setup lang="ts">
import { ref, computed } from 'vue';
import { useEvents } from '@Composables/useEvents.js';
import { DeathEvents } from '../shared/events.js';
import { useTranslate } from '@Shared/translate.js';

import '../translate/index';

const { t } = useTranslate('de');
const events = useEvents();

const isDead = ref(false);
const isBeingRevived = ref(false);
const timeLeft = ref<number>(0);
const totalTime = ref<number>(0);
const canRespawn = ref(false);
const calledEMS = ref(false);
let interval: NodeJS.Timeout | null = null;

const formattedTime = computed(() => {
    const seconds = Math.max(0, Math.floor(timeLeft.value / 1000));
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
});

const progress = computed(() => {
    if (totalTime.value === 0) return 0;
    return ((timeLeft.value / totalTime.value) * 100).toFixed(2);
});

events.on(DeathEvents.toClient.startTimer, () => { 
    isDead.value = true; 
});
events.on(DeathEvents.toClient.startRevive, () => {
    isBeingRevived.value = true;
});
events.on(DeathEvents.toClient.confirmEms, () => {
    calledEMS.value = true;
});
events.on(DeathEvents.toClient.updateTimer, (ms: number) => {
    totalTime.value = ms;
    timeLeft.value = ms;
    isDead.value = true;
    canRespawn.value = false;

    if (interval) clearInterval(interval);
    interval = setInterval(() => {
        timeLeft.value -= 1000;
        if (timeLeft.value <= 0) {
            clearInterval(interval!);
            interval = null;
            isDead.value = true;
            canRespawn.value = true;
        }
    }, 1000);
});
events.on(DeathEvents.toClient.stopRevive, () => {
    isBeingRevived.value = false;
    isDead.value = false;
    canRespawn.value = false;
    calledEMS.value = false;
});
events.on(DeathEvents.toClient.respawned, () => {
    isDead.value = false;
    canRespawn.value = false;
    calledEMS.value = false;
});
</script>

<template>
    <transition name="fade">
        <div
            v-if="isDead"
            class="fixed inset-0 bg-black/70 flex items-center justify-center text-white z-50"
        >
            <!-- Kompakter, mittiger Container -->
            <div
                class="relative w-[380px] bg-neutral-950/60 border border-[#008736]/60 rounded-2xl shadow-[0_0_25px_#00873640] p-6 text-center backdrop-blur-sm"
            >
                <!-- Pulsierende Akzentlinie -->
                <div class="select-none w-24 h-1 bg-[#008736] animate-pulseGlow mx-auto mb-4 rounded-full"></div>

                <!-- Titel -->
                <h1 class="select-none text-3xl font-bold uppercase tracking-wider text-[#008736] mb-2">
                    {{ t('death.downed') }}
                </h1>

                <!-- Untertitel -->
                <p class="text-gray-300 text-xs uppercase tracking-widest mb-4">
                    {{ t('death.critical') }}
                </p>

                <!-- Timer -->
                <div class="select-none text-5xl font-mono text-[#008736] font-semibold mb-4 drop-shadow-[0_0_8px_#008736aa]">
                    {{ formattedTime }}
                </div>

                <!-- Fortschrittsbalken -->
                <div class="w-full bg-neutral-800/50 rounded-full h-1.5 overflow-hidden mb-6">
                    <div
                        class="bg-[#008736] h-1.5 transition-all duration-1000 ease-linear"
                        :style="{ width: `${progress}%` }"
                    ></div>
                </div>

                <!-- Notruf / Respawn -->
                <div v-if="!calledEMS && !canRespawn && !isBeingRevived" class="select-none text-gray-300 text-xs uppercase tracking-widest">
                    {{ t('death.callEMS') }}
                </div>
                <div v-else-if="calledEMS && !canRespawn && !isBeingRevived" class="select-none text-[#008736] text-xs font-semibold uppercase animate-pulseGlow">
                    {{ t('death.emsCalled') }}
                </div>

                <!-- Respawn -->
                <div v-if="canRespawn && !isBeingRevived" class="text-[#008736] select-none text-xs font-semibold uppercase tracking-wider animate-pulseGlow mt-2">
                    {{ t('death.pressEToRespawn') }}
                </div>

                <!-- Revive Status -->
                <div v-if="isBeingRevived" class="select-none text-[#008736] text-xs font-semibold uppercase tracking-wider animate-pulseGlow mt-2">
                    {{ t('death.beingRevived') }}
                </div>
            </div>
        </div>
    </transition>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
    transition: opacity 0.8s;
}
.fade-enter-from,
.fade-leave-to {
    opacity: 0;
}

@keyframes pulseGlow {
    0%, 100% {
        box-shadow: 0 0 10px #008736aa;
        opacity: 1;
    }
    50% {
        box-shadow: 0 0 25px #008736ff;
        opacity: 0.8;
    }
}
.animate-pulseGlow {
    animation: pulseGlow 2s infinite;
}
</style>
