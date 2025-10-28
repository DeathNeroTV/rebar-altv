<script setup lang="ts">
import '../translate/index.js';
import { useTranslate } from "@Shared/translate.js";

const translation = useTranslate('de');
</script>

<template>
  <div class="relative flex items-center justify-center h-screen w-full overflow-hidden bg-[#0b0b0b] text-gray-100 font-sans">
    <!-- Hintergrund: taktische Linien & Glow -->
    <div class="absolute inset-0 bg-gradient-to-br from-[#0d0d0d] via-[#1a2d1a] to-[#003d1f]"></div>
    <div class="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,rgba(0,255,128,0.25),transparent_70%)] animate-pulse-slow"></div>

    <!-- Grid Overlay -->
    <div class="absolute inset-0 bg-[linear-gradient(transparent_98%,rgba(0,255,128,0.1)_99%),linear-gradient(90deg,transparent_98%,rgba(0,255,128,0.1)_99%)] bg-[size:40px_40px] opacity-10"></div>

    <!-- Hauptcontainer -->
    <div class="relative z-10 flex flex-col items-center text-center backdrop-blur-md bg-black/30 border border-green-500/30 rounded-2xl shadow-[0_0_20px_rgba(0,255,128,0.15)] p-10 max-w-lg mx-4 animate-fadein">
      <!-- Titel -->
      <h1 class="select-none text-2xl font-bold tracking-[0.25em] uppercase text-[#00ff88] drop-shadow-[0_0_12px_rgba(0,255,136,0.7)]">
        {{ translation.t("discord.auth.title") }}
      </h1>

      <!-- Untertitel -->
      <p class="select-none mt-3 text-lg text-gray-300 tracking-wide uppercase">
        {{ translation.t("discord.auth.subtile") }}
      </p>

      <!-- Separator Line -->
      <div class="select-none mt-6 h-[2px] w-24 bg-gradient-to-r from-transparent via-[#00ff88] to-transparent animate-pulse-slow"></div>

      <!-- Hinweisfeld -->
      <div
        class="select-none mt-10 flex items-center gap-3 bg-gradient-to-r from-[#003d1f]/60 to-[#007a43]/40 border border-green-400/40 text-green-300 px-5 py-3 rounded-xl shadow-lg transition-all duration-300 hover:scale-[1.03]"
        role="alert"
      >
        <svg
          class="w-6 h-6 text-green-300 flex-shrink-0 animate-pulse"
          fill="currentColor"
          viewBox="0 0 20 20"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            fill-rule="evenodd"
            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-3a1 1 0 100-2 1 1 0 000 2zm0 2a1 1 0 011 1v3a1 1 0 11-2 0v-3a1 1 0 011-1z"
            clip-rule="evenodd"
          />
        </svg>
        <span class="text-base font-medium tracking-wide uppercase">
          {{ translation.t("discord.auth.information") }}
        </span>
      </div>
    </div>

    <!-- Scanline-Effekt -->
    <div class="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.02)_50%,transparent_50%)] bg-[size:100%_2px] mix-blend-overlay opacity-5 animate-scanline"></div>
  </div>
</template>

<style scoped>
@keyframes fadein {
  from {
    opacity: 0;
    transform: translateY(10px) scale(0.98);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.animate-fadein {
  animation: fadein 0.8s ease-out forwards;
}

@keyframes pulse-slow {
  0%, 100% {
    opacity: 0.4;
  }
  50% {
    opacity: 0.8;
  }
}

.animate-pulse-slow {
  animation: pulse-slow 6s ease-in-out infinite;
}

@keyframes scanline {
  0% { background-position: 0 0; }
  100% { background-position: 0 100%; }
}

.animate-scanline {
  animation: scanline 10s linear infinite;
}
</style>
