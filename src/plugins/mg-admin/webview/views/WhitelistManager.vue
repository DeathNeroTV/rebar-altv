<script lang="ts" setup>
import { onMounted, ref } from 'vue';
import { WhitelistEntry } from '@Plugins/mg-admin/shared/interfaces';
import { useTranslate } from '@Shared/translate';
import { useEvents } from '@Composables/useEvents';
import { AdminEvents } from '@Plugins/mg-admin/shared/events';

const props = defineProps<{
    language: 'de' | 'en';
}>();

const emits = defineEmits<{
    (e: 'approve', discordId: string): void;
    (e: 'reject', discordId: string): void;
    (e: 'request'): void;
}>();

const { t } = useTranslate(props.language);
const events = useEvents();

const whitelistRequests = ref<WhitelistEntry[]>([]);

const approveRequest = (discordId: string) => emits('approve', discordId);
const rejectRequest = (discordId: string) => emits('reject', discordId);

onMounted(async () => {
    whitelistRequests.value = await events.emitServerRpc(AdminEvents.toServer.request.whitelist);
});

</script>

<template>
    <div class="p-6 text-gray-100 flex flex-col gap-6 select-none">
        <h1 class="text-3xl font-semibold mb-2">{{ t('admin.panel.dashboard.whitelist.title') }}</h1>
        <p class="text-gray-100 mb-6">{{ t('admin.panel.dashboard.whitelist.desc') }}</p>

        <div v-if="whitelistRequests.length > 0" class="grid grid-cols-4 gap-6">
            <div v-for="entry in whitelistRequests" :key="entry.code" class="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 flex-col justify-between shadow-md hover:shadow-xl transition-all hover:-translate-y-1">
                <!-- Header -->
                <div class="flex flex-col gap-2 mb-3">
                    <div class="flex items-center justify-between">
                        <h2 class="text-xl font-semibold flex items-center gap-2">
                        <font-awesome-icon :icon="['fas', 'user']" />
                        {{ entry.username }}
                        </h2>
                        <span class="text-sm text-gray-400">{{ entry.date }}</span>
                    </div>
                </div>

                <!-- Whitelist-Code -->
                <div class="flex items-center gap-2 mb-4">
                    <font-awesome-icon :icon="['fas', 'key']" class="text-green-500" />
                    <span class="text-gray-200 font-mono text-lg tracking-widest">{{ entry.code }}</span>
                </div>

                <!-- Aktionen -->
                <div class="flex justify-center gap-3 mt-2">
                    <button
                        @click="approveRequest(entry.username)"
                        class="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-full text-sm font-medium transition cursor-pointer"
                    >
                        <font-awesome-icon :icon="['fas', 'check']" class="mr-2" />
                        {{ t('admin.panel.dashboard.whitelist.approve') }}
                    </button>
                    <button
                        @click="rejectRequest(entry.username)"
                        class="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-full text-sm font-medium transition cursor-pointer"
                    >
                        <font-awesome-icon :icon="['fas', 'xmark']" class="mr-2" />
                        {{ t('admin.panel.dashboard.whitelist.reject') }}
                    </button>
                </div>
            </div>
        </div>
        <!-- Leerer Zustand -->
        <div
            v-else
            class="text-center text-gray-500 py-20 bg-neutral-900 border border-neutral-800 rounded-2xl"
        >
            <font-awesome-icon :icon="['fas', 'inbox']" class="text-4xl mb-4 opacity-60" />
            <p class="text-lg">Keine offenen Whitelist-Anfragen</p>
        </div>
    </div>
</template>

<style scoped>
</style>