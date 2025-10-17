<script lang="ts" setup>
import { ref } from 'vue';
import { useTranslate } from '@Shared/translate';
import { AuthEvents } from '../../shared/authEvents';
import { useEvents } from '@Composables/useEvents';

const events = useEvents();
const { t } = useTranslate('de');

const email = ref('');
const password = ref('');
const confirmPassword = ref('');
const isLoading = ref(false);
const error = ref('');

function handleRegister() {
    if (!email.value || !password.value || !confirmPassword.value) {
        error.value = t('auth.error.missingFields');
        return;
    }

    if (password.value !== confirmPassword.value) {
        error.value = t('auth.error.passwordMismatch');
        return;
    }

    isLoading.value = true;
    error.value = '';

    events.emitServer(AuthEvents.toServer.register, email.value, password.value);
    setTimeout(() => isLoading.value = false, 1500);
}
</script>

<template>
    <div class="flex flex-col space-y-4 text-green-300">
        <div>
            <label class="block mb-1 text-xs uppercase tracking-widest text-green-400/70">
                {{ t('auth.email') }}
            </label>
            <input
                v-model="email"
                type="email"
                class="w-full px-3 py-2 rounded-md bg-black/40 border border-green-500/30 text-green-200 focus:outline-none focus:ring-2 focus:ring-green-400/60"
                placeholder="example@mail.com"
            />
        </div>

        <div>
            <label class="block mb-1 text-xs uppercase tracking-widest text-green-400/70">
                {{ t('auth.password') }}
            </label>
            <input
                v-model="password"
                type="password"
                class="w-full px-3 py-2 rounded-md bg-black/40 border border-green-500/30 text-green-200 focus:outline-none focus:ring-2 focus:ring-green-400/60"
                placeholder="********"
            />
        </div>

        <div>
            <label class="block mb-1 text-xs uppercase tracking-widest text-green-400/70">
                {{ t('auth.confirmPassword') }}
            </label>
            <input
                v-model="confirmPassword"
                type="password"
                class="w-full px-3 py-2 rounded-md bg-black/40 border border-green-500/30 text-green-200 focus:outline-none focus:ring-2 focus:ring-green-400/60"
                placeholder="********"
            />
        </div>

        <div>
            <button
                @click="handleRegister"
                class="w-full py-2 mt-4 text-black font-bold uppercase tracking-wider bg-green-400 hover:bg-green-500 rounded-md shadow-[0_0_20px_rgba(0,255,156,0.4)] transition-all duration-300"
            >
                {{ isLoading ? t('auth.loading') : t('auth.register.button') }}
            </button>
        </div>

        <transition name="fade">
            <p v-if="error" class="mt-3 text-sm text-red-400 text-center">{{ error }}</p>
        </transition>
    </div>
</template>

<style scoped>
.fade-enter-from,
.fade-leave-to {
    opacity: 0;
}
.fade-enter-to,
.fade-leave-from {
    opacity: 1;
}
</style>
