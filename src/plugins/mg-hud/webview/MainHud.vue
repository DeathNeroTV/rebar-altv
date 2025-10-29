<script lang="ts" setup>
    import { reactive, ref } from 'vue';
    import { HudEvents } from '../shared/events';
    import { useEvents } from '@Composables/useEvents';
    import { Character, Vehicle } from '@Shared/types';

    import PlayerHud from './components/PlayerHud.vue';
    import VehicleHud from './components/VehicleHud.vue';

    const events = useEvents();

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

    events.on(HudEvents.toClient.toggleVehicle, handleVisibility);
    events.on(HudEvents.toClient.updatePlayer, handlePlayerPayload);
    events.on(HudEvents.toClient.updateVehicle, handleVehiclePayload);
</script>

<template>
    <PlayerHud :is-visible="!playerStats.isDead" :data="playerStats" />
    <VehicleHud :is-visible="isVisible && !playerStats.isDead" :data="vehicleStats" />
</template>