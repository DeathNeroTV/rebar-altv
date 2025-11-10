<script lang="ts" setup>
import { ref, computed, onMounted } from "vue";

import { useEvents } from "@Composables/useEvents";
import { AdminEvents } from "@Plugins/mg-admin/shared/events";

import PlayerTable from "../components/player/PlayerTable.vue";
import PlayerDetails from "../components/player/PlayerDetails.vue";
import { PlayerStats } from "@Plugins/mg-admin/shared/interfaces";

const events = useEvents();

const players = ref<PlayerStats[]>([
    { id: 1, name: 'DeathNeroTV', health: 200, armour: 100, job: ['police', 'ambulance'] , ping: 0, pos: { x: 0, y: 0, z: 0 } }
]);
const selectedPlayer = ref<PlayerStats | null>(null);
const search = ref<string>('');

const filteredPlayers = computed(() => players.value.filter((p) => p.name.toLowerCase().includes(search.value.toLowerCase())));

function openPlayerDetails(player) {
    selectedPlayer.value = player;
}

async function refreshPlayers() {
    const response = await events.emitServerRpc(AdminEvents.toServer.request.player);
    if (response) players.value = response;
}

onMounted(refreshPlayers);
</script>

<template>
    <div class="p-4 text-gray-100">
        <h1 class="text-2xl font-semibold mb-4 select-none">Spielerverwaltung</h1>

        <div class="mb-4 flex justify-between items-center">
            <input
                v-model="search"
                type="text"
                placeholder="Spieler suchen..."
                class="bg-neutral-800 text-gray-100 rounded-lg px-4 py-2 w-1/3"
            />
            <font-awesome-icon
                :icon="['fas', 'rotate']"
                @click="refreshPlayers"
                class="bg-[#008736] hover:bg-green-700 px-4 py-2 rounded-lg"
            />
        </div>

        <PlayerTable :players="filteredPlayers" @selectPlayer="openPlayerDetails" />

        <PlayerDetails :visible="selectedPlayer !== null" :player="selectedPlayer" @close="selectedPlayer = null" />
    </div>
</template>

<style scoped>
</style>