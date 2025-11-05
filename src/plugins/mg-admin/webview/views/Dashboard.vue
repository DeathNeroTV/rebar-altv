<script lang="ts" setup>
import { onMounted, reactive, ref } from 'vue';

import { DashboardStat } from '@Plugins/mg-admin/shared/interfaces';
import { AdminConfig } from '@Plugins/mg-admin/shared/config';
import { AdminEvents } from '@Plugins/mg-admin/shared/events';

import { useEvents } from '@Composables/useEvents';
import { useTranslate } from '@Shared/translate';
import '../../translate/index';

import Statistics from '../components/Statistics.vue';

const { language } = defineProps({ language: String });

const emits = defineEmits<{
    (e: 'navigate', page: string): void;
}>();

const { t } = useTranslate(language);
const events = useEvents();

const list = reactive<DashboardStat[]>([]);

const navigate = (page: string) => emits('navigate', page);

const init = async () => {
    const result: DashboardStat[] = await events.emitServerRpc(AdminEvents.toServer.request.stats);
    if (!result) {
        AdminConfig.infos.forEach(info => list.push(info));
        return;
    }

    result.forEach(info => list.push(info));
};

onMounted(async() => await init());
</script>

<template>
    <div class="w-full h-full p-6 flex flex-col gap-5 justify-between text-gray-100">
        <div>
            <h1 class="text-3xl font-semibold">{{ t('admin.panel.statistics.title') }}</h1>
            <p class="text-gray-400">{{ t('admin.panel.statistics.subtitle') }}</p>
        </div>

        <!-- 🧭 Übersichtskarten -->
        <div class="min-h-2/3 max-h-2/3 grid xl:grid-cols-4 md:grid-cols-2 sm:grid-cols-1 gap-5 overflow-y-scroll">
            <div
                v-for="stat in list"
                :key="stat.id"
                @click="navigate(stat.id)"
                class="cursor-pointer group relative bg-gradient-to-br from-emerald-600/40 to-emerald-800/30 rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all hover:-translate-y-1 border border-neutral-800 hover:border-emerald-600/70 backdrop-blur-sm"
            >
                <div class="flex flex-col gap-4">
                    <div class="flex justify-between items-center">
                        <font-awesome-icon :icon="['fas', stat.icon]" class="text-2xl opacity-80 text-emerald-400" />
                        <span class="text-4xl font-bold text-gray-100 tracking-tight">{{ stat.value }}</span>
                    </div>
                    <div class="text-lg font-medium text-gray-200">{{ stat.title }}</div>
                </div>

                <!-- Hover Overlay -->
                <div class="absolute inset-0 bg-neutral-950/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 rounded-2xl flex items-center justify-center transition">
                    <span class="text-emerald-400 text-lg font-semibold">
                        {{ t('admin.panel.goto.section') }}
                    </span>
                </div>
            </div>
        </div>

        <!-- 🧠 Live Monitoring -->
        <Statistics :language="language" />
    </div>
</template>

<style scoped>
::-webkit-scrollbar { display: none; }
</style>
