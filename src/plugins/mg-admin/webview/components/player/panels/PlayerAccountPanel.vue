<script setup lang="ts">
	import { computed, ref, watch } from 'vue';
	import { Account } from '@Shared/types';
	import DropDown from '../../DropDown.vue';
	import { AdminConfig } from '@Plugins/mg-admin/shared/config';

	const props = defineProps<{
		account: Account | null;
		visible: boolean;
	}>();

	const emits = defineEmits<{
		(e: 'close'): void;
		(e: 'save', account: Account): void;
		(e: 'delete', _id: string): void;
		(e: 'unban', _id: string): void;
		(e: 'ban', _id: string, state: boolean, reason: string, time: number): void;
	}>();

	const show = ref(props.visible);

	// Local switch state – folgt account.banned
	const bannedState = ref<boolean>(props.account?.banned ?? false);
	const bannedReason = ref<string>(props.account?.reason ?? '');
	const bannedTime = ref<number>(props.account?.time ?? 0);

	const banTimes = computed(() => [
		{ label: '10 Minuten', value: Date.now() + 10 * 60 * 1000 },
		{ label: '30 Minuten', value: Date.now() + 30 * 60 * 1000 },
		{ label: '1 Stunde', value: Date.now() + 60 * 60 * 1000 },
		{ label: '3 Stunden', value: Date.now() + 3 * 60 * 60 * 1000 },
		{ label: '6 Stunden', value: Date.now() + 6 * 60 * 60 * 1000 },
		{ label: '12 Stunden', value: Date.now() + 12 * 60 * 60 * 1000 },
		{ label: '1 Tag', value: Date.now() + 24 * 60 * 60 * 1000 },
		{ label: '3 Tage', value: Date.now() + 3 * 24 * 60 * 60 * 1000 },
		{ label: '1 Woche', value: Date.now() + 7 * 24 * 60 * 60 * 1000 },
		{ label: '2 Wochen', value: Date.now() + 14 * 24 * 60 * 60 * 1000 },
		{ label: '1 Monat', value: Date.now() + 30 * 24 * 60 * 60 * 1000 },
		{ label: '3 Monate', value: Date.now() + 90 * 24 * 60 * 60 * 1000 },
		{ label: '6 Monate', value: Date.now() + 180 * 24 * 60 * 60 * 1000 },
		{ label: '1 Jahr', value: Date.now() + 365 * 24 * 60 * 60 * 1000 },
		{ label: 'Permanent', value: Date.now() + 100 * 365 * 24 * 60 * 60 * 1000 },
	]);

	// Sync toggle-UI mit neuen Daten
	watch(
		() => props.account,
		(acc) => {
			if (!acc) return;

			// Nur setzen, wenn die Sidebar neu geöffnet wird
			if (!show.value) return;

			bannedState.value = acc.banned;
			bannedReason.value = acc.reason ?? '';
			bannedTime.value = acc.time ?? 0;
		}
	);

	// Sichtbarkeit syncen
	watch(
		() => props.visible,
		(val) => (show.value = val)
	);
</script>

<template>
	<div v-if="show" class="fixed inset-0 bg-neutral-950/70 flex justify-end z-50 select-none">
		<div class="w-[40vw] h-full bg-neutral-900 border-l border-[#008736]/40 p-6 flex flex-col transition-all duration-500 transform translate-x-0 animate-slideInRight">
			<!-- HEADER -->
			<div class="flex justify-between items-center mb-6">
				<h2 class="text-2xl font-semibold text-[#008736]">Benutzerkonto</h2>

				<div class="flex flex-row gap-4 items-center">
					<font-awesome-icon
						:icon="['fas', 'ban']"
						class="text-neutral-400 hover:text-emerald-500 cursor-pointer text-2xl"
						@click="bannedTime > 0 && bannedReason.length > 0 && emits('ban', account._id, true, bannedReason, bannedTime)"
					/>
					<font-awesome-icon :icon="['fas', 'trash']" class="text-neutral-400 hover:text-emerald-400 cursor-pointer text-2xl" @click="emits('delete', account?._id)" />
					<div class="w-0.5 h-8 bg-neutral-600 rounded-full"></div>
					<font-awesome-icon :icon="['fas', 'xmark']" class="text-neutral-400 hover:text-red-500 cursor-pointer text-2xl" @click="emits('close')" />
				</div>
			</div>

			<!-- CONTENT -->
			<div class="space-y-6 overflow-y-auto pr-2">
				<!-- ID -->
				<div class="bg-neutral-800 rounded-xl p-4">
					<p class="text-gray-400">Account-ID</p>
					<div class="w-full h-[1px] bg-[#008736]/60 my-2"></div>
					<p class="text-xl text-gray-200">{{ props.account?._id ?? '—' }}</p>
				</div>

				<!-- Discord -->
				<div class="bg-neutral-800 rounded-xl p-4">
					<p class="text-gray-400">Discord-ID</p>
					<div class="w-full h-[1px] bg-[#008736]/60 my-2"></div>
					<p class="text-xl text-gray-200">{{ props.account?.discord ?? '—' }}</p>
				</div>

				<!-- Username -->
				<div class="bg-neutral-800 rounded-xl p-4">
					<p class="text-gray-400">Benutzername</p>
					<div class="w-full h-[1px] bg-[#008736]/60 my-2"></div>
					<p class="text-xl text-gray-200">{{ props.account?.username ?? '—' }}</p>
				</div>

				<!-- Email -->
				<div class="bg-neutral-800 rounded-xl p-4">
					<p class="text-gray-400">E-Mail</p>
					<div class="w-full h-[1px] bg-[#008736]/60 my-2"></div>
					<p class="text-xl text-gray-200">{{ props.account?.email ?? '—' }}</p>
				</div>

				<!-- IPs -->
				<div class="bg-neutral-800 rounded-xl p-4">
					<p class="text-gray-400">Letzte IPs</p>
					<div class="w-full h-[1px] bg-[#008736]/60 my-2"></div>
					<ul class="text-gray-200 space-y-1">
						<li v-for="ip in props.account?.ips ?? []" :key="ip" class="text-md">{{ ip }}</li>
						<li v-if="!props.account?.ips?.length" class="text-md">—</li>
					</ul>
				</div>

				<!-- Hardware -->
				<div class="bg-neutral-800 rounded-xl p-4">
					<p class="text-gray-400">Hardware-IDs</p>
					<div class="w-full h-[1px] bg-[#008736]/60 my-2"></div>
					<ul class="text-gray-200 space-y-1">
						<li v-for="hw in props.account?.hardware ?? []" :key="hw" class="text-md">{{ hw }}</li>
						<li v-if="!props.account?.hardware?.length" class="text-md">—</li>
					</ul>
				</div>

				<!-- Login -->
				<div class="bg-neutral-800 rounded-xl p-4">
					<p class="text-gray-400">Letzter Login</p>
					<div class="w-full h-[1px] bg-[#008736]/60 my-2"></div>
					<p class="text-xl text-gray-200">
						{{ props.account?.lastLogin ? new Date(props.account.lastLogin).toLocaleString() : '—' }}
					</p>
				</div>

				<!-- BAN STATUS -->
				<div v-if="props.account?.banned" class="bg-neutral-800 rounded-xl p-4">
					<p class="text-gray-400">Ban-Status</p>
					<div class="w-full h-[1px] bg-[#008736]/60 my-2"></div>

					<div class="flex items-center justify-between mt-2">
						<span class="text-lg text-gray-200">Gesperrt</span>
						<!-- Toggle Switch -->
						<label class="relative inline-flex items-center cursor-pointer">
							<input type="checkbox" class="sr-only peer" v-model="bannedState" :disabled="!props.account?.banned" @change="emits('unban', props.account?._id)" />

							<div
								class="w-14 h-7 rounded-full transition peer-focus:ring-2 peer-focus:ring-[#008736] peer-disabled:opacity-40 peer-disabled:cursor-not-allowed bg-neutral-700 peer-checked:bg-red-600"
							></div>

							<div class="absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full transition-all peer-checked:translate-x-7"></div>
						</label>
					</div>
					<div class="w-full flex flex-row gap-2 justify-between mt-2">
						<span class="text-lg text-gray-200">{{ props.account?.reason }}</span>
						<span class="text-lg text-gray-200">{{ new Date(props.account?.time).toLocaleString() }}</span>
					</div>
				</div>

				<!-- BAN System -->
				<div v-else class="bg-neutral-800 rounded-xl p-4">
					<p class="text-gray-400">Ban-Status</p>
					<div class="w-full h-[1px] bg-[#008736]/60 my-2"></div>

					<!-- Ban Action -->
					<div class="flex flex-col gap-2 mt-3">
						<p class="text-gray-400">Grund</p>
						<DropDown
							:model-value="bannedReason"
							placeholder="Grund wählen"
							:options="AdminConfig.kickAndBanReasons"
							@update:model-value="(val) => bannedReason = val as string"
						/>
						<p class="text-gray-400">Zeitraum</p>
						<DropDown :model-value.number="bannedTime" placeholder="Zeit wählen" :options="banTimes" @update:model-value="(val) => bannedTime = val as number" />
					</div>
				</div>
			</div>
		</div>
	</div>
</template>

<style scoped>
	/* Slide-in Animation */
	@keyframes slideInRight {
		0% {
			transform: translateX(100%);
			opacity: 0;
		}
		100% {
			transform: translateX(0);
			opacity: 1;
		}
	}

	.animate-slideInRight {
		animation: slideInRight 0.35s ease-out;
	}

	::-webkit-scrollbar {
		width: 8px;
	}
	::-webkit-scrollbar-track {
		background: rgba(31, 31, 31, 0.8); /* dunkler Hintergrund */
		border-radius: 8px;
	}
	::-webkit-scrollbar-thumb {
		background: #008736; /* dein GTA-RP Grün */
		border-radius: 8px;
		transition: background-color 0.3s ease;
	}
	::-webkit-scrollbar-thumb:hover {
		background: #00a74b; /* etwas helleres Grün beim Hover */
	} /* Firefox-Unterstützung */
	* {
		scrollbar-width: thin;
		scrollbar-color: #008736 rgba(31, 31, 31, 0.8);
	}
</style>
