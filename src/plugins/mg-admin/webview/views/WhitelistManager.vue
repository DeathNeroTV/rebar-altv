<script lang="ts" setup>
import { onMounted, ref } from 'vue';
import { WhitelistRequest } from '@Plugins/mg-admin/shared/interfaces';
import { useTranslate } from '@Shared/translate';
import { useEvents } from '@Composables/useEvents';
import { AdminEvents } from '@Plugins/mg-admin/shared/events';

const { language } = defineProps({ language: String });
const { t } = useTranslate(language);
const events = useEvents();
const entries = ref<WhitelistRequest[]>([]);

const approveRequest = async (index: number) => {
    events.emitServer(AdminEvents.toServer.whitelist.approve, entries[index]._id);
};

const rejectRequest = async (index: number) => {
    events.emitServer(AdminEvents.toServer.whitelist.reject, entries[index]._id);
};

const addWhitelist = (request: WhitelistRequest) => entries.value.push(request);
const updateWhitelist = (request: WhitelistRequest) => {
    const index = entries.value.findIndex(data => data._id === request._id);
    if (index === -1) return;
    entries.value[index] = request;
};

onMounted(async () => {
    entries.value = await events.emitServerRpc(AdminEvents.toServer.request.whitelist) ?? [];

    events.on(AdminEvents.toWebview.whitelist.add, updateWhitelist);
    events.on(AdminEvents.toWebview.whitelist.update, addWhitelist);
});

</script>

<template>
    <div class="p-6 text-gray-100 flex flex-col gap-6 select-none w-full h-full">
        <h1 class="text-3xl font-semibold mb-2">{{ t('admin.panel.dashboard.whitelist.title') }}</h1>
        <p class="text-gray-100 mb-6">{{ t('admin.panel.dashboard.whitelist.desc') }}</p>

        <div v-if="entries.length > 0" class="grid grid-cols-4 gap-6">
            <div v-for="entry, index in entries" :key="entry.code" class="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 flex-col justify-between shadow-md hover:shadow-xl transition-all hover:-translate-y-1">
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
                        @click="approveRequest(index)"
                        class="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-full text-sm font-medium transition cursor-pointer"
                    >
                        <font-awesome-icon :icon="['fas', 'check']" class="mr-2" />
                        {{ t('admin.panel.dashboard.whitelist.approve') }}
                    </button>
                    <button
                        @click="rejectRequest(index)"
                        class="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-full text-sm font-medium transition cursor-pointer"
                    >
                        <font-awesome-icon :icon="['fas', 'xmark']" class="mr-2" />
                        {{ t('admin.panel.dashboard.whitelist.reject') }}
                    </button>
                </div>
            </div>
        </div>
        <!-- Leerer Zustand -->
        <div v-else class="w-full h-full">
            <div
                class="relative top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-fit h-fit p-5 text-center items-center justify-center text-gray-500 py-5 bg-neutral-900/25 border border-neutral-700/95 rounded-2xl"
            >
                <font-awesome-icon :icon="['fas', 'inbox']" class="text-4xl mb-4 opacity-60" />
                <p class="text-lg">{{ t('admin.panel.dashboard.whitelist.noRequests') }}</p>
            </div>
        </div>
    </div>
</template>