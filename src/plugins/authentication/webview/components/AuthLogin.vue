<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useEvents } from '@Composables/useEvents';
import { useTranslate } from '@Shared/translate';
import { AuthEvents } from '@Plugins/authentication/shared/authEvents';

const events = useEvents();
const { t } = useTranslate('de');

const email = ref('');
const password = ref('');
const remember = ref(false);
const allValid = ref(false);
const isInvalid = ref(false);

function handleLogin() {
    isInvalid.value = false;
    if (!allValid) return;

    events.emitServer(AuthEvents.toServer.login, email.value, password.value, remember.value);
}

function checkForm() {
    // Verify email contents
    if (!/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/g.test(email.value)) {
        allValid.value = false;
        return;
    }

    // Check password length
    if (password.value.length < 6) {
        allValid.value = false;
        return;
    }

    allValid.value = true;
}

function handleInvalid() {
    isInvalid.value = true;
}

function init() {
    events.on(AuthEvents.fromServer.invalidLogin, handleInvalid);
}

onMounted(init);

</script>

<template>
    <form class="flex flex-col gap-5 w-full max-w-md" @submit.prevent="handleLogin">
        <div class="flex flex-col">
            <label class="text-sm font-semibold mb-1 text-gray-300">{{ t('auth.email') }}</label>
            <input
                v-model="email"
                type="email"
                :placeholder="t('auth.email')"
                @input="checkForm"
                class="bg-neutral-800/60 border border-green-700/50 rounded-lg p-3 text-gray-100
                       focus:border-green-400 focus:outline-none transition-all duration-300"
            />
        </div>

        <div class="flex flex-col">
            <label class="text-sm font-semibold mb-1 text-gray-300">{{ t('auth.password') }}</label>
            <input
                v-model="password"
                autocomplete="password"
                type="password"
                :placeholder="t('auth.password')"
                @input="checkForm"
                class="bg-neutral-800/60 border border-green-700/50 rounded-lg p-3 text-gray-100
                       focus:border-green-400 focus:outline-none transition-all duration-300"
            />
        </div>

        <div class="flex items-center gap-2">
            <input type="checkbox" v-model="remember" id="remember" class="accent-green-500">
            <label for="remember" class="text-gray-400 text-sm select-none">{{ t('auth.remember') }}</label>
        </div>

        <button
            type="submit"
            class="mt-3 py-3 bg-green-700/60 rounded-lg font-semibold text-white tracking-wide uppercase
                   border border-green-600 hover:bg-green-600 hover:shadow-[0_0_15px_rgba(0,255,136,0.4)]
                   transition-all duration-300"
        >
            <span>{{ t('auth.login.button') }}</span>
        </button>
    </form>
</template>
