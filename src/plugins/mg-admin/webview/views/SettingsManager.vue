<script lang="ts" setup>
	import { onMounted, ref } from 'vue';
	import { useTranslate } from '@Shared/translate';
	import { useEvents } from '@Composables/useEvents';
	import { AdminEvents } from '@Plugins/mg-admin/shared/events';

	const { language } = defineProps({ language: String });

	const emits = defineEmits<{}>();

	const { t } = useTranslate(language);
	const events = useEvents();

	const entries = ref<any[]>([]);

	//onMounted(async () => (entries.value = (await events.emitServerRpc(AdminEvents.toServer.request.configs)) ?? []));
</script>

<template></template>

<style scoped></style>
