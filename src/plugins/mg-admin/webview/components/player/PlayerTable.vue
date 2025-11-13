<script lang="ts" setup>
import { PlayerStats } from '@Plugins/mg-admin/shared/interfaces';

const { players } = defineProps<{
    players: PlayerStats[];
}>();

const emits = defineEmits<{
    (e: 'selectPlayer', player: PlayerStats): void;
}>();
</script>

<template>
    <div class="h-full w-full overflow-hidden bg-neutral-900 rounded-lg border border-neutral-800 flex flex-col">
        <!-- Tabellenkopf -->
        <div class="bg-neutral-800 text-gray-200 uppercase text-xs font-semibold select-none rounded-t-lg">
            <div class="grid grid-cols-7 text-center py-2 px-3 border-b border-neutral-700">
                <div>ID</div>
                <div>Name</div>
                <div>Ping</div>
                <div>Health</div>
                <div>Armour</div>
                <div>Job</div>
                <div>Position</div>
            </div>
        </div>

        <!-- Tabelleninhalt -->
        <div class="flex-1 overflow-y-auto overflow-x-hidden text-gray-300 select-none">
            <div
                v-for="p in players"
                :key="p.id"
                class="grid grid-cols-7 text-center items-center py-2 px-3 border-b border-[#008736]/75 hover:bg-neutral-800/70 cursor-pointer transition-all"
                @dblclick="emits('selectPlayer', p)"
            >
                <div>{{ p.id }}</div>
                <div class="font-medium text-emerald-400 truncate">{{ p.name }}</div>
                <div :class="p.ping > 100 ? 'text-red-400' : 'text-emerald-400'">{{ p.ping }}</div>
                <div :class="p.health < 50 ? 'text-red-400' : 'text-emerald-400'">{{ p.health }}</div>
                <div :class="p.armour > 0 ? 'text-blue-400' : 'text-gray-400'">{{ p.armour }}</div>

                <div v-if="Array.isArray(p.job!)">
                    {{ p.job.join(", ") || "arbeitslos" }}
                </div>
                <div v-else>
                    {{ p.job || "arbeitslos" }}
                </div>

                <div class="text-xs text-gray-400">
                    {{ `${p.pos?.x?.toFixed(2) || 0.0}, ${p.pos?.y?.toFixed(2) || 0.0}, ${p.pos?.z?.toFixed(2) || 0.0}` }}
                </div>
            </div>

            <div v-if="players.length === 0" class="text-center text-gray-500 py-10 italic select-none">
                Keine Spieler online
            </div>
        </div>
    </div>
</template>

<style scoped>
::-webkit-scrollbar {
  width: 6px;
}
::-webkit-scrollbar-thumb {
  background: #333;
  border-radius: 3px;
}
::-webkit-scrollbar-thumb:hover {
  background: #555;
}
</style>
