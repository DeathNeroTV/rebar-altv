<script lang="ts" setup>
import { ref } from 'vue';
import { useTranslate } from '@Shared/translate';
import { DashboardStat } from '@Plugins/mg-admin/shared/interfaces';

import SidebarItem from './SidebarItem.vue';

const isInUse = ref<boolean>(false);
const { active, sections, language } = defineProps({ active: String, sections: Array<DashboardStat>, language: String });

const emits = defineEmits<{
    (e: 'navigate', page: string): void;
    (e: 'spamming'): void;
    (e: 'logout'): void;
}>();

const logoClickCount = ref<number>(0);
let clickTimeout: NodeJS.Timeout | null = null;

const { t } = useTranslate(language);

const logoClick = () => {
    if (isInUse.value) return;

    navigate('dashboard');
    logoClickCount.value++;

    if (clickTimeout) clearTimeout(clickTimeout);
    clickTimeout = setTimeout(() => (logoClickCount.value = 0), 300);

    if (logoClickCount.value >= 5) {
        isInUse.value = true;
        emits('spamming');
        setTimeout(() => isInUse.value = false, 9000);
    }
};

const navigate = (page: string) => emits('navigate', page);

</script>

<template>
    <aside class="w-20 min-h-full max-h-full bg-neutral-950/95 flex flex-col gap-2 justify-center items-center select-none border-r border-neutral-800">
        <img src="../../images/mg-admin-logo-1.png" class="w-full cursor-pointer transition-transform hover:scale-90" :disabled="isInUse" alt="" @click="logoClick"/>
        <nav class="w-full h-full flex flex-col gap-3 p-2 items-center overflow-y">
            <template v-for="data in sections">
                <SidebarItem :icon="data.icon" :label="data.title" :id="data.id" :active="active === data.id" @click="navigate(data.id)" />
            </template>
        </nav>

        <div class="pb-2 h-fit max-h-fit flex flex-col gap-3 items-center justify-center text-center">
            <SidebarItem icon="cog" :label="t('admin.panel.dashboard.settings.title')" id="settings" :active="active === 'settings'"@click="navigate('settings')" />
            <div class="relative group w-full min-h-fit max-h-fit items-center text-center">                
                <button
                    @click="emits('logout')"
                    class="p-3 text-center hover:font-semibold hover:bg-neutral-900/95 bg-transparent transition text-gray-100 rounded-full items-center hover:text-red-500"
                >
                    <font-awesome-icon :icon="['fas', 'power-off']" class="text-2xl"/>
                </button>
                <div class="absolute left-20 top-1/2 -translate-y-1/2 bg-neutral-800/95 ring-2 ring-neutral-700 text-gray-100 px-2 py-1 min-w-48 rounded-full text-lg opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity shadow-lg whitespace-nowrap z-50">
                    {{ t('admin.panel.logout') }}
                </div>
            </div>
        </div>
    </aside>
</template>

<style scoped>
/* 🌑 Allgemeine Scrollbar für dunkle Oberflächen */
aside nav::-webkit-scrollbar {display:none; }
</style>
