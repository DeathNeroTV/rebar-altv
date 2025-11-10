<script lang="ts" setup>
import { PlayerStats } from "@Plugins/mg-admin/shared/interfaces";
import PlayerActions from "./PlayerActions.vue";

defineProps<{ players: PlayerStats[] }>();
</script>

<template>
    <div class="min-w-full min-h-full max-w-full max-h-full overflow-x-hidden overflow-y-auto">
        <table class="min-w-full min-h-full max-w-full max-h-full border border-neutral-700 rounded-lg select-none">
            <thead class="bg-neutral-800 text-gray-300">
                <tr class="text-center">
                    <th class="px-3 py-2">ID</th>
                    <th class="px-3 py-2">Name</th>
                    <th class="px-3 py-2">Ping</th>
                    <th class="px-3 py-2">Health</th>
                    <th class="px-3 py-2">Armour</th>
                    <th class="px-3 py-2">Job</th>
                    <th class="px-3 py-2">Position</th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="p in players" :key="p.id" class="hover:bg-neutral-900 text-center cursor-pointer transition" @dblclick="$emit('selectPlayer', p)">
                    <td class="p-2">{{ p.id }}</td>
                    <td class="p-2">{{ p.name }}</td>
                    <td class="p-2">{{ p.ping }}</td>
                    <td class="p-2">{{ p.health }}</td>
                    <td class="p-2">{{ p.armour }}</td>
                    <td v-if="p.job && Array.isArray(p.job)" class="p-2">{{ p.job?.join(', ') || 'arbeitslos' }}</td>
                    <td v-else-if ="p.job" class="p-2">{{ p.job || 'arbeitslos' }}</td>
                    <td class="p-2">{{ `${p.pos?.x?.toFixed(4) || 0.0000 }, ${p.pos?.y?.toFixed(4) || 0.0000}, ${p.pos?.z?.toFixed(4) || 0.0000}` }}</td>
                </tr>
            </tbody>
        </table>
    </div>
</template>