<script lang="ts" setup>
import { ref } from 'vue';
import { useTranslate } from '@Shared/translate';
import '../../translate/index';

import SidebarItem from './SidebarItem.vue';

const { t } = useTranslate('de');

defineProps<{
  active: string;
}>();

const emits = defineEmits<{
    (e: 'navigate', page: string): void;
    (e: 'logout'): void;
}>();

const logoClickCount = ref<number>(0);
let clickTimeout: NodeJS.Timeout | null = null;

const logoClick = () => {
    navigate('dashboard');
    logoClickCount.value++;

    if (clickTimeout) clearTimeout(clickTimeout);
    clickTimeout = setTimeout(() => (logoClickCount.value = 0), 300);

    if (logoClickCount.value >= 5) {
        logoClickCount.value = 0;
        const audio = new Audio('../sounds/anti-spam.ogg');
        audio.currentTime = 0;
        audio.volume = 0.35;
        audio.play().catch(err => console.warn('Audio konnte nicht abgespielt werden:', err));
    }
};

const navigate = (page: string) => emits('navigate', page);

</script>

<template>
    <aside class="w-20 h-full bg-neutral-900 shadow-lg flex flex-col gap-1 justify-center select-none border-r-4 border-neutral-800">
        <img src="../../images/mg-admin-logo.png" class="w-20 h-20 cursor-pointer transition-transform hover:scale-105" alt="" @click="logoClick"/>
        <nav class="w-full h-full flex flex-col gap-3 p-2 items-center justify-start">
            <SidebarItem icon="id-card" label="Whitelist-Anfragen" id="whitelist" :active="active === 'whitelist'" @click="navigate('whitelist')" />
            <SidebarItem icon="users" label="Spieler" id="players" :active="active === 'players'" @click="navigate('players')" />
            <SidebarItem icon="car" label="Fahrzeuge" id="vehicles" :active="active === 'vehicles'" @click="navigate('vehicles')" />
            <SidebarItem icon="briefcase" label="Jobs" id="jobs" :active="active === 'jobs'" @click="navigate('jobs')" />
        </nav>

        <div class="p-3 min-h-fit max-h-fit flex flex-col gap-3 items-center justify-center text-center border-t-4 border-neutral-700">
            <SidebarItem icon="cog" label="Einstellungen" id="settings" :active="active === 'settings'"@click="navigate('settings')" />
            <div class="relative group w-full items-center text-center">                
                <button
                    @click="emits('logout')"
                    class="p-3 text-center ring-2 ring-neutral-700 hover:font-semibold hover:ring-red-500 hover:bg-neutral-800 transition text-gray-100 rounded-full items-center"
                >
                    <font-awesome-icon :icon="['fas', 'arrow-right-from-bracket']" class="text-2xl"/>
                </button>
                <div class="absolute left-20 top-1/2 -translate-y-1/2 bg-neutral-800 ring-2 ring-neutral-700 text-gray-100 px-4 py-2 min-w-48 rounded-full text-lg opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity shadow-lg whitespace-nowrap z-50">
                    {{ t('admin.panel.logout') }}
                </div>
            </div>
        </div>
    </aside>
</template>