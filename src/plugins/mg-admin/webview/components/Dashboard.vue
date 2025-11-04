<script lang="ts" setup>
    import { onMounted, ref } from 'vue';
    import { AdminEvents } from '@Plugins/mg-admin/shared/events';
    import { DashboardStat } from '@Plugins/mg-admin/shared/interfaces';

    import { useEvents } from '@Composables/useEvents';
    import { useTranslate } from '@Shared/translate';
    import '../../translate/index';

    const { t } = useTranslate('de');
    const events = useEvents();

    const stats = ref<DashboardStat[]>([
        {
            id: 'whitelist',
            title: t('admin.panel.dashboard.whitelist.title'),
            value: 0,
            icon: 'id-card',
            color: 'from-purple-600 to-purple-800',
        },
        {
            id: 'players',
            title: t('admin.panel.dashboard.players.title'),
            value: 0,
            icon: 'users',
            color: 'from-green-600 to-green-800',
        },
        {
            id: 'vehicles',
            title: t('admin.panel.dashboard.vehicles.title'),
            value: 0,
            icon: 'car',
            color: 'from-blue-600 to-blue-800',
        },
        {
            id: 'jobs',
            title: t('admin.panel.dashboard.jobs.title'),
            value: 0,
            icon: 'briefcase',
            color: 'from-yellow-600 to-yellow-800',
        },
    ]);

    const emits = defineEmits<{
      (e: 'navigate', page: string): void;
    }>();

    const openSection = (section: string) => emits('navigate', section);

    onMounted(async () => {
        const result: { [key: string]: number; } = await events.emitServerRpc(AdminEvents.toServer.request.stats);
        if (!result) return;
        for (const key in result) {
            const index = stats.value.findIndex(stat => stat.id === key);
            if (index === -1) continue;
            stats.value[index].value = result[key];
        }
    });
</script>

<template>
    <div class="w-full h-full p-6 flex flex-col gap-6 text-gray-100">
        <h1 class="text-3xl font-semibold mb-2">{{ t('admin.panel.statistics') }}</h1>
        <p class="text-gray-400 mb-6">Serverübersicht und Statistiken</p>

        <!-- Statistik-Karten -->
        <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
            <div
                v-for="stat in stats"
                :key="stat.id"
                @click="openSection(stat.id)"
                class="cursor-pointer group relative bg-gradient-to-br rounded-2xl p-5 shadow-lg hover:shadow-2xl transition-all hover:-translate-y-1 border border-neutral-800 hover:border-neutral-700"
                :class="stat.color"
            >
                <div class="flex justify-between items-center mb-3">
                    <font-awesome-icon :icon="['fas', stat.icon]" class="text-2xl opacity-80" />
                    <div class="text-lg font-medium text-gray-100">{{ stat.title }}</div>
                    <div class="text-4xl font-bold text-gray-100 tracking-tight">{{ stat.value }}</div>
                </div>

                <!-- Hover Overlay -->
                <div
                    class="absolute inset-0 bg-neutral-950/70 opacity-0 group-hover:opacity-100 rounded-2xl flex items-center justify-center transition"
                >
                    <span class="text-gray-100 text-lg font-semibold">{{ t('admin.panel.goto.section') }}</span>
                </div>
            </div>
        </div>
    </div>
</template>