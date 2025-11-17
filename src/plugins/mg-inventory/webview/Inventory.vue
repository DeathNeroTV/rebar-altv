<script lang="ts" setup>
	import { onMounted, onUnmounted, ref } from 'vue';
	import { useEvents } from '@Composables/useEvents';

	import { ActiveInventorySession, Inventory, Player, Weapon } from '../shared/interfaces';
	import { InventoryEvents } from '../shared/events';

	import PlayerInventory from './views/PlayerInventory.vue';
	import StorageInventory from './views/StorageInventory.vue';

	const events = useEvents();

	const player = ref<Player>({
		bank: 0,
		cash: 0,
		id: 1,
		job: '',
		name: '',
		phone: '',
	});
	const playerInventory = ref<Inventory>({
		capacity: 20,
		slots: [],
		owner: '',
		type: 'player',
	});
	const weapons = ref<Weapon[]>([]);
	const otherInventory = ref<Inventory | null>(null);

	onMounted(() => {
		events.on(InventoryEvents.toWebview.updateView, (session: ActiveInventorySession) => {
			player.value = session.player;
			weapons.value = session.weapons;
			playerInventory.value = session.playerInventory;
			otherInventory.value = session.otherInventory;
		});
	});
</script>

<template>
	<div v-if="playerInventory" class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[80vh] overflow-hidden">
		<PlayerInventory v-if="!otherInventory" :inventory="playerInventory" :player-weapons="weapons" :player="player" />
		<StorageInventory v-else :player-inventory="playerInventory" :other-inventory="otherInventory" />
	</div>
</template>
