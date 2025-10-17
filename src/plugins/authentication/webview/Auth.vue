<script lang="ts" setup>
import '../translate/index';
import { ref } from 'vue';
import AuthLogin from './components/AuthLogin.vue';
import AuthRegister from './components/AuthRegister.vue';
import { useTranslate } from '@Shared/translate';

const { t } = useTranslate('de');
const showLogin = ref(true);
</script>

<template>
    <div
        class="relative flex items-center justify-center w-screen h-screen bg-gradient-to-br from-neutral-900 via-neutral-950 to-neutral-800 overflow-hidden"
    >
        <!-- Dekorative Linien (Division-Style) -->
        <div
            class="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(circle_at_center,rgba(0,255,156,0.1)_0%,transparent_70%)]"
        ></div>
        <div class="absolute w-full h-px bg-green-600/40 top-1/3"></div>
        <div class="absolute h-full w-px bg-green-600/40 left-1/3"></div>

        <!-- Auth Box -->
        <div
            class="relative z-10 backdrop-blur-md bg-neutral-900/60 border border-green-600/30 rounded-2xl shadow-[0_0_30px_rgba(0,255,156,0.2)] p-12 w-[450px] transition-all duration-500"
        >
            <h1
                class="text-2xl font-extrabold text-green-400 tracking-widest text-center mb-6 select-none"
            >
                Trial Life Roleplay
            </h1>

            <!-- Login / Register Switch -->
            <div class="flex justify-center mb-6">
                <button
                    class="px-4 py-2 text-sm font-semibold uppercase transition-colors duration-300 rounded-md"
                    :class="showLogin ? 'text-green-400 border-b-2 border-green-500' : 'text-gray-400 hover:text-green-300'"
                    @click="showLogin = true"
                >
                    {{ t('auth.login.title') }}
                </button>
                <button
                    class="px-4 py-2 ml-4 text-sm font-semibold uppercase transition-colors duration-300 rounded-md"
                    :class="!showLogin ? 'text-green-400 border-b-2 border-green-500' : 'text-gray-400 hover:text-green-300'"
                    @click="showLogin = false"
                >
                    {{ t('auth.register.title') }}
                </button>
            </div>

            <!-- Animated Form Switch -->
            <transition
                name="fade"
                mode="out-in"
                enter-active-class="transition-opacity duration-500 ease-out"
                leave-active-class="transition-opacity duration-300 ease-in"
            >
                <div key="show-login">
                    <AuthLogin v-if="showLogin" />
                    <AuthRegister v-else />
                </div>
            </transition>

            <!-- Footer -->
            <div class="mt-8 text-xs text-center text-gray-500 uppercase tracking-wider select-none">
                <span>{{ t('auth.footer.version') }} 1.0.0</span>
            </div>
        </div>
    </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;600;800&display=swap');

* {
    font-family: 'Orbitron', sans-serif;
}

.fade-enter-from,
.fade-leave-to {
    opacity: 0;
}

.fade-enter-to,
.fade-leave-from {
    opacity: 1;
}

/* Neon Pulse Effekt */
button.text-green-400 {
    text-shadow: 0 0 10px rgba(0, 255, 156, 0.6);
}

button:hover {
    text-shadow: 0 0 20px rgba(0, 255, 156, 0.8);
}

/* Eingabefelder im The Division-Stil */
input {
    background-color: rgba(0, 0, 0, 0.4);
    border: 1px solid rgba(0, 255, 156, 0.3);
    color: #d1fae5;
    transition: all 0.3s ease;
}

input:focus {
    outline: none;
    border-color: rgba(0, 255, 156, 0.8);
    box-shadow: 0 0 10px rgba(0, 255, 156, 0.4);
}
</style>
