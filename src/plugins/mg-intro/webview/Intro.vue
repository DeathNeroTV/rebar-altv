<script lang="ts" setup>
import { onMounted, ref, computed } from 'vue';
import { useEvents } from '@Composables/useEvents';
import { IntroEvents } from '../shared/events';
import { useTranslate } from '@Shared/translate';
import '@Plugins/mg-intro/translate/index';

import RangeInput from './components/RangeInput.vue';

const events = useEvents();
const { t } = useTranslate('de');

const audio = ref<HTMLAudioElement | null>(null);
const visible = ref<boolean>(false);
const isReady = ref<boolean>(false);
const progress = ref<number>(0);
const addons = ref<string[]>([]);
const targetProgress = ref<number>(0);
const currentPluginIndex = ref<number>(0);
const volume = ref<number>(35);

const team = ref<{ name: string; role: string | string[] }[]>([
    { name: 'DeathNeroTV', role: [t('intro.team.manager'), t('intro.team.dev')] },
    { name: 'Gremmler86', role: t('intro.team.admin') },
    { name: 'Sindy1302', role: t('intro.team.tester') },
]);

let smoothInterval: NodeJS.Timeout | null = null;
let randomInterval: NodeJS.Timeout | null = null;

const handleStart = async () => {
    if (!visible.value) visible.value = true;
    progress.value = 0;
    targetProgress.value = 0;

    const result = await events.emitServerRpc(IntroEvents.toServer.request);

    addons.value = result ?? ['', '', '', ''];
    isReady.value = true;

    if (!audio.value)
        audio.value = new Audio('/sounds/intro.ogg');

    audio.value.pause();
    audio.value.currentTime = 0;
    audio.value.volume = volume.value / 100;
    audio.value.play();

    if (!addons.value.length) {
        progress.value = 100;
        setTimeout(() => {
            visible.value = false;
            events.emitServer(IntroEvents.toServer.finished);
        }, 1500);
        return;
    }

    const perPlugin = 100 / addons.value.length;

    randomInterval = setInterval(() => {
        const increase = Math.random() * (perPlugin / 2) + (perPlugin / 4);
        targetProgress.value = Math.min(targetProgress.value + increase, 100);
    }, 500);

    smoothInterval = setInterval(() => {
        progress.value += (targetProgress.value - progress.value) * 0.08;

        // Plugin-Index prüfen
        const expectedPlugin = Math.floor(progress.value / perPlugin);
        if (expectedPlugin > currentPluginIndex.value) {
            currentPluginIndex.value = expectedPlugin;
        }

        if (progress.value >= 99.5) {
            progress.value = 100;
            clearInterval(smoothInterval!);
            clearInterval(randomInterval!);
            setTimeout(() => events.emitServer(IntroEvents.toServer.finished), 500);
        }
    }, 16);
};

const handleVolume = (value: number) => {
    volume.value = value;
    if (audio.value) audio.value.volume = value / 100;
};

onMounted(async() => handleStart());
</script>

<template>
    <transition name="fade">
        <div
            v-if="visible"
            class="relative w-screen h-screen flex flex-col items-center justify-center overflow-hidden bg-cover bg-center text-white"
            style="background-image: url('https://images.unsplash.com/photo-1604601203991-00f10d52f26b?auto=format&fit=crop&w=1920&q=80');"
        >
            <div class="absolute inset-0 bg-neutral-950/90 backdrop-blur-md"></div>

            <div class="relative z-10 flex flex-col items-center select-none">
                <h1 class="text-6xl font-extrabold tracking-widest text-[#008736] uppercase drop-shadow-lg mb-3">
                    {{ t('intro.title') }}
                </h1>
                <p class="text-gray-300 mb-8 text-lg">
                    <!-- Zeige aktuellen Plugin-Text -->
                    <template v-if="addons.length && currentPluginIndex < addons.length">
                        {{ addons[currentPluginIndex] }} wird geladen...
                    </template>
                    <template v-else>
                        {{ t('intro.progress') }}
                    </template>
                </p>

                <!-- Fortschrittsbalken -->
                <div class="w-2/3 h-2 bg-gray-700/40 rounded-xl overflow-hidden mb-10">
                    <div
                        class="h-full bg-gradient-to-r from-[#007a2e] via-[#00c26b] to-[#008736]
                               transition-[width] duration-700 ease-out shadow-[0_0_15px_#00c26b50]
                               animate-[pulse_3s_infinite]"
                        :style="{ width: progress.toFixed(2) + '%' }"
                    ></div>
                </div>

                <!-- Teamkarten -->
                <div class="select-none flex flex-wrap justify-center gap-6 mt-6">
                    <div
                        v-for="member in team"
                        :key="member.name"
                        class="bg-white/10 border border-gray-100/20 backdrop-blur-md px-6 py-4 rounded-2xl shadow-lg text-center min-w-[180px]"
                    >
                        <p class="text-xl font-semibold text-gray-100">{{ member.name }}</p>
                        <p v-if="Array.isArray(member.role)" class="text-sm text-[#008736] uppercase tracking-wider mt-1">
                            <span v-for="(r, i) in member.role" :key="i" class="block">{{ r }}</span>
                        </p>
                        <p v-else class="text-sm text-[#008736] uppercase tracking-wider mt-1">
                            <span class="block">{{ member.role }}</span>
                        </p>
                    </div>
                </div>
            </div>

            <!-- Lautstärkeregler unten mittig -->
            <div class="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex items-center gap-3 bg-white/10 border border-gray-100/20 backdrop-blur-md rounded-full px-6 py-3 shadow-lg">
                <span class="text-sm text-gray-300 select-none">🔊</span>
                <div class="w-44">
                    <RangeInput :volume="volume" :min="0" :max="100" @update="handleVolume" />
                </div>
                <span class="text-sm text-gray-300 select-none w-10 text-right">{{ volume }}%</span>
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
</style>
