<script lang="ts" setup>
import { onMounted, ref } from 'vue';
import PlayerInventory from './views/PlayerInventory.vue';
import { Inventory, Player, Weapon } from '../shared/interfaces';
import StorageInventory from './views/StorageInventory.vue';

const isStorage = ref<boolean>(false);

const playerInventory = ref<Inventory>({
    slots: Array(30).fill(null),
    capacity: 20
});

const otherInventory = ref<Inventory>({
    slots: Array(30).fill(null),
    capacity: 20
});

const player = ref<Player>({
    bank: 1000,
    cash: 100,
    id: 1,
    job: 'police',
    name: 'Roman Jackson',
    phone: '000-000'
});
const weapons = ref<Weapon[]>([]);

onMounted(() => {
    otherInventory.value.slots[0] = { id: 1, icon: 'hamburger', desc: 'Es könnte auch ne Pommes sein', maxStack: 10, name: 'Hamburger', quantity: 10, category: 'eatable', uid:'food-hamburger', weight: 0.25 };
    otherInventory.value.slots[1] = { id: 2, icon: 'cola', desc: 'Es könnte auch ne Pommes sein', maxStack: 10, name: 'E-Cola', quantity: 10, category: 'eatable', uid:'drink-cola', weight: 0.33 };
    otherInventory.value.slots[2] = { id: 3, icon: 'first_aid', desc: 'Es könnte auch ne Pommes sein', maxStack: 10, name: 'Erste-Hilfe-Set', quantity: 1, category: 'medical', uid:'first-aid-kit', weight: 0.5 };
    playerInventory.value.slots[0] = { id: 1, icon: 'hamburger', desc: 'Es könnte auch ne Pommes sein', maxStack: 10, name: 'Hamburger', quantity: 10, category: 'eatable', uid:'food-hamburger', weight: 0.25 };
    playerInventory.value.slots[1] = { id: 2, icon: 'cola', desc: 'Es könnte auch ne Pommes sein', maxStack: 10, name: 'E-Cola', quantity: 10, category: 'eatable', uid:'drink-cola', weight: 0.33 };
    playerInventory.value.slots[2] = { id: 3, icon: 'first_aid', desc: 'Es könnte auch ne Pommes sein', maxStack: 10, name: 'Erste-Hilfe-Set', quantity: 1, category: 'medical', uid:'first-aid-kit', weight: 0.5 };
});

function handleMouseDown(e: MouseEvent) {
    if (e.button === 1) {
        e.preventDefault();
        
    }
}
</script>

<template>
    <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[80vh] overflow-hidden" @mousedown="handleMouseDown">
        <PlayerInventory v-if="!isStorage" :inventory="playerInventory" :player-weapons="weapons" :player="player" />
        <StorageInventory v-else :player-inventory="playerInventory" :other-inventory="otherInventory" />
    </div>
</template>