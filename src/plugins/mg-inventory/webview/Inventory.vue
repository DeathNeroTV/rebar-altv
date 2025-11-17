<script lang="ts" setup>
	import { onMounted, onUnmounted, ref } from 'vue';
	import PlayerInventory from './views/PlayerInventory.vue';
	import { ActiveInventorySession, Inventory, Player, Weapon } from '../shared/interfaces';
	import StorageInventory from './views/StorageInventory.vue';
	import { useEvents } from '@Composables/useEvents';
	import { InventoryEvents } from '../shared/events';

	const events = useEvents();

	const playerInventory = ref<Inventory>(null);
	const otherInventory = ref<Inventory>(null);

	const player = ref<Player>(null);
	const weapons = ref<Weapon[] | null>(null);

	onMounted(() => {
		events.on(InventoryEvents.toWebview.updateView, (session: ActiveInventorySession) => {
			player.value = session.player;
			weapons.value = session.weapons;
			playerInventory.value = session.playerInventory;
			otherInventory.value = session.otherInventory;
		});
	});

	onUnmounted(() => {
		player.value = null;
		weapons.value = null;
		playerInventory.value = null;
		otherInventory.value = null;
	});
</script>

<template>
	<div v-if="playerInventory" class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[80vh] overflow-hidden">
		<PlayerInventory v-if="!otherInventory" :inventory="playerInventory" :player-weapons="weapons" :player="player" />
		<StorageInventory v-else :player-inventory="playerInventory" :other-inventory="otherInventory" />
	</div>
</template>
