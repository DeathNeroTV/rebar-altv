<script lang="ts" setup>
import { ref } from 'vue';
import { useTranslate } from '@Shared/translate';

import SidebarItem from './SidebarItem.vue';

const isInUse = ref<boolean>(false);

const props = defineProps<{
  active: string;
  language: string;
}>();

const emits = defineEmits<{
    (e: 'navigate', page: string): void;
    (e: 'spamming'): void;
    (e: 'logout'): void;
}>();

const logoClickCount = ref<number>(0);
let clickTimeout: NodeJS.Timeout | null = null;

const { t } = useTranslate(props.language);

const logoClick = () => {
    if (isInUse.value) return;

    navigate('dashboard');
    logoClickCount.value++;

    if (clickTimeout) clearTimeout(clickTimeout);
    clickTimeout = setTimeout(() => (logoClickCount.value = 0), 200);

    if (logoClickCount.value >= 5) {
        isInUse.value = true;
        emits('spamming');
        setTimeout(() => isInUse.value = false, 9000);
    }
};

const navigate = (page: string) => emits('navigate', page);

</script>

<template>
    <aside class="w-20 h-full bg-neutral-900 flex flex-col gap-1 justify-center items-center select-none border-r border-neutral-800">
        <img src="../../images/mg-admin-logo.png" class="p-2 w-18 h-18 cursor-pointer transition-transform hover:scale-90" :disabled="isInUse" alt="" @click="logoClick"/>
        <nav class="w-full h-full flex flex-col gap-3 p-2 items-center justify-start">
            <SidebarItem icon="id-card" :label="t('admin.panel.dashboard.whitelist.title')" id="whitelist" :active="active === 'whitelist'" @click="navigate('whitelist')" />
            <SidebarItem icon="users" :label="t('admin.panel.dashboard.players.title')" id="players" :active="active === 'players'" @click="navigate('players')" />
            <SidebarItem icon="car" :label="t('admin.panel.dashboard.vehicles.title')" id="vehicles" :active="active === 'vehicles'" @click="navigate('vehicles')" />
            <SidebarItem icon="briefcase" :label="t('admin.panel.dashboard.jobs.title')" id="jobs" :active="active === 'jobs'" @click="navigate('jobs')" />
        </nav>

        <div class="p-3 min-h-fit max-h-fit flex flex-col gap-3 items-center justify-center text-center border-t border-neutral-700">
            <SidebarItem icon="cog" label="Einstellungen" id="settings" :active="active === 'settings'"@click="navigate('settings')" />
            <div class="relative group w-full items-center text-center">                
                <button
                    @click="emits('logout')"
                    class="p-3 text-center hover:font-semibold hover:ring-red-500 hover:bg-neutral-800 transition text-gray-100 rounded-full items-center"
                >
                    <font-awesome-icon :icon="['fas', 'power-off']" class="text-2xl hover:text-red-500"/>
                </button>
                <div class="absolute left-20 top-1/2 -translate-y-1/2 bg-neutral-700 ring-2 ring-neutral-600 text-gray-100 px-2 py-1 min-w-48 rounded-full text-lg opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity shadow-lg whitespace-nowrap z-50">
                    {{ t('admin.panel.logout') }}
                </div>
            </div>
        </div>
    </aside>
</template>