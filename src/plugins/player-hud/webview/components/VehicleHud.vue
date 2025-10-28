<script setup lang="ts">
import { Vehicle } from '@Shared/types';

defineProps<{ data: Partial<Vehicle>; isVisible: boolean }>();
</script>

<template>
    <div v-if="isVisible" class="fixed bottom-0 right-0 w-[250px] h-fit flex flex-col gap-1 bg-neutral-950/25 text-white p-2 rounded-tl-lg select-none pointer-events-none">
        <!-- Horizontal Armor and Health Bars -->
        <div class="w-full h-full flex flex-col gap-1">

            <!-- Armor Bar (One Row, 3 Main Segments, 4 Sub-Segments Each) -->
            <div class="relative flex w-full h-3 gap-2">
                <!-- 3 Main Segments -->
                <div v-for="segment in 3" :key="'armor-main-segment-' + segment" class="relative flex-1 flex gap-0.5 h-full backdrop-blur-sm">
                    <!-- Background Sub-Segments -->
                    <div v-for="subSegment in 4" :key="'armor-bg-' + segment + '-' + subSegment" class="flex-1 h-full bg-neutral-950/25"></div>
                </div>

                <!-- Foreground Sub-Segments (linear fill over 12 segments) -->
                <div class="absolute top-0 left-0 flex h-full w-full gap-0.5">
                    <div
                        v-for="i in 12"
                        :key="'armor-fg-linear-' + i"
                        class="flex-1 h-full"
                        :class="{ 'bg-gray-100': i <= Math.ceil((data.speed / data.maxSpeed) / 12) }"
                    ></div>
                </div>
            </div>

            <!-- Health Bar -->
            <div class="relative h-2 bg-neutral-950/25 backdrop-blur-sm">
                <div class="absolute top-0 left-0 h-full bg-green-700" :style="{ width: data.fuel + '%' }"></div>
            </div>
        </div>

        <!-- Main Stats Section -->
        <div class="w-full flex flex-row gap-1 justify-between items-start overflow-hidden">

            <!-- Icons & Time -->
            <div class="w-full flex flex-col gap-1">
                <div class="flex flex-row justify-between gap-0.5">
                    <div class="w-full h-8 flex items-center backdrop-blur-sm border-t border-b">
                        <div class="flex flex-1 gap-2 w-full bg-transparent text-center items-center">
                            <font-awesome-icon :icon="['fas', 'tachometer-alt']" class="ml-1 text-lg text-gray-100" />
                            <span class="w-full">{{ data.rpm.toFixed(0) }}</span>
                        </div>
                    </div>
                    <div class="w-full h-8 flex items-center justify-center backdrop-blur-sm border-t border-b">
                        <div class="flex flex-1 gap-2 w-full bg-transparent text-center items-center">
                            <font-awesome-icon :icon="['fas', 'gear']" class="ml-1 text-lg text-gray-100" />
                            <span class="w-full">{{ data.gear.toFixed(0) }}</span>
                        </div>
                    </div>
                    <div class="min-w-8 h-8 flex items-center justify-center backdrop-blur-sm border-t border-b">
                        <div class="absolute bottom-0 left-0 w-full h-full" :class="data.stateProps.engineOn ? 'bg-[#008736]' : 'bg-transparent'"></div>
                        <div class="relative items-center place-content-center">
                            <font-awesome-icon :icon="['fas', 'car-battery']" class="text-lg text-gray-100" />
                        </div>
                    </div>
                    <div class="min-w-8 h-8 flex items-center justify-center backdrop-blur-sm border-t border-b">
                        <div class="absolute bottom-0 left-0 w-full h-full" :class="data.stateProps.lightState !== 0 ? 'bg-[#008736]' : 'bg-transparent'"></div>
                        <div class="z-10 items-center place-content-center">
                            <font-awesome-icon :icon="['fas', 'lightbulb']" class="text-lg text-gray-100" />
                        </div>
                    </div>
                </div>
                <div class="flex flex-1 gap-2 w-full h-7 border-t border-b items-center justify-center backdrop-blur-sm">
                    <font-awesome-icon :icon="['fas', 'dashboard']" class="text-lg text-gray-100" />
                    <div class="text-center">{{ data.speed }} KM/H</div>
                </div>
            </div>
        </div>
    </div>
</template>
