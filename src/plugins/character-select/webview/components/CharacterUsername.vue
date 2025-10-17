<script lang="ts" setup>
import { ref } from 'vue';
import { CharacterSelectEvents } from '../../shared/characterSelectEvents';
import { CharacterSelectConfig } from '../../shared/config';
import { useEvents } from '../../../../../webview/composables/useEvents';
import { useTranslate } from '@Shared/translate';

// Import translations
const { t } = useTranslate('de');

const events = useEvents();
const first = ref('');
const last = ref('');
const allValid = ref(false);
const usernameError = ref<undefined | string>('');
const props = defineProps<{ canCancel: boolean }>();
const emits = defineEmits<{ (e: 'cancel'): void }>();

let firstError = ref<undefined | string>('');
let lastError = ref<undefined | string>('');

function validate() {
    allValid.value = false;
    usernameError.value = undefined;
    firstError.value = undefined;
    lastError.value = undefined;

    if (first.value.length < CharacterSelectConfig.minLength) {
        firstError.value = `Gebe mindestens ${CharacterSelectConfig.minLength} Satzzeichen an`;
        return;
    }

    if (first.value.length > CharacterSelectConfig.maxLength) {
        firstError.value = `Gebe maximal ${CharacterSelectConfig.maxLength} Satzzeichen an`;
        return;
    }

    if (!/[\p{Letter}\p{Mark}]+/gu.test(first.value)) {
        firstError.value = `Sonderzeichen & Zahlen sind nicht erlaubt`;
        return;
    }

    if (CharacterSelectConfig.askForLastName) {
        if (last.value.length < CharacterSelectConfig.minLength) {
            lastError.value = `Gebe mindestens ${CharacterSelectConfig.minLength} Satzzeichen an`;
            return;
        }

        if (last.value.length > CharacterSelectConfig.maxLength) {
            lastError.value = `Gebe maximal ${CharacterSelectConfig.maxLength} Satzzeichen an`;
            return;
        }

        if (!/[\p{Letter}\p{Mark}]+/gu.test(last.value)) {
            lastError.value = `Sonderzeichen & Zahlen sind nicht erlaubt`;
            return;
        }
    }

    allValid.value = true;
}

function create() {
    if (!allValid.value) return;
    events.emitServer(CharacterSelectEvents.toServer.submitUsername, first.value, last.value);
}
</script>

<template>
    <div class="flex h-screen w-screen items-center justify-center overflow-hidden text-neutral-950">
        <div class="w-1/4 rounded-md bg-neutral-950/25 border-2 border-gray-100/25 p-3 shadow-lg">
            <div class="flex flex-col gap-4 text-gray-100">
                <span class="text-lg font-medium">{{ t('character.select.first') }}</span>
                <span class="py-6 font-medium text-red-400" v-if="usernameError">{{ usernameError }}</span>
                <input
                    v-model="first"
                    :placeholder="t('character.select.first')"
                    type="text"
                    @input="validate"
                    class="rounded-lg border-2 border-gray-100/25 bg-neutral-950/50 px-4 py-4 outline-none placeholder:text-neutral-400 focus:border-opacity-50"
                />
                <span class="rounded-md bg-red-400 px-4 py-2 font-medium" v-if="firstError">{{ firstError }}</span>
                <span class="text-lg font-medium">{{ t('character.select.last') }}</span>
                <input
                    v-model="last"
                    :placeholder="t('character.select.last')"
                    type="text"
                    @input="validate"
                    v-if="CharacterSelectConfig.askForLastName"
                    class="rounded-md border-2 border-gray-100/25 bg-neutral-950/50 px-4 py-4 outline-none placeholder:text-neutral-400 focus:border-opacity-50"
                />
                <span class="rounded-md bg-red-400 px-4 py-2 font-medium" v-if="lastError">{{ lastError }}</span>
                <div class="flex flex-row gap-3">
                    <button
                        class="h-10 w-full rounded-md bg-white/25 px-6 text-center font-medium text-white shadow-md hover:bg-red-700 hover:bg-gradient-to-r hover:from-red-500 active:scale-95"
                        @click="emits('cancel')"
                        v-if="props.canCancel"
                    >
                        {{ t('character.select.cancel') }}
                    </button>
                    <button
                        class="h-10 w-full rounded-md bg-gray-100/25 px-6 text-center font-medium text-white shadow-md hover:bg-green-500 hover:bg-gradient-to-r hover:from-green-700 active:scale-95"
                        @click="allValid ? create() : () => {}"
                        v-if="allValid"
                    >
                        {{ t('character.select.submit') }}
                    </button>
                    <button
                        v-else
                        class="h-10 w-full rounded-md bg-gray-100/25 px-6 text-center shadow-md hover:cursor-default"
                    >
                        {{ t('character.select.submit') }}
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>