<script setup lang="ts">
	import { computed, ref, watch } from 'vue';
	import { Vehicle } from '@Shared/types';

	const props = defineProps<{
		vehicles: Vehicle[] | null;
		visible: boolean;
	}>();

	const emits = defineEmits<{
		(e: 'close'): void;
		(e: 'select', _id: string): void;
		(e: 'delete', _id: string): void;
		(e: 'repair', _id: string): void;
		(e: 'refuel', _id: string): void;
		(e: 'create', name: string): void;
	}>();

	const show = ref(props.visible);
	const selected = ref<Vehicle | null>(null);
	const newName = ref<string>('');

	watch(
		() => props.visible,
		(v) => (show.value = v)
	);

	watch(
		() => selected.value,
		(val) => emits('select', val?._id ?? null)
	);

	watch(
		() => props.vehicles,
		(list) => {
			if (list && list.length > 0) {
				selected.value = list[0];
				emits('select', selected.value._id);
			}
		}
	);

	const getLockState = computed(() => {
		if (selected.value.stateProps?.lockState) return '—';
		switch (selected.value.stateProps?.lockState) {
			case 1:
				return 'Aufgeschlossen';
			case 2:
				return 'Abgeschlossen';
			default:
				return '—';
		}
	});

	const createVehicle = () => {
		if (!newName.value.trim()) return;
		emits('create', newName.value.trim());
		newName.value = '';
	};

	// Clipboard helpers
	const copyPos = () => {
		if (!selected.value?.pos) return;
		const el = document.createElement('textarea');
		el.value = `{ x: ${selected.value.pos.x.toFixed(4)}, y: ${selected.value.pos.y.toFixed(4)}, z: ${selected.value.pos.z.toFixed(4)} }`;
		document.body.appendChild(el);
		el.select();
		document.execCommand('copy');
		document.body.removeChild(el);
	};
	const copyRot = () => {
		if (!selected.value?.rot) return;
		const el = document.createElement('textarea');
		el.value = `{ x: ${selected.value.rot.x.toFixed(4)}, y: ${selected.value.rot.y.toFixed(4)}, z: ${selected.value.rot.z.toFixed(4)} }`;
		document.body.appendChild(el);
		el.select();
		document.execCommand('copy');
		document.body.removeChild(el);
	};
</script>

<template>
	<div v-if="show" class="fixed inset-0 bg-neutral-950/70 flex justify-end z-50 select-none">
		<div class="w-[45vw] h-full bg-neutral-900 border-l border-[#008736]/40 p-6 flex flex-col transition-all duration-500 transform translate-x-0 animate-slideInRight">
			<!-- HEADER -->
			<div class="flex justify-between items-center mb-6">
				<h2 class="text-2xl font-semibold text-[#008736]">Fahrzeuge</h2>
				<div class="flex flex-row gap-4 items-center">
					<font-awesome-icon :icon="['fas', 'wrench']" class="text-neutral-400 hover:text-orange-500 cursor-pointer text-2xl" @click="emits('repair', selected._id)" />
					<font-awesome-icon :icon="['fas', 'gas-pump']" class="text-neutral-400 hover:text-orange-500 cursor-pointer text-2xl" @click="emits('refuel', selected._id)" />
					<font-awesome-icon :icon="['fas', 'trash']" class="text-neutral-400 hover:text-orange-500 cursor-pointer text-2xl" @click="emits('delete', selected._id)" />
					<div class="w-0.5 h-8 bg-neutral-600 rounded-full"></div>
					<font-awesome-icon :icon="['fas', 'xmark']" class="text-neutral-400 hover:text-red-500 cursor-pointer text-2xl" @click="emits('close')" />
				</div>
			</div>

			<!-- Charakter erstellen -->
			<div class="bg-neutral-800 rounded-xl p-4 mb-4">
				<p class="text-gray-400">Neues Fahrzeug erstellen</p>
				<div class="w-full h-[1px] bg-[#008736]/60 my-2"></div>

				<div class="flex gap-2 items-center">
					<input
						v-model="newName"
						type="text"
						placeholder="Name eingeben"
						class="w-full p-2 rounded-lg bg-neutral-700 text-gray-200 border border-neutral-600 focus:border-[#008736] outline-none"
					/>
					<button @click="createVehicle" class="px-4 py-2 rounded-lg bg-[#008736] text-white hover:bg-[#00a34b] transition">Erstellen</button>
				</div>
			</div>

			<!-- Fahrzeugliste -->
			<div class="flex flex-col bg-neutral-800 rounded-xl p-4 max-h-[25vh] overflow-y-auto mb-4 space-y-2">
				<p class="text-gray-400">Fahrzeuge des Charakters</p>
				<div class="w-full h-[1px] bg-[#008736]/60 my-2"></div>

				<div
					v-for="veh in props.vehicles ?? []"
					:key="veh._id"
					class="p-3 rounded-lg cursor-pointer transition flex justify-between items-center bg-neutral-700 hover:bg-neutral-600"
					:class="{ 'bg-[#008736]/40 ring-1 ring-[#008736]': selected && selected._id === veh._id }"
					@click="selected = veh"
				>
					<span class="text-gray-200">{{ veh.id }} — {{ veh.model }}</span>
					<font-awesome-icon :icon="['fas', 'arrow-right']" class="text-gray-400" />
				</div>
			</div>

			<!-- Fahrzeugdetails -->
			<div v-if="selected" class="flex-1 overflow-y-auto bg-neutral-800 rounded-xl p-4 space-y-4">
				<!-- ID / Model -->
				<div>
					<p class="text-gray-400">Fahrzeug-ID</p>
					<p class="text-xl text-gray-200">{{ selected.id }}</p>
				</div>
				<div>
					<p class="text-gray-400">Model</p>
					<p class="text-xl text-gray-200">{{ selected.model }}</p>
				</div>

				<!-- Position -->
				<div>
					<p class="text-gray-400">Position</p>
					<div class="w-full h-[1px] bg-[#008736]/60 my-2"></div>
					<div class="flex justify-between items-center">
						<p class="text-lg text-gray-200">
							X: {{ selected.pos?.x.toFixed(4) ?? '—' }} | Y: {{ selected.pos?.y.toFixed(4) ?? '—' }} | Z: {{ selected.pos?.z.toFixed(4) ?? '—' }}
						</p>
						<font-awesome-icon :icon="['fas', 'copy']" class="text-gray-400 hover:text-[#008736] cursor-pointer" @click="copyPos" />
					</div>
				</div>

				<!-- Rotation -->
				<div>
					<p class="text-gray-400">Rotation</p>
					<div class="w-full h-[1px] bg-[#008736]/60 my-2"></div>
					<div class="flex justify-between items-center">
						<p class="text-lg text-gray-200">
							X: {{ selected.rot?.x.toFixed(4) ?? '—' }} | Y: {{ selected.rot?.y.toFixed(4) ?? '—' }} | Z: {{ selected.rot?.z.toFixed(4) ?? '—' }}
						</p>
						<font-awesome-icon :icon="['fas', 'copy']" class="text-gray-400 hover:text-[#008736] cursor-pointer" @click="copyRot" />
					</div>
				</div>

				<!-- Fuel / Engine / LockState / BodyHealth -->
				<div>
					<p class="text-gray-400">Tankfüllung</p>
					<p class="text-xl text-gray-200">{{ selected.fuel ?? '—' }}</p>
				</div>
				<div>
					<p class="text-gray-400">Motorstruktur</p>
					<p class="text-xl text-gray-200">{{ selected.stateProps?.engineHealth ?? '—' }}</p>
				</div>
				<div>
					<p class="text-gray-400">Fahrzeugstruktur</p>
					<p class="text-xl text-gray-200">{{ selected.stateProps?.bodyHealth ?? '—' }}</p>
				</div>
				<div>
					<p class="text-gray-400">Fahrzeugverriegelung</p>
					<p class="text-xl text-gray-200">{{ getLockState }}</p>
				</div>

				<!-- WheelState -->
				<div>
					<p class="text-gray-400">Rad Zustand</p>
					<p class="text-xl text-gray-200">
						{{ selected.wheelState?.join(', ') ?? '—' }}
					</p>
				</div>

				<!-- NumberPlate -->
				<div>
					<p class="text-gray-400">Nummernschild</p>
					<p class="text-xl text-gray-200">{{ selected.numberPlateText ?? '—' }}</p>
				</div>
			</div>
		</div>
	</div>
</template>

<style scoped>
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
