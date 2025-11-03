<script lang="ts" setup>
    import { reactive, ref } from 'vue';
    import { HudEvents } from '../shared/events';
    import { useEvents } from '@Composables/useEvents';
    import { Character, Vehicle } from '@Shared/types';

    import PlayerHud from './components/PlayerHud.vue';
    import VehicleHud from './components/VehicleHud.vue';
    import { CharacterSelectEvents } from '@Plugins/mg-charselect/shared/characterSelectEvents';

    const events = useEvents();

    const actualTime = ref<string>('00:00');
    const isVisible = ref<boolean>(false);
    const playerStats = reactive<Partial<Character>>({
        id: 1,
        health: 0,
        armour: 0,
        food: 0,
        water: 0,
        voiceRange: 0,
    });
    const vehicleStats = reactive<Partial<Vehicle>>({
        speed: 0,
        gear: 0,
        fuel: 0,
        rpm: 0,
        maxSpeed: 0,
        stateProps: { engineOn: true, lightState: 1 }
    });

    function handlePlayerPayload(payload: { key: string, value: any }) {
        if (!payload) return;
        playerStats[payload.key] = payload.value;
    }

    function handleVehiclePayload(payload: { key: string, value: any }) {
        if (!payload) return;
        vehicleStats[payload.key] = payload.value;
    }

    function handleVisibility(value: boolean) {
        isVisible.value = value;
        events.emitClient(HudEvents.toClient.toggleVehicle, value);
    }

    function relog() {
        events.emitServer(CharacterSelectEvents.toServer.logoutCharacter);
    }

    events.on(HudEvents.toClient.syncTime, (hour: number, minute: number, second: number) => {
        const formattedHour = hour.toString().padStart(2, '0');
        const formattedMinute = minute.toString().padStart(2, '0');
        actualTime.value = `${formattedHour}:${formattedMinute}`;
    });
    events.on(HudEvents.toClient.toggleVehicle, handleVisibility);
    events.on(HudEvents.toClient.updatePlayer, handlePlayerPayload);
    events.on(HudEvents.toClient.updateVehicle, handleVehiclePayload);
</script>

<template>
    <PlayerHud :is-visible="!playerStats.isDead" :data="playerStats" :actual-time="actualTime" />
    <VehicleHud :is-visible="isVisible && !playerStats.isDead" :data="vehicleStats" />
    <div v-if="!playerStats.isDead" class="fixed top-2 right-2 p-4 rounded-full text-gray-100 bg-red-500/25 hover:bg-red-500/75 flex flex-1 text-2xl text-center items-center" @click="relog">
        <font-awesome-icon :icon="['fas', 'fa-right-from-bracket']" />
    </div>
</template>