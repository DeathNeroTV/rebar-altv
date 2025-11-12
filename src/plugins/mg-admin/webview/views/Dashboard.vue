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
        if (AdminConfig.useWhitelist) AdminConfig.infos.forEach(info => list.push(info));
        else AdminConfig.infos.filter(data => data.id !== 'whitelist').forEach(info => list.push(info));
        return;
    }

    result.forEach(info => list.push(info));
};

onMounted(async() => await init());
</script>

<template>
    <div class="w-full h-full p-5 flex flex-col gap-5 justify-between text-gray-100">
        <div class="select-none">
            <h1 class="text-3xl font-semibold mb-2">{{ t('admin.panel.statistics.title') }}</h1>
            <h3 class="text-gray-400">{{ t('admin.panel.statistics.subtitle') }}</h3>
        </div>

        <!-- 🧭 Übersichtskarten (kompakte vertikale Liste) -->
        <div class="w-full max-w-full h-1/2 max-h-1/2 overflow-y-auto overflow-x-hidden">            
            <div class="grid grid-cols-6 gap-4">
                <div
                    v-for="stat in list"
                    :key="stat.id"
                    @click="navigate(stat.id)"
                    class="cursor-pointer group relative bg-gradient-to-br from-[#008736]/40 to-[#008736]/20 rounded-xl p-5 shadow-md hover:shadow-xl transition-all hover:-translate-y-0.5 ring-1 ring-neutral-800"
                >
                    <div class="flex justify-between items-center">
                        <div class="flex items-center gap-3">
                            <font-awesome-icon :icon="['fas', stat.icon]" class="text-xl text-gray-100 opacity-80" />
                            <span class="text-lg font-medium text-gray-200">{{ stat.title }}</span>
                        </div>
                        <span class="text-2xl font-bold text-gray-100">{{ stat.value }}</span>
                    </div>

                    <!-- Hover Overlay -->
                    <div class="absolute inset-0 bg-neutral-950/70 backdrop-blur-sm opacity-0 group-hover:opacity-100 rounded-xl flex items-center justify-center transition">
                        <span class="text-gray-100 text-lg font-semibold">
                            {{ t('admin.panel.goto.section') }}
                        </span>
                    </div>
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
