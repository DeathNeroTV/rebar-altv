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
    <div class="relative flex items-center justify-center w-screen h-screen overflow-hidden text-gray-100 bg-neutral-950">

        <!-- Hintergrund -->
        <div class="absolute inset-0 bg-gradient-to-br from-black via-neutral-900 to-green-950 opacity-90"></div>
        <div class="absolute inset-0 bg-[url('/assets/grid.svg')] opacity-10 animate-pulse"></div>

        <!-- Main Auth Container -->
        <div
            class="relative z-10 flex flex-col items-center justify-center w-2/3 max-w-4xl p-10 rounded-2xl
                   bg-neutral-900/40 border border-green-700/40 backdrop-blur-md shadow-[0_0_30px_rgba(0,255,120,0.2)] transition-all duration-700"
        >
            <h1 class="mb-6 text-4xl font-bold tracking-widest text-[#00ff88] drop-shadow-[0_0_6px_rgba(0,255,136,0.6)]">
                {{ showLogin ? t('auth.login.title') : t('auth.register.title') }}
            </h1>

            <transition name="fade" mode="out-in">
                <component :is="showLogin ? AuthLogin : AuthRegister" class="w-full" />
            </transition>

            <div class="mt-6 text-sm text-center">
                <span
                    @click="showLogin = !showLogin"
                    class="cursor-pointer text-green-400 hover:text-green-300 transition-all duration-300 hover:underline"
                >
                    {{ showLogin ? t('auth.span.new.user') : t('auth.span.existing.user') }}
                </span>
            </div>

            <div class="mt-4 text-xs text-neutral-400">
                {{ t('auth.footer.version') }} 1.0.0
            </div>
        </div>
    </div>
</template>

<style scoped>
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.5s ease, transform 0.5s ease;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
  transform: translateY(10px);
}
</style>
