<script lang="ts" setup>
import { ref, computed } from 'vue';
import { useEvents } from '@Composables/useEvents';

import Sidebar from './components/Sidebar.vue';
import Dashboard from './components/Dashboard.vue';
import WhitelistManager from './views/WhitelistManager.vue';
import PlayerManager from './views/PlayerManager.vue';
import VehicleManager from './views/VehicleManager.vue';
import JobManager from './views/JobManager.vue';
import Settings from './views/Settings.vue';
import GarageManager from './views/GarageManager.vue';
import { AdminEvents } from '../shared/events';

const events = useEvents();

const activePage = ref<string>('dashboard');
const pages = {
    dashboard: Dashboard,
    whitelist: WhitelistManager,
    players: PlayerManager,
    vehicles: VehicleManager,
    jobs: JobManager,
    garages: GarageManager,
    settings: Settings
};

const activeComponent = computed(() => pages[activePage.value]);
const setActivePage = (page: string) => activePage.value = page;
const logout = () => events.emitServer(AdminEvents.toServer.logout);
</script>

<template>
    <div class="w-full h-full flex flex-row bg-neutral-900 text-gray-100">
        <Sidebar :active="activePage" @navigate="setActivePage" @logout="logout" />

        <!-- Main Content -->
        <div class="w-full h-full flex flex-col bg-transparent border-l-2 border-neutral-900">
            <!-- Content -->
            <main class="flex-1 overflow-y-auto p-6">
                <component :is="activeComponent" @navigate="setActivePage" />
            </main>
        </div>

    </div>
</template>

<style scoped>
</style>