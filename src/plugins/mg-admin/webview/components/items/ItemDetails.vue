<script lang="ts" setup>
import { ref, watch } from 'vue';
import { Item } from '@Shared/types/items';

const props = defineProps<{ 
    item: Partial<Item> | null; 
    visible: boolean; 
}>();

const emits = defineEmits<{
    (e: 'close'): void;
    (e: 'save', item: Partial<Item>): void;
    (e: 'delete', id: number): void;
}>();

const localItem = ref<Partial<Item>>({});
const show = ref<boolean>(props.visible);
const editing = ref<boolean>(false);

watch(() => props.item, (val) => {
    localItem.value = JSON.parse(JSON.stringify(val || {}));
});
watch(() => props.visible, (val) => (show.value = val));

function saveChanges() {
    emits('save', localItem.value);
    editing.value = false;
}

// --- 🔹 DATA-FUNKTIONEN (Key-Value-Paare) ---
function addDataField() {
    if (!localItem.value.data) localItem.value.data = {};
    localItem.value.data[''] = '';
}

function removeDataField(key: string) {
    if (!localItem.value.data) return;
    delete localItem.value.data[key];
}
</script>

<template>
    <div v-if="show" class="fixed inset-0 bg-neutral-950/90 flex items-center justify-center z-50 select-none">
        <div class="bg-neutral-900 rounded-2xl shadow-2xl w-[42vw] max-h-[90vh] border-2 border-[#008736]/40 p-6 text-gray-200 flex flex-col transition-all duration-500 overflow-y-auto">

            <!-- HEADER -->
            <div class="flex items-center justify-between mb-3">
                <div>
                    <h2 class="text-3xl font-semibold text-[#008736]">
                        {{ localItem.name || 'Neuer Gegenstand' }}
                    </h2>
                    <div class="w-full h-full flex flex-row gap-2 items-center text-center mt-2 ml-2">
                        <p class="text-neutral-500 text-sm">ID: {{ localItem.id }}</p>
                        <template v-if="editing">
                            <label class="text-neutral-500 text-sm">UID: </label>
                            <input 
                                v-model="localItem.uid"
                                type="text"
                                class="w-full h-5 text-sm bg-neutral-900 border border-[#008736]/40 rounded-lg p-2 focus:ring-2 focus:ring-[#008736]"
                            />
                        </template>
                        <p v-else class="text-neutral-500 text-sm">UID: {{ localItem.uid }}</p>
                    </div>
                </div>

                <div class="flex flex-row gap-4 items-center">
                    <font-awesome-icon
                        :icon="['fas', editing ? 'floppy-disk' : 'pencil']"
                        @click="editing ? saveChanges() : (editing = true)"
                        class="text-neutral-600 hover:text-emerald-400 transition text-2xl cursor-pointer"
                    />
                    <font-awesome-icon
                        :icon="['fas', 'trash']"
                        @click="emits('delete', Number(localItem.id))"
                        class="text-neutral-600 hover:text-orange-500 transition text-2xl cursor-pointer"
                    />
                    <div class="w-0.5 h-8 bg-neutral-600 rounded-full"></div>
                    <font-awesome-icon
                        :icon="['fas', 'xmark']"
                        @click="emits('close')"
                        class="text-neutral-600 hover:text-red-500 transition text-2xl cursor-pointer"
                    />
                </div>
            </div>

            <!-- BODY -->
            <div class="grid grid-cols-2 gap-4 mt-3">
                <!-- Name -->
                <div class="bg-neutral-800 p-3 rounded-lg">
                    <label class="text-gray-400 text-sm">Name</label>
                    <input 
                        v-if="editing"
                        v-model="localItem.name"
                        type="text"
                        class="w-full mt-1 bg-neutral-900 border border-[#008736]/40 rounded-lg p-2 focus:ring-2 focus:ring-[#008736]"
                    />
                    <p v-else class="text-lg font-medium mt-1">{{ localItem.name || '—' }}</p>
                </div>

                <!-- Menge -->
                <div class="bg-neutral-800 p-3 rounded-lg">
                    <label class="text-gray-400 text-sm">Menge</label>
                    <input 
                        v-if="editing"
                        v-model.number="localItem.quantity"
                        type="number"
                        class="w-full mt-1 bg-neutral-900 border border-[#008736]/40 rounded-lg p-2 focus:ring-2 focus:ring-[#008736]"
                    />
                    <p v-else class="text-lg font-medium mt-1">{{ localItem.quantity }}</p>
                </div>

                <!-- MaxStack -->
                <div class="bg-neutral-800 p-3 rounded-lg">
                    <label class="text-gray-400 text-sm">Max Stack</label>
                    <input 
                        v-if="editing"
                        v-model.number="localItem.maxStack"
                        type="number"
                        class="w-full mt-1 bg-neutral-900 border border-[#008736]/40 rounded-lg p-2 focus:ring-2 focus:ring-[#008736]"
                    />
                    <p v-else class="text-lg font-medium mt-1">{{ localItem.maxStack }}</p>
                </div>

                <!-- Gewicht -->
                <div class="bg-neutral-800 p-3 rounded-lg">
                    <label class="text-gray-400 text-sm">Gewicht</label>
                    <input 
                        v-if="editing"
                        v-model.number="localItem.weight"
                        type="number"
                        step="0.01"
                        class="w-full mt-1 bg-neutral-900 border border-[#008736]/40 rounded-lg p-2 focus:ring-2 focus:ring-[#008736]"
                    />
                    <p v-else class="text-lg font-medium mt-1">{{ localItem.weight?.toFixed(2) }}</p>
                </div>

                <!-- Icon -->
                <div class="bg-neutral-800 p-3 rounded-lg col-span-2">
                    <label class="text-gray-400 text-sm">Icon</label>
                    <input 
                        v-if="editing"
                        v-model="localItem.icon"
                        type="text"
                        class="w-full mt-1 bg-neutral-900 border border-[#008736]/40 rounded-lg p-2 focus:ring-2 focus:ring-[#008736]"
                    />
                    <p v-else class="text-lg font-medium mt-1">{{ localItem.icon || '—' }}</p>
                </div>

                <!-- Beschreibung -->
                <div class="bg-neutral-800 p-3 rounded-lg col-span-2">
                    <label class="text-gray-400 text-sm">Beschreibung</label>
                    <textarea
                        v-if="editing"
                        v-model="localItem.desc"
                        rows="3"
                        class="w-full mt-1 bg-neutral-900 border border-[#008736]/40 rounded-lg p-2 resize-none focus:ring-2 focus:ring-[#008736]"
                    ></textarea>
                    <p v-else class="text-md font-medium mt-1">{{ localItem.desc || '—' }}</p>
                </div>

                <!-- DATA -->
                <div class="bg-neutral-800 p-3 rounded-lg col-span-2">
                    <div class="flex justify-between items-center mb-2">
                        <label class="text-gray-400 text-sm">Daten (Key → Value)</label>
                        <button
                            v-if="editing"
                            @click="addDataField"
                            class="text-[#008736] bg-neutral-900 hover:text-gray-100 hover:bg-[#008736] px-2 py-1 rounded-full text-sm transition"
                        >
                            + Feld hinzufügen
                        </button>
                    </div>

                    <template v-if="editing">
                        <div v-for="(value, key) in localItem.data" :key="key" class="flex gap-2 items-center mb-2">
                            <input
                                :value="key"
                                 @change="(e: Event) => {
                                    const newKey = (e.target as HTMLInputElement).value;
                                    if (newKey !== key) {
                                        localItem.data[newKey] = localItem.data[key];
                                        delete localItem.data[key];
                                    }
                                }"
                                placeholder="Schlüssel"
                                class="bg-neutral-900 border border-[#008736]/40 rounded-lg p-2 w-1/3 focus:ring-2 focus:ring-[#008736]"
                            />
                            <input
                                v-model="localItem.data[key]"
                                placeholder="Wert"
                                class="bg-neutral-900 border border-[#008736]/40 rounded-lg p-2 flex-1 focus:ring-2 focus:ring-[#008736]"
                            />
                            <font-awesome-icon
                                :icon="['fas', 'trash']"
                                @click="removeDataField(key as string)"
                                class="text-neutral-500 hover:text-red-500 cursor-pointer text-lg"
                            />
                        </div>
                    </template>

                    <template v-else>
                        <div v-for="(value, key) in localItem.data" :key="key" class="flex gap-2 items-center mb-2">
                            <p class="bg-neutral-900 rounded-lg p-2 w-1/3 focus:ring-2 focus:ring-[#008736]">
                                {{ key }}
                            </p>
                            <p class="bg-neutral-900 rounded-lg p-2 w-2/3 focus:ring-2 focus:ring-[#008736]">
                                {{ value }}
                            </p>
                        </div>
                    </template>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
::-webkit-scrollbar { width: 6px; }
::-webkit-scrollbar-thumb { background-color: #008736; border-radius: 4px; }
</style>
