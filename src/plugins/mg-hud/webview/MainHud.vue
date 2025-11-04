<script lang="ts" setup>
    import { onMounted, reactive, ref } from 'vue';
    
    import { useEvents } from '@Composables/useEvents';
    import { Character, Vehicle } from '@Shared/types';

    import { HudEvents } from '@Plugins/mg-hud/shared/events';
    import { CharacterSelectEvents } from '@Plugins/mg-charselect/shared/characterSelectEvents';

    import PlayerHud from './components/PlayerHud.vue';
    import VehicleHud from './components/VehicleHud.vue';

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

    const handlePlayerPayload = (payload: { key: string, value: any }) => {
        if (!payload) return;
        playerStats[payload.key] = payload.value;
    };

    const handleVehiclePayload = (payload: { key: string, value: any }) => {
        if (!payload) return;
        vehicleStats[payload.key] = payload.value;
    };

    const handleVisibility = (value: boolean) => {
        isVisible.value = value;
        events.emitClient(HudEvents.toWebview.toggleVehicle, value);
    };

    const relog = () => {
        events.emitServer(CharacterSelectEvents.toServer.logoutCharacter);
    };

    const init = () => {
        events.on(HudEvents.toWebview.syncTime, (hour: number, minute: number, second: number) => {
            const formattedHour = hour.toString().padStart(2, '0');
            const formattedMinute = minute.toString().padStart(2, '0');
            actualTime.value = `${formattedHour}:${formattedMinute}`;
        });
        events.on(HudEvents.toWebview.toggleVehicle, handleVisibility);
        events.on(HudEvents.toWebview.updatePlayer, handlePlayerPayload);
        events.on(HudEvents.toWebview.updateVehicle, handleVehiclePayload);
    };

    onMounted(init);
</script>

<template>
    <PlayerHud :is-visible="!playerStats.isDead" :data="playerStats" :actual-time="actualTime" />
    <VehicleHud :is-visible="isVisible && !playerStats.isDead" :data="vehicleStats" />
    <div v-if="!playerStats.isDead" class="fixed top-2 right-2 p-4 rounded-full text-gray-100 bg-red-500/25 hover:bg-red-500/75 flex flex-1 text-2xl text-center items-center" @click="relog">
        <font-awesome-icon :icon="['fas', 'fa-right-from-bracket']" />
    </div>
</template>