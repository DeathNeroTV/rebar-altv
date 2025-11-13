<script lang="ts" setup>
import { computed, onMounted, ref } from "vue";
import { Item } from "@Shared/types/items";
import { useEvents } from "@Composables/useEvents";

import { AdminEvents } from "../../shared/events";

import ItemTable from "../components/items/ItemTable.vue";
import ItemDetails from "../components/items/ItemDetails.vue";

const events = useEvents();
const items = ref<Item[]>([
    { id: 1, name: 'Hamburger', uid: 'food-burger', desc: 'Ein saftiger Rindfleisch Burger der einen gut Sättigt', icon: 'icon-hamburger', maxStack: 10, quantity: 1, weight: 0.25 }
]);
const search = ref<string>('');
const selectedItem = ref<Item | null>(null);
const defaultItem: Item = {
    uid: '', 
    desc: '', 
    icon: '', 
    maxStack: 1, 
    name: '', 
    weight: 0.0, 
    id: 0, 
    quantity: 1, 
    data: {}
};

async function refreshItems() {
    const result: Item[] = await events.emitServerRpc(AdminEvents.toServer.request.items);
    if (Array.isArray(result)) items.value = result;
}

const filteredItems = computed(() => {
    const s = search.value.toLowerCase();
    return items.value.filter((p) => p.name?.toLowerCase().includes(s) || String(p.id).includes(s));
});

function openItemDetails(item: Item) {
    selectedItem.value = item;
}

async function saveItem(item: Item) {
    const eventName = item.id === 0 ? AdminEvents.toServer.item.create : AdminEvents.toServer.item.save;
    events.emitServer(eventName, item);
    selectedItem.value = null;
    await refreshItems();
}

async function deleteItem(uid: string) {
    events.emitServer(AdminEvents.toServer.item.delete, uid);
    selectedItem.value = null;
    await refreshItems();
}

onMounted(async() => await refreshItems());
</script>

<template>
    <div class="h-full flex flex-col p-4 text-gray-100 bg-neutral-900/90 rounded-2xl shadow-lg">
        <!-- 🧩 Titel & Suche -->
        <div class="flex justify-between items-center mb-4">
            <h1 class="text-2xl font-semibold select-none">Gegenstandsverwaltung</h1>

            <div class="flex items-center gap-3">
                <input
                    v-model="search"
                    type="text"
                    placeholder="🔍 Spieler suchen..."
                    class="bg-neutral-800 text-gray-100 rounded-lg px-4 py-2 focus:ring-2 focus:ring-[#008736] focus:outline-none w-72"
                />

                <button
                    @click="selectedItem = defaultItem"
                    class="bg-[#008736]/90 hover:bg-[#008736] text-gray-100 px-5 py-3 rounded-lg transition-all flex items-center gap-2"
                >
                    <font-awesome-icon :icon="['fas', 'plus']" />
                </button>

                <button
                    @click="refreshItems"
                    class="bg-[#008736]/90 hover:bg-[#008736] text-gray-100 px-5 py-3 rounded-lg transition-all flex items-center gap-2"
                >
                    <font-awesome-icon :icon="['fas', 'rotate']" />
                </button>
            </div>
        </div>

        <!-- 📊 Spielertabelle -->
        <div class="flex-1 overflow-hidden ring ring-neutral-800 rounded-lg">
            <ItemTable :items="filteredItems" @selectItem="openItemDetails" />
        </div>

        <!-- 🧍 Detailmodal -->
        <ItemDetails v-if="selectedItem" :visible="selectedItem !== null" :item="selectedItem" @close="selectedItem = null" @delete="deleteItem" @edit="saveItem" />
    </div>
</template>

<style scoped>
/* Dezente Scrollbar für dunkle Themes */
::-webkit-scrollbar {
    width: 6px;
}
::-webkit-scrollbar-thumb {
    background: #333;
    border-radius: 3px;
}
::-webkit-scrollbar-thumb:hover {
    background: #555;
}
</style>