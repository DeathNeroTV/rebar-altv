<script setup lang="ts">
import '../translate/index.js';
import { useTranslate } from "@Shared/translate.js";

const translation = useTranslate('de');
</script>

<template>
    <div class="relative flex items-center justify-center h-screen w-full overflow-hidden bg-gradient-to-br from-[#2d2d2d] via-[#2f3d33] to-[#008736]">
        <!-- Hintergrundeffekte -->
        <div class="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(0,135,54,0.25),transparent_70%)] animate-pulse-slow"></div>
        <div class="absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,rgba(37,99,235,0.15),transparent_70%)]"></div>

        <!-- Hauptcontainer -->
        <div class="z-10 flex flex-col items-center text-center backdrop-blur-md bg-neutral-900/40 border border-gray-800/60 shadow-2xl rounded-2xl p-10 max-w-lg mx-4 animate-fadein">
            <h1 class="select-none text-4xl font-bold tracking-wide text-[#008736] drop-shadow-[0_0_10px_rgba(0,135,54,0.7)]">
                {{ translation.t("discord.auth.title") }}
            </h1>

            <p class="mt-3 text-lg text-gray-200 drop-shadow-[0_0_4px_rgba(255,255,255,0.2)]">
                {{ translation.t("discord.auth.subtile") }}
            </p>

            <div class="select-none mt-8 flex items-center gap-3 bg-green-700/30 border border-green-500/40 text-green-200 px-5 py-3 rounded-xl shadow-lg transition-all duration-300 hover:scale-[1.02]" role="alert">
                <svg class="w-6 h-6 text-blue-300 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-3a1 1 0 100-2 1 1 0 000 2zm0 2a1 1 0 011 1v3a1 1 0 11-2 0v-3a1 1 0 011-1z" clip-rule="evenodd" />
                </svg>
                <span class="text-base font-medium">
                    {{ translation.t("discord.auth.information") }}
                </span>
            </div>
        </div>
    </div>
</template>

<style scoped>
@keyframes fadein {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fadein {
  animation: fadein 0.8s ease-out forwards;
}

@keyframes pulse-slow {
  0%, 100% {
    opacity: 0.3;
  }
  50% {
    opacity: 0.6;
  }
}

.animate-pulse-slow {
  animation: pulse-slow 6s ease-in-out infinite;
}
</style>
