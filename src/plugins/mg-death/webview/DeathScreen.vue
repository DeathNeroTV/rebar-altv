<script setup lang="ts">
import { ref, computed } from 'vue';
import { useEvents } from '@Composables/useEvents.js';
import { DeathEvents } from '../shared/events.js';
import { useTranslate } from '@Shared/translate.js';
import '../translate/index';

const { t } = useTranslate('de');
const events = useEvents();

// Core States
const isDead = ref(false);
const isBeingRevived = ref(false);
const canRespawn = ref(false);
const calledEMS = ref(false);

// Für Revive HUD (Reviver)
const isReviving = ref(false);
const reviveProgress = ref(0);

// Timer
const timeLeft = ref<number>(0);
const totalTime = ref<number>(0);
let interval: NodeJS.Timeout | null = null;

// Formatierte Anzeige
const formattedTime = computed(() => {
    const seconds = Math.max(0, Math.floor(timeLeft.value / 1000));
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
});

const progress = computed(() => {
    if (totalTime.value === 0) return 0;
    if (isReviving.value) return reviveProgress.value.toFixed(2);
    return ((timeLeft.value / totalTime.value) * 100).toFixed(2);
});

const resetData = () => {
    isDead.value = false;
    canRespawn.value = false;
    calledEMS.value = false;
    isBeingRevived.value = false;
    isReviving.value = false;
    reviveProgress.value = 0;
};

events.on(DeathEvents.toClient.startTimer, () => {
    isDead.value = true;
    canRespawn.value = false;
});

events.on(DeathEvents.toClient.updateTimer, (ms: number) => {
    totalTime.value = ms;
    timeLeft.value = ms;
    if (interval) clearInterval(interval);
    interval = setInterval(() => {
        timeLeft.value -= 1000;
        if (timeLeft.value <= 0) {
            clearInterval(interval!);
            interval = null;
            canRespawn.value = true;
        }
    }, 1000);
});

events.on(DeathEvents.toClient.startRevive, () => {
    isBeingRevived.value = true;
});

events.on(DeathEvents.toClient.stopRevive, () => {
    isBeingRevived.value = false;
    isReviving.value = false;
    reviveProgress.value = 0;
});

events.on(DeathEvents.toClient.reviveProgress, (progress: number) => {
    if (!isReviving.value) isReviving.value = true;
    reviveProgress.value = progress;
});

events.on(DeathEvents.toClient.confirmEms, () => {
    calledEMS.value = true;
});

events.on(DeathEvents.toClient.reviveComplete, () => {
    isReviving.value = false;
    reviveProgress.value = 0;
});

events.on(DeathEvents.toClient.respawned, resetData);
</script>

<template>
    <transition name="fade">
        <div v-if="isDead || isReviving" class="fixed inset-0 bg-neutral-950/70 flex items-center justify-center text-gray-100 z-50">
            
            <!-- === Death HUD (Victim) === -->
            <div
                v-if="isDead && !isReviving"
                class="relative w-[380px] bg-neutral-950/60 border border-[#008736]/60 rounded-2xl shadow-[0_0_25px_#00873640] p-6 text-center backdrop-blur-sm"
            >
                <div class="select-none w-24 h-1 bg-[#008736] animate-pulseGlow mx-auto mb-4 rounded-full"></div>

                <h1 class="select-none text-3xl font-bold uppercase tracking-wider text-[#008736] mb-2">
                    {{ t('death.downed') }}
                </h1>

                <p class="text-gray-300 text-xs uppercase tracking-widest mb-4">
                    {{ t('death.critical') }}
                </p>

                <div
                    v-if="!isBeingRevived"
                    class="select-none text-5xl font-mono text-[#008736] font-semibold mb-4 drop-shadow-[0_0_8px_#008736aa]"
                >
                    {{ formattedTime }}
                </div>

                <!-- Timer Fortschritt -->
                <div v-if="!isBeingRevived" class="w-full bg-neutral-800/50 rounded-full h-1.5 overflow-hidden mb-6">
                    <div class="bg-[#008736] h-1.5 transition-all duration-1000 ease-linear" :style="{ width: `${progress}%` }"></div>
                </div>

                <!-- Notruf -->
                <div v-if="!calledEMS && !canRespawn && !isBeingRevived" class="select-none text-gray-300 text-xs uppercase py-1 tracking-widest">
                    {{ t('death.callEMS') }}
                </div>
                <div v-else-if="calledEMS && !canRespawn && !isBeingRevived" class="select-none text-[#008736] text-xs font-semibold py-1 uppercase animate-pulseGlow">
                    {{ t('death.emsCalled') }}
                </div>

                <!-- Respawn -->
                <div v-if="canRespawn && !isBeingRevived" class="text-[#008736] select-none text-xs font-semibold uppercase tracking-wider animate-pulseGlow mt-2">
                    {{ t('death.pressEToRespawn') }}
                </div>

                <!-- Wird wiederbelebt -->
                <div v-if="isBeingRevived" class="mt-6">
                    <p class="select-none text-[#008736] text-xs font-semibold uppercase tracking-wider animate-pulseGlow mb-2">
                        {{ t('death.beingRevived') }}
                    </p>
                    <div class="w-full bg-neutral-800/50 rounded-full h-2 overflow-hidden">
                        <div class="bg-[#008736] h-2 transition-all duration-500 ease-linear animate-pulseGlow" style="width: 100%;"></div>
                    </div>
                </div>
            </div>

            <!-- === Reviver HUD === -->
            <div
                v-else-if="isReviving"
                class="relative w-[380px] bg-neutral-950/60 border border-[#008736]/60 rounded-2xl shadow-[0_0_25px_#00873640] p-6 text-center backdrop-blur-sm"
            >
                <div class="select-none w-24 h-1 bg-[#008736] animate-pulseGlow mx-auto mb-4 rounded-full"></div>

                <h1 class="select-none text-2xl font-bold uppercase tracking-wider text-[#008736] mb-3">
                    Wiederbelebung läuft
                </h1>

                <div class="select-none text-gray-300 text-sm uppercase tracking-widest mb-4">
                    Eine Person belebt dich wieder
                </div>

                <!-- Fortschrittsbalken -->
                <div class="w-full bg-neutral-800/50 rounded-full h-2 overflow-hidden mb-4">
                    <div class="bg-[#008736] h-2 transition-all duration-300 ease-linear" :style="{ width: `${reviveProgress}%` }"></div>
                </div>

                <div class="text-xs text-gray-400 uppercase">
                    {{ reviveProgress.toFixed(0) }}%
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
