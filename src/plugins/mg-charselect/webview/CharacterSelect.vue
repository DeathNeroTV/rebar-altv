<script lang="ts" setup>
import { ref } from 'vue';

import { Character } from '@Shared/types/character';
import { useTranslate } from '@Shared/translate';

import { CharacterSelectEvents } from '../shared/characterSelectEvents';

import '../translate/index';

import { useEvents } from '../../../../webview/composables/useEvents';

import CharacterUsername from './components/CharacterUsername.vue';
import Confirmation from './components/Confirmation.vue';
import CharacterCard from './components/CharacterCard.vue';
import WildCard from './components/WildCard.vue';

const { t } = useTranslate('de');

const events = useEvents();

const characters = ref<Partial<Character>[]>([
    { _id: '663914c4012562fe4e0e3b42', account_id: '6630561244ad1a217ae19d5f', name: 'Sony_Vegas' },
]);

const errorMessage = ref<string | undefined>();
const isReady = ref(false);
const isSelectingUsername = ref(false);
const isTrashing = ref(false);
const selectedIndex = ref(0);
const maxChars = ref<number>(2);
const timeout = ref<undefined | NodeJS.Timeout>(undefined);

function handlePopulateCharacters(_characters: Character[], _maxChars: number) {
    selectedIndex.value = 0;
    characters.value = _characters;
    maxChars.value = _maxChars;
    isReady.value = true;
    isSelectingUsername.value = false;

    const char = characters.value[selectedIndex.value];

    if (char && char._id) events.emitServer(CharacterSelectEvents.toServer.syncCharacter, char._id);
    else console.warn('CharacterSelect -> Kein gültiger Charakter beim populate vorhanden!');
}

function spawnCharacter() {
    const char = characters.value[selectedIndex.value];
    if (!char || !char._id) return;
    events.emitServer(CharacterSelectEvents.toServer.spawnCharacter, char._id);
}

function trashCharacter() {
    isTrashing.value = true;
}

function confirmTrashCharacter() {
    const char = characters.value[selectedIndex.value];
    if (!char || !char._id) return;
    isTrashing.value = false;
    events.emitServer(CharacterSelectEvents.toServer.trashCharacter, char._id);
}

function handleError(msg: string) {
    if (timeout.value) {
        clearInterval(timeout.value);
        timeout.value = undefined;
    }

    errorMessage.value = msg;
    timeout.value = setTimeout(() => {
        timeout.value = undefined;
        errorMessage.value = undefined;
    }, 5000);
}

function selectCharacter(index: number) {
    console.log('CharacterSelect -> index:', index, 'characters:', characters.value);
    const char = characters.value[index];
    if (!char || !char._id) {
        console.warn('CharacterSelect -> Ungültiger Charakter bei Auswahl:', index, char);
        return;
    }

    selectedIndex.value = index;
    events.emitServer(CharacterSelectEvents.toServer.syncCharacter, char._id);
};

events.on(CharacterSelectEvents.toClient.handleError, handleError);
events.on(CharacterSelectEvents.toClient.populateCharacters, handlePopulateCharacters);
</script>

<template>
    <div class="flex h-screen w-screen overflow-hidden">
        <!-- Notification -->
        <div
            class="animate-fadein fixed top-6 min-w-96 select-none gap-3 rounded-lg bg-red-400 bg-gradient-to-r from-red-500 p-3 text-center text-2xl font-bold text-white shadow-md"
            v-if="errorMessage"
        >
            {{ errorMessage }}
        </div>

        <!-- Select Username -->
        <CharacterUsername
            v-if="isSelectingUsername"
            :can-cancel="characters.length >= 1"
            @cancel="isSelectingUsername = false"
        />
        <Confirmation v-else-if="isTrashing" @confirm="confirmTrashCharacter" @cancel="isTrashing = false">
            {{ t('character.select.confirm.delete') }} {{ characters[selectedIndex].name }} ?
        </Confirmation>

        <template v-else-if="!isTrashing">        
            <div class="flex flex-col items-center gap-5 text-gray-100 p-5 rounded-lg bg-neutral-950/25">
                <h1
                    class="select-none text-3xl uppercase font-semibold tracking-wide text-[#008736] drop-shadow-[0_0_6px_rgba(0,135,54,0.8)]"
                >
                     {{ t('character.select.title') }}
                </h1>

                <transition-group
                    name="fade"
                    tag="div"
                    class="w-full h-full flex flex-col gap-4"
                    enter-active-class="transition transform duration-500"
                    leave-active-class="transition transform duration-300"
                >
                    <WildCard
                        v-if="characters.length < maxChars"
                        :key="'wildcard'"
                        :selected="isSelectingUsername"
                        @click="isSelectingUsername = true;"
                    />

                    <CharacterCard
                        v-for="(char, index) in characters"
                        :key="index"
                        :character="char"
                        :selected="selectedIndex === index"
                        @click="selectCharacter(index)"
                    >
                        <template #default>
                            <div class="flex flex-row gap-2">
                                <font-awesome-icon :icon="['fas', 'play']"
                                    class="w-5 h-5 rounded-md bg-green-700/50 p-2 text-white hover:bg-green-700"
                                    @click.stop="spawnCharacter"
                                />
                                <font-awesome-icon :icon="['fas', 'trash']"
                                    class="w-5 h-5 rounded-md bg-red-700/50 p-2 text-white hover:bg-red-700"
                                    @click.stop="trashCharacter"
                                />
                            </div>
                        </template>
                    </CharacterCard>
                </transition-group>

                <p
                    class="select-none uppercase text-sm text-gray-100 bg-neutral-950/25 backdrop-blur-md px-2 py-1 rounded-lg border-2 border-gray-100/25 font-bold"
                >
                    {{ characters.length }} / {{ maxChars }} Charakter(e)
                </p>
            </div>
        </template>
    </div>
</template>
