<script lang="ts" setup>
import { onMounted, ref } from 'vue';
import { useTranslate } from '@Shared/translate';
import { useEvents } from '@Composables/useEvents';
import { AdminEvents } from '@Plugins/mg-admin/shared/events';
import { Item } from '@Shared/types/items';

const { language } = defineProps({ language: String });

const emits = defineEmits<{}>();

const { t } = useTranslate(language);
const events = useEvents();

const entries = ref<Item[]>([]);

onMounted(async () => entries.value = await events.emitServerRpc(AdminEvents.toServer.request.items) ?? []);
</script>

<template>
</template>

<style scoped>
</style>