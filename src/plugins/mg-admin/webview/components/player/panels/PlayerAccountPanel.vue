<script setup lang="ts">
	import { ref, watch } from 'vue';
	import { Account } from '@Shared/types';

	const props = defineProps<{
		account: Account | null;
		visible: boolean;
	}>();

	const emits = defineEmits<{
		(e: 'close'): void;
		(e: 'unban', _id: string): void;
	}>();

	const show = ref(props.visible);

	// Local switch state – folgt account.banned
	const bannedState = ref<boolean>(props.account?.banned ?? false);

	// Sync toggle-UI mit neuen Daten
	watch(
		() => props.account,
		(acc) => {
			bannedState.value = acc?.banned ?? false;
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

				<font-awesome-icon :icon="['fas', 'xmark']" class="text-neutral-400 hover:text-red-500 cursor-pointer text-2xl" @click="emits('close')" />
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
				<div class="bg-neutral-800 rounded-xl p-4">
					<p class="text-gray-400">Ban-Status</p>
					<div class="w-full h-[1px] bg-[#008736]/60 my-2"></div>

					<div class="flex items-center justify-between mt-2">
						<span class="text-lg text-gray-200">
							{{ bannedState ? 'Gesperrt' : 'Nicht gesperrt' }}
						</span>

						<!-- Toggle Switch -->
						<label class="relative inline-flex items-center cursor-pointer">
							<input type="checkbox" class="sr-only peer" v-model="bannedState" :disabled="!props.account?.banned" @change="emits('unban', props.account?._id)" />

							<div
								class="w-14 h-7 rounded-full transition peer-focus:ring-2 peer-focus:ring-[#008736] peer-disabled:opacity-40 peer-disabled:cursor-not-allowed bg-neutral-700 peer-checked:bg-red-600"
							></div>

							<div class="absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full transition-all peer-checked:translate-x-7"></div>
						</label>
					</div>

					<!-- Ban Reason -->
					<div v-if="bannedState" class="mt-3">
						<p class="text-gray-400">Grund</p>
						<p class="text-md text-red-400 mt-1">
							{{ props.account?.reason ?? 'Kein Grund angegeben' }}
						</p>
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
</style>
