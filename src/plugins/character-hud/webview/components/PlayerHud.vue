<template>
    <div v-if="!data.isDead" class="w-fit h-fit flex flex-col gap-1 bg-neutral-950/25 text-white p-2 rounded-br-lg select-none pointer-events-none">
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
                        :class="{ 'bg-gray-100': i <= Math.ceil((props.data.armour ?? 0) / (100 / 12)) }"
                    ></div>
                </div>
            </div>

            <!-- Health Bar -->
            <div class="relative h-2 bg-neutral-950/25 backdrop-blur-sm">
                <div class="absolute top-0 left-0 h-full bg-green-700" :style="{ width: data.health + '%' }"></div>
            </div>
        </div>

        <!-- Main Stats Section -->
        <div class="w-fit flex flex-row gap-1 justify-between items-start overflow-hidden">

            <!-- Ammo & Weapon -->
            <div v-if="getWeapon" class="text-center flex flex-row justify-start items-center overflow-hidden">
                <div class="relative w-2 h-16 flex flex-col-reverse gap-[1px] bg-transparent mr-0.5">
                    <!-- Background Segments -->
                    <div v-for="i in 15" :key="'ammo-bg-' + i" class="flex-1 w-full bg-neutral-950/25 backdrop-blur-sm">
                        <div v-if="i <= Math.ceil(getWeapon.currentAmmo / getWeapon.totalAmmo * 15)" class="w-full h-full bg-[#008736]"></div>
                    </div>
                </div>

                <!-- Ammo Count -->
                <div class="w-16 h-16 flex flex-col text-center items-center p-2 overflow-hidden border-t border-r border-b backdrop-blur-sm">
                    <div class="font-inter-medium">{{ getWeapon.currentAmmo.toFixed(0).padStart(2, '0') }}</div>
                    <div class="text-gray-300 font-inter-regular">{{ getWeapon.totalAmmo.toFixed(0).padStart(2, '0') }}</div>
                </div>

                <!-- Weapon Image -->
                <img class="min-w-16 h-16 overflow-hidden border-t border-b backdrop-blur-sm" :src="`./images/${getWeapon.weaponName}.png`" alt="" />
            </div>

            <div v-else class="w-full text-center flex flex-row gap-1 justify-start items-center backdrop-blur-sm"></div>

            <!-- Icons & Time -->
            <div class="w-fit flex flex-col gap-1">
                <div class="flex text-center justify-end gap-0.5">
                    <div class="relative w-8 h-8 flex items-center justify-center backdrop-blur-sm border-t border-b">
                        <div class="absolute bottom-0 left-0 w-full h-full bg-transparent"></div>
                        <div class="relative flex flex-1 items-center place-content-center">{{ data.id }}</div>
                    </div>
                    <div class="relative w-8 h-8 flex items-center justify-center backdrop-blur-sm border-t border-b">
                        <div class="absolute bottom-0 left-0 w-full bg-green-700" :style="{ height: `${data.food}%` }"></div>
                        <div class="relative items-center place-content-center">
                            <font-awesome-icon :icon="['fas', 'utensils']" class="text-lg text-gray-100" />
                        </div>
                    </div>
                    <div class="relative w-8 h-8 flex items-center justify-center backdrop-blur-sm border-t border-b">
                        <div class="absolute bottom-0 left-0 w-full bg-green-700" :style="{ height: `${data.water}%` }"></div>
                        <div class="z-10 items-center place-content-center">
                            <font-awesome-icon :icon="['fas', 'tint']" class="text-lg text-gray-100" />
                        </div>
                    </div>
                </div>
                <div class="w-full h-7 border-t border-b text-center items-center backdrop-blur-sm flex flex-1 gap-1">
                    <font-awesome-icon :icon="['fas', 'clock']" class="text-lg text-gray-100" />
                    {{ actualTime }}
                </div>
            </div>
        </div>
    </div>
</template>

<script lang="ts" setup>
    import { Character } from '@Shared/types';
    import { ref, computed } from 'vue';
    import { getNameFromHash } from '../composables/weaponHashes';

    const props = defineProps<{ data: Partial<Character>; }>();

    const getWeapon = computed(() => {
        return props.data.weapon ? {
            weaponName: getNameFromHash(props.data.weapon.hash),
            currentAmmo: props.data.weapon.ammo,
            totalAmmo: props.data.weapon.totalAmmo
        } : {
            weaponName: 'weapon_unarmed',
            currentAmmo: 1,
            totalAmmo: 1
        };
    });

    const actualTime = ref<string>('');
    setInterval(() => (actualTime.value = `${new Date().toLocaleTimeString()}`), 100);
</script>
