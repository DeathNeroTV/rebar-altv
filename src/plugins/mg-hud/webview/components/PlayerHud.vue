<template>
    <div v-if="!data.isDead" class="w-fit h-fit flex flex-col gap-1 bg-neutral-950/25 text-gray-100 p-2 rounded-br-lg select-none text-center">
        <!-- Horizontal Armor and Health Bars -->
        <div class="w-full h-full flex flex-col gap-1">
        
            <!-- Armor Bar (One Row, 3 Main Segments, 4 Sub-Segments Each) -->
            <div class="relative flex w-full h-3 gap-2">
                <!-- 3 Main Segments -->
                <div v-for="segment in 3" :key="'armor-main-segment-' + segment" class="relative flex-1 flex gap-0.5 h-full">
                    <!-- Background Sub-Segments -->
                    <div v-for="subSegment in 4" :key="'armor-bg-' + segment + '-' + subSegment" class="flex-1 h-full bg-neutral-950/25"></div>
                </div>

                <!-- Foreground Sub-Segments (linear fill over 12 segments) -->
                <div class="absolute top-0 left-0 flex h-full w-full gap-0.5">
                    <div
                        v-for="i in 12"
                        :key="'armor-fg-linear-' + i"
                        class="flex-1 h-full"
                        :class="{ 'bg-gray-100': i <= Math.ceil((data.armour) / (100 / 12)) }"
                    ></div>
                </div>
            </div>

            <!-- Health Bar -->
            <div class="relative h-2 bg-neutral-950/25">
                <div class="absolute top-0 left-0 h-full bg-green-700" :style="{ width: Math.max(0, data.health - 100) + '%' }"></div>
            </div>
        </div>

        <!-- Main Stats Section -->
        <div class="w-full flex flex-row gap-1 justify-between items-start overflow-hidden">

            <!-- Ammo & Weapon -->
            <div class="text-center flex flex-row justify-start items-center overflow-hidden">
                <div class="relative w-2 h-16 flex flex-col-reverse gap-[1px] bg-transparent mr-0.5">
                    <!-- Background Segments -->
                    <div v-for="i in 15" :key="'ammo-bg-' + i" class="flex-1 w-full bg-neutral-950/25">
                        <div v-if="i <= Math.ceil(getWeapon.currentAmmo / getWeapon.totalAmmo * 15)" class="w-full h-full bg-[#008736]"></div>
                    </div>
                </div>

                <!-- Ammo Count -->
                <div class="w-16 h-16 flex flex-col text-center items-center p-2 overflow-hidden border-t border-r border-b">
                    <div class="font-inter-medium">{{ getWeapon.currentAmmo.toFixed(0).padStart(2, '0') }}</div>
                    <div class="text-gray-300 font-inter-regular">{{ getWeapon.totalAmmo.toFixed(0).padStart(2, '0') }}</div>
                </div>

                <!-- Weapon Image -->
                <img class="min-w-16 h-16 overflow-hidden border-t border-b" :src="`./images/${getWeapon.weaponName}.png`" alt="" />
            </div>

            <!-- Icons & Time -->
            <div class="w-fit flex flex-col gap-1.5">
                <div class="flex text-center justify-end gap-1">
                    <div class="relative w-8 h-8 flex items-center justify-center border-t border-b">
                        <div class="absolute bottom-0 left-0 w-full h-full bg-transparent"></div>
                        <div class="relative flex flex-1 items-center place-content-center">{{ data.id }}</div>
                    </div>
                    <div class="relative w-8 h-8 flex items-center justify-center border-t border-b">
                        <div class="absolute bottom-0 left-0 w-full bg-green-700" :style="{ height: `${data.food}%` }"></div>
                        <div class="relative items-center place-content-center">
                            <font-awesome-icon :icon="['fas', 'utensils']" class="text-lg text-gray-100" />
                        </div>
                    </div>
                    <div class="relative w-8 h-8 flex items-center justify-center border-t border-b">
                        <div class="absolute bottom-0 left-0 w-full bg-green-700" :style="{ height: `${data.water}%` }"></div>
                        <div class="z-10 items-center place-content-center">
                            <font-awesome-icon :icon="['fas', 'tint']" class="text-lg text-gray-100" />
                        </div>
                    </div>
                </div>
                <div class="w-full h-7 px-1 border-t border-b text-center items-center justify-between flex flex-1 gap-1">
                    <font-awesome-icon :icon="['fas', 'clock']" class="text-lg text-gray-100" />
                    <span class="w-full">{{ actualTime }}</span>
                </div>
            </div>
        </div>

        <!-- Logout Section -->
        <div class="flex flex-1 gap-2 text-center items-center justify-between w-full">
            <span class="w-full px-2 py-1">F2 - {{ t('hud.toggle.mouse') }}</span>
            <font-awesome-icon 
                :icon="['fas', 'power-off']" 
                class="text-md text-gray-100 bg-transparent hover:bg-red-500/70 transition-all duration-500 rounded-full cursor-pointer p-2" 
                @click="relog" 
            />
        </div>
    </div>
</template>

<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue';
import { useEvents } from '@Composables/useEvents';
import { HudEvents } from '@Plugins/mg-hud/shared/events';
import { Character } from '@Shared/types';
import { useTranslate } from '@Shared/translate';
import { CharacterSelectEvents } from '@Plugins/mg-charselect/shared/characterSelectEvents';
import { getNameFromHash } from '../composables/weaponHashes';

const events = useEvents();
const { t } = useTranslate('de');

const data = ref<Partial<Character>>({
    id: 1,
    health: 0,
    armour: 0,
    food: 0,
    water: 0,
    voiceRange: 0,
    isDead: false,
});

let actualTime = ref<String>('00:00');

const getWeapon = computed(() => {
    return data.value.weapon ? {
        weaponName: getNameFromHash(data.value.weapon.hash),
        currentAmmo: data.value.weapon.ammo,
        totalAmmo: data.value.weapon.totalAmmo
    } : {
        weaponName: 'weapon_unarmed',
        currentAmmo: 1,
        totalAmmo: 1
    };
});

const relog = () => events.emitServer(CharacterSelectEvents.toServer.logoutCharacter);

onMounted(async () => {  
    const id = await events.emitServerRpc(HudEvents.toServer.fetchId);
    data.value.id = id ?? 0;
    
    events.on(HudEvents.toWebview.syncTime, (hour: number, minute: number, second: number) => {
        const formattedHour = hour.toString().padStart(2, '0');
        const formattedMinute = minute.toString().padStart(2, '0');
        actualTime.value = `${formattedHour}:${formattedMinute}`;
    });
    events.on(HudEvents.toWebview.updatePlayer, (payload: { key: string, value: any }) => data.value[payload.key] = payload.value);
});
</script>
