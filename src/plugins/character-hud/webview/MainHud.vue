<script lang="ts" setup>
    import { reactive, ref } from 'vue';
    import { HudEvents } from '../shared/events';
    import { useEvents } from '@Composables/useEvents';
    import { Character, Vehicle } from '@Shared/types';

    import PlayerHud from './components/PlayerHud.vue';
    import VehicleHud from './components/VehicleHud.vue';

    const events = useEvents();

    const isVisible = ref<boolean>(true);

    const stats = reactive<Partial<Character>>({
        health: 0,
        armour: 0,
        food: 0,
        water: 0,
        voiceRange: 0,
    });

    const vehicle = reactive<Partial<Vehicle>>({
        speed: 0,
        gear: 0,
        fuel: 0,
        rpm: 0,
        maxSpeed: 0,
        stateProps: { engineOn: true, lightState: 1 }
    });

    function handlePayload(payload: { key: string; value: any }) {
        if (!payload || typeof payload !== 'object') return;

        if (!('key' in payload)) {
            Object.entries(payload).forEach(([k, v]) => {
                if (['speed', 'rpm', 'gear', 'fuel', 'maxSpeed'].includes(k)) vehicle[k] = Number(v);
                else if (k === 'stateProps' && typeof v === 'object') vehicle.stateProps = v;
            });
            return;
        }

        const { key: k, value: v } = payload;
        if (k in stats) {
            if (['health', 'armour', 'food', 'water'].includes(k)) stats[k] = clampNumber(v, 0, 100);
            else stats[k] = v;
            return;
        }

        if (k in vehicle) {
            if (['speed', 'rpm', 'gear', 'fuel', 'maxSpeed'].includes(k)) vehicle[k] = Number(v);
            else if (k === 'stateProps' && typeof v === 'object') vehicle.stateProps = v;
        }
    }

    function clampNumber(v: any, lo: number, hi: number) {
        const n = Number(v)
        if (Number.isNaN(n)) return lo
        return Math.max(lo, Math.min(hi, n))
    }

    function handleVisibility(value: boolean) {
        isVisible.value = value;
        events.emitClient(HudEvents.toClient.toggleVehicle, value);
    }

    events.on(HudEvents.toClient.toggleVehicle, handleVisibility);
    events.on(HudEvents.toClient.updatePlayer, handlePayload);
    events.on(HudEvents.toClient.updateVehicle, handlePayload);
</script>

<template>
    <PlayerHud :data="stats" />
    <VehicleHud :data="vehicle" :is-visible="isVisible" />
</template>

<style scoped>
:root {
  --hud-green: #008736;
}
.tile {
  min-height: 44px;
}
.bg-hud-green\/100 {
  background-color: var(--hud-green) !important;
}
.bg-hud-green\/90 {
  background-color: rgba(0,135,54,0.90) !important;
}
</style>
