<script lang="ts" setup>
    import { onMounted, ref } from 'vue';
    
    import { useEvents } from '@Composables/useEvents';
    import { CharacterSelectEvents } from '@Plugins/mg-charselect/shared/characterSelectEvents';

    import PlayerHud from './components/PlayerHud.vue';
    import VehicleHud from './components/VehicleHud.vue';
    import { HudEvents } from '../shared/events';

    const events = useEvents();
    const isDead = ref<Boolean>(false);

    const relog = () => events.emitServer(CharacterSelectEvents.toServer.logoutCharacter);

    onMounted(() => events.on(HudEvents.toWebview.updateDead, (value: boolean) => isDead.value = value));
</script>

<template>
    <PlayerHud />
    <VehicleHud />
    <div v-if="!isDead" class="fixed top-2 left-1/2 -translate-x-1/2 p-4 rounded-full text-gray-100 bg-red-500/25 hover:bg-red-500/75 flex flex-1 text-2xl text-center items-center" @click="relog">
        <font-awesome-icon :icon="['fas', 'fa-right-from-bracket']" />
    </div>
</template>