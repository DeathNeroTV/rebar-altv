<script lang="ts" setup>
	import { useTranslate } from '@Shared/translate';
	import '../../translate/index';
	import { Character } from '@Shared/types';

	const { t } = useTranslate('de');
    const props = defineProps<{
        character: Character;
        selected: boolean;
    }>();
</script>

<template>
	<div
		@click="$emit('click')"
		class="select-none transition-all bg-neutral-950/25 backdrop-blur-md p-4 rounded-lg border-2 border-gray-100/25 hover:bg-neutral-800/25"
		:class="props.selected ? 'scale-105' : 'scale-100'"
	>
		
		<div class="flex flex-col justify-between items-center gap-2">	
			<div class="w-full flex flex-row justify-between items-center mb-2">
				<h2 class="w-full px-2 text-xl font-bold">{{ props.character.name }}</h2>
				<slot v-if="props.selected" />
			</div>
			<div
				v-if="!props.character.appearance"
				class="select-none text-center gap-1 rounded-lg bg-neutral-950/50 p-3 text-lg w-full font-bold text-gray-100 shadow-lg"				
			>
				{{ t('character.select.no.appearance') }}
			</div>		
		</div>
	</div>
</template>