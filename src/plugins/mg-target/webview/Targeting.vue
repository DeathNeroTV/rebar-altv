<template>
    <div v-if="isActive" class="w-screen h-screen flex items-center justify-center">
        <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 flex flex-row gap-2 justify-between items-center text-center select-none">
            <font-awesome-icon :icon="['fas', 'eye']" class="rounded-full h-12 w-12 shadow-[0_0_25px_#00873640]" :class="hasTarget ? 'text-[#008736]/90' : 'text-neutral-950/90'" />

            <Transition name="fade">
                <TargetMenu v-if="showMenu" :options="options" @close="showMenu = false" @select="handleSelect" />
            </Transition>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useEvents } from '@Composables/useEvents.js';
import { TargetOption } from '../shared/interfaces.js';
import { TargetingEvents } from '../shared/events.js';

import TargetMenu from './components/TargetMenu.vue';

const events = useEvents();

const hasTarget = ref(false);
const isActive = ref(false);
const showMenu = ref(false);
const options = ref<TargetOption[]>([]);

function handleShowTarget() {
    isActive.value = true;
}

function handleHasTarget(value: boolean) {
    hasTarget.value = value;
}

function handleOpenMenu(target: { options: TargetOption[] }) {
    if (!isActive.value) return;
    options.value = target.options || [];
    hasTarget.value = true;
    showMenu.value = true;
}



function handleHideTarget() {
    isActive.value = false;
    showMenu.value = false;
}

events.on(TargetingEvents.toClient.openMenu, handleOpenMenu);
events.on(TargetingEvents.toClient.hasTarget, handleHasTarget);
events.on(TargetingEvents.toClient.showTarget, handleShowTarget);
events.on(TargetingEvents.toClient.hideTarget, handleHideTarget);

function handleSelect(opt: TargetOption) {
    if (opt.type === 'server') events.emitServer(opt.event, opt.data);
    else events.emitClient(opt.event, opt.data);
    showMenu.value = false;
}
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
    transition: all 0.25s ease;
}
.fade-enter-from,
.fade-leave-to {
    opacity: 0;
    transform: translateY(10px);
}
</style>
