<script setup lang="ts">
import { ref } from 'vue';
import { useTranslate } from '@Shared/translate';
const { t } = useTranslate('de');

const email = ref('');
const password = ref('');
const remember = ref(false);
const isLoading = ref(false);

function handleLogin() {
    if (!email.value || !password.value) {
        alert(t('auth.error.missingFields'));
        return;
    }
    isLoading.value = true;
    setTimeout(() => (isLoading.value = false), 1500); // Placeholder
}
</script>

<template>
    <form class="flex flex-col gap-5 w-full max-w-md" @submit.prevent="handleLogin">
        <div class="flex flex-col">
            <label class="text-sm font-semibold mb-1 text-gray-300">{{ t('auth.email') }}</label>
            <input
                v-model="email"
                type="email"
                :placeholder="t('auth.email')"
                class="bg-neutral-800/60 border border-green-700/50 rounded-lg p-3 text-gray-100
                       focus:border-green-400 focus:outline-none transition-all duration-300"
            />
        </div>

        <div class="flex flex-col">
            <label class="text-sm font-semibold mb-1 text-gray-300">{{ t('auth.password') }}</label>
            <input
                v-model="password"
                type="password"
                :placeholder="t('auth.password')"
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
            <span v-if="!isLoading">{{ t('auth.login.button') }}</span>
            <span v-else>{{ t('auth.loading') }}</span>
        </button>
    </form>
</template>
