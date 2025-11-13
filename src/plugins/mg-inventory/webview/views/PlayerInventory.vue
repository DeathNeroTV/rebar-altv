<script lang="ts" setup>
import { ref, computed } from 'vue';
import type { Inventory as InventoryType, Player, Weapon } from '../../shared/interfaces';
import InventoryHolder from '../components/InventoryHolder.vue';
import { Item } from '@Shared/types/items.js';

const props = defineProps<{
    inventory: InventoryType;
    player?: Player;
    playerWeapons?: Weapon[];
}>();

const hoveringItem = ref<Item | null>(null);
const draggingItem = ref<Item | null>(null);

// Gewicht berechnen
const currentWeight = computed(() => {
  return props.inventory.slots.reduce((sum, item) => sum + (item?.weight * item?.quantity || 0), 0);
});

const maxWeight = props.inventory.capacity;

// Kreisberechnung
const radius = 56; // muss mit SVG übereinstimmen
const circumference = 2 * Math.PI * radius;
const dashOffset = computed(() => {
    const progress = Math.min(currentWeight.value / maxWeight, 1);
    return circumference - progress * circumference;
});

const circleColor = computed(() => {
    const progress = currentWeight.value / maxWeight;
    if (progress < 0.75) return '#008736'; // grün
    if (progress < 1) return '#facc15'; // gelb
    return '#dc2626'; // rot
});

function formatCurrency(value: number) {
    return new Intl.NumberFormat('de-DE', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
    }).format(value);
}

function showToolTip(item: Item | null) {
    hoveringItem.value = item;
}

function findItemByIndex(index: number) {
    return props.inventory.slots[index];
}

function findFreeSlot() {
    return props.inventory.slots.findIndex(x => x === null);
}

function splitStack(slotIndex: number, amount: number) {
    const original = findItemByIndex(slotIndex);
    if (!original || original.quantity <= 1 || amount <= 0) return;

    const taken = Math.min(amount, original.quantity);
    original.quantity -= taken;

    draggingItem.value = { ...original, quantity: taken };

    const freeIndex = findFreeSlot();
    if (freeIndex === -1) return;
    props.inventory.slots[freeIndex] = draggingItem.value;
    props.inventory.slots[slotIndex] = original;
}

function onLeftClick(uid: string, modifiers: { shift: boolean; ctrl: boolean }) {
    const index = Number(uid);
    const item = props.inventory.slots[index];
    if (!item) return;

    if (modifiers.shift) {
        splitStack(index, Math.floor(item.quantity / 2));
        return;
    }

    if (modifiers.ctrl) {
        splitStack(index, 1);
        return;
    }
}

function onRightClick(uid: string) {
    const index = Number(uid);
    const item = props.inventory.slots[index];
    if (!item) return;
    const leftOver = Math.max(0, item.quantity--);
    if (leftOver > 0) {
        props.inventory.slots[index] = {
            ... item,
            quantity: leftOver
        };
    } else props.inventory.slots[index] = null;
}

function onMiddleClick(uid: string) {
    const slots = props.inventory.slots;
    const totalSlots = slots.length;

    // 1) Alle Items extrahieren
    const items = slots.filter((i): i is Item => i !== null);

    // 2) Items nach id sortieren
    items.sort((a, b) => Number(a.id) - Number(b.id));

    // 3) Items nach id zusammenführen
    const merged: Item[] = [];

    for (const item of items) {
        const existing = merged.find(i => i.id === item.id && i.quantity < (i.maxStack || 1));
        if (existing) {
            const max = existing.maxStack || 1;
            const free = max - existing.quantity;

            if (item.quantity <= free) existing.quantity += item.quantity;
            else {
                existing.quantity = max;
                merged.push({ ...item, quantity: item.quantity - free, uid: crypto.randomUUID() });
            }
        } else  merged.push({ ...item });
    }

    // 4) Slots neu befüllen
    props.inventory.slots = [...merged, ...Array(totalSlots - merged.length).fill(null)];
}

function onItemDragged(fromId: string, toId: string) {
    const fromIndex = Number(fromId);
    const toIndex = Number(toId);
    const fromItem = findItemByIndex(fromIndex);
    const toItem = findItemByIndex(toIndex);

    if (!fromItem) return;

    // -------------------------------
    // 1) ZIEL-PLATZ IST LEER
    // -------------------------------
    if (!toItem) {
        props.inventory.slots[toIndex] = fromItem;
        props.inventory.slots[fromIndex] = null;
        return;
    }

    // -------------------------------
    // 2) GLEICHES ITEM → STACK MERGEN
    // -------------------------------
    if (toItem.uid === fromItem.uid) {
        const max = toItem.maxStack || 1;
        const free = max - toItem.quantity;
        const moveAmount = fromItem.quantity;
        const add = Math.min(free, moveAmount);
        toItem.quantity += add;

        const leftOver = moveAmount - add;

        if (leftOver > 0) props.inventory.slots[fromIndex] = { ...fromItem, quantity: leftOver };
        else props.inventory.slots[fromIndex] = null;

        props.inventory.slots[toIndex] = toItem;
        return;
    }

    // -------------------------------
    // 3) ANDERES ITEM → TAUSCH
    // -------------------------------
    props.inventory.slots[toIndex] = fromItem;
    props.inventory.slots[fromIndex] = toItem;
}

</script>

<template>
    <div class="w-full h-full flex gap-2 select-none overflow-hidden">        
        <!-- Linke Seite: Spielerwaffen / zusätzliche Infos -->
        <div class="min-w-64 flex flex-col gap-4">
            <div class="w-full h-full bg-neutral-950/90 rounded-3xl p-3 shadow-md">
                <h3 class="w-full text-center text-gray-100 bg-[#008736] rounded-full font-semibold px-2 py-1 mt-4">Ausgerüstete Waffen</h3>
                <ul class="space-y-2">
                    <li v-for="weapon in playerWeapons" :key="weapon.hash" class="text-gray-200">
                        {{ weapon.name }} ({{ weapon.ammo }})
                    </li>
                </ul>
            </div>
        </div>

        <!-- Mittlere Spalte: Inventar Slots + Schnellleiste + Such/Filter -->
        <InventoryHolder :inventory="inventory" :hasBar="true" @hoverOver="showToolTip" @dragged="onItemDragged" @leftClick="onLeftClick" @middleClick="onMiddleClick" @rightClick="onRightClick" />

        <!-- Rechte Spalte: Spielerinformationen -->
        <div class="min-w-96 flex flex-col gap-2">
            <!-- Spielerinfo oben -->
            <div class="w-full bg-neutral-950/90 rounded-3xl p-3 shadow-md text-gray-100">
                <div class="w-full flex flex-row gap-5 items-center mt-4 mb-2 ml-4">
                    <div class="rounded-full w-12 h-12 ring-1 ring-[#008736] p-3">
                        <img src="/images/mg-admin-logo.png"/>
                    </div>
                    <p class="text-2xl text-[#008736]">{{ player?.name ?? 'Unbekannt' }}</p>
                </div>
                <div class="w-full flex flex-row gap-2 justify-between items-center uppercase px-4"><strong class="text-[#008736]">ID:</strong> {{ player.id }}</div>
                <div class="w-full flex flex-row gap-2 justify-between items-center uppercase px-4"><strong class="text-[#008736]">Job:</strong> {{ player.job }}</div>
                <div class="w-full flex flex-row gap-2 justify-between items-center uppercase px-4"><strong class="text-[#008736]">Telefon:</strong> {{ player.phone }}</div>
                <div class="relative left-1/2 w-2/3 -translate-x-1/2 h-[2px] items-center bg-[#008736] my-2"></div>
                <div class="flex flex-row items-center justify-between px-4 gap-2">
                    <div class="flex flex-row gap-1 items-center text-2xl text-[#008736]">
                        <font-awesome-icon :icon="['fas', 'wallet']" />
                        <p class="text-lg uppercase">bargeld</p>
                    </div>
                    <p class="text-2xl text-gray-100 uppercase truncate">{{ formatCurrency(player?.bank ?? 0) }}</p>
                </div>
            </div>

            <!-- Gewicht & Tooltip unten -->
            <div class="relative h-full bg-neutral-950/90 rounded-3xl p-5 shadow-md text-gray-100 flex flex-col gap-5 items-center justify-start overflow-hidden">
                <h3 class="text-[#008736] text-lg font-semibold mb-2 uppercase">Traglast</h3>

                <!-- Kreis -->
                <div class="relative w-40 h-40 flex items-center justify-center">
                    <svg
                        class="w-full h-full transform -rotate-90"
                        viewBox="0 0 150 150"
                    >
                        <circle
                            class="text-neutral-800/70"
                            stroke="currentColor"
                            stroke-width="5"
                            fill="transparent"
                            r="70"
                            cx="75"
                            cy="75"
                        />
                        <circle
                            class="transition-all duration-700 ease-out"
                            :stroke="circleColor"
                            stroke-width="10"
                            stroke-linecap="round"
                            fill="transparent"
                            :stroke-dasharray="circumference"
                            :stroke-dashoffset="dashOffset"
                            r="70"
                            cx="75"
                            cy="75"
                        />
                    </svg>

                    <div class="absolute text-center">
                        <p class="text-2xl font-bold" :style="{ color: circleColor }">
                            {{ currentWeight.toFixed(1) }} kg
                        </p>
                        <p class="text-sm text-neutral-500">von {{ maxWeight }} kg</p>
                    </div>
                </div>

                <!-- Tooltip (unten zentriert) -->
                <transition name="fade">
                    <div
                        v-if="hoveringItem"
                        class="absolute bottom-6 left-1/2 -translate-x-1/2 bg-neutral-900/95 border border-[#008736]/70 shadow-lg shadow-[#008736]/20 rounded-2xl p-4 w-72 flex flex-col items-center text-center z-50"
                    >
                        <img
                            :src="'/images/' + hoveringItem.icon + '.png'"
                            class="w-20 h-20 object-contain mb-3"
                        />
                        <h3 class="text-lg font-bold text-[#008736] uppercase tracking-wide">{{ hoveringItem.name }}</h3>
                        <p class="text-neutral-500 text-sm mt-1 leading-snug px-2">{{ hoveringItem.desc }}</p>
                    </div>
                </transition>
            </div>
        </div>
    </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>