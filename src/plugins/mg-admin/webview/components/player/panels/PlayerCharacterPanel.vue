<script setup lang="ts">
	import { ref, watch } from 'vue';
	import { Character } from '@Shared/types';
	import { AdminConfig } from '@Plugins/mg-admin/shared/config';

	import MultiSelect from '../../MultiSelect.vue';

	const props = defineProps<{
		characters: Character[] | null;
		visible: boolean;
	}>();

	const emits = defineEmits<{
		(e: 'close'): void;
		(e: 'save', character: Character): void;
		(e: 'delete', _id: string): void;
		(e: 'select', _id: string): void;
		(e: 'update', _id: string, key: keyof Character, value: any): void;
		(e: 'create', name: string, groups: string[]): void;
	}>();

	const show = ref(props.visible);
	const selected = ref<Character | null>(null);
	const newName = ref<string>('');
	const newGroups = ref<string[]>([]);

	// Sync visible
	watch(
		() => props.visible,
		(v) => (show.value = v)
	);

	watch(
		() => selected.value,
		(val) => emits('select', val?._id ?? null)
	);

	// initial character
	watch(
		() => props.characters,
		(list) => {
			if (list && list.length > 0) {
				selected.value = list[0];
			}
		}
	);

	const createCharacter = () => {
		if (!newName.value.trim()) return;
		const name = newName.value.trim();
		if (!name.includes('_') && !name.includes(' ')) return;
		emits('create', name.replaceAll(' ', '_'), newGroups.value);
		newName.value = '';
		newGroups.value = [];
	};

	// Clipboard helper
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
			<!-- Header -->
			<div class="flex justify-between items-center mb-6">
				<h2 class="text-2xl font-semibold text-[#008736]">Charaktere</h2>
				<div class="flex flex-row gap-4 items-center">
					<font-awesome-icon
						:icon="['fas', 'floppy-disk']"
						class="text-neutral-400 hover:text-emerald-400 cursor-pointer text-2xl"
						@click="emits('update', selected._id, 'groups', selected.groups ?? [])"
					/>
					<font-awesome-icon :icon="['fas', 'trash']" class="text-neutral-400 hover:text-orange-500 cursor-pointer text-2xl" @click="emits('delete', selected?._id)" />
					<div class="w-0.5 h-8 bg-neutral-600 rounded-full"></div>
					<font-awesome-icon :icon="['fas', 'xmark']" class="text-neutral-400 hover:text-red-500 cursor-pointer text-2xl" @click="emits('close')" />
				</div>
			</div>

			<!-- Charakter erstellen -->
			<div class="bg-neutral-800 rounded-xl p-4 mb-4">
				<p class="text-gray-400">Neuen Charakter erstellen</p>
				<div class="w-full h-[1px] bg-[#008736]/60 my-2"></div>

				<div class="flex flex gap-2 items-center">
					<input
						v-model="newName"
						type="text"
						placeholder="Name eingeben"
						class="w-full p-2 rounded-lg bg-neutral-700 text-gray-200 border border-neutral-600 focus:border-[#008736] outline-none"
					/>
					<MultiSelect
						:model-value="newGroups"
						:options="AdminConfig.teamRoles.map((x) => x)"
						placeholder="Teamrang wählen"
						@update:model-value="(val) => (newGroups = val as string[])"
					/>
					<button @click="createCharacter" class="px-4 py-2 rounded-lg bg-[#008736] text-white hover:bg-[#00a34b] transition">Erstellen</button>
				</div>
			</div>

			<!-- Charakterliste -->
			<div class="flex flex-col bg-neutral-800 rounded-xl p-4 max-h-[25vh] overflow-y-auto mb-4 space-y-2">
				<p class="text-gray-400">Verfügbare Charaktere</p>
				<div class="w-full h-[1px] bg-[#008736]/60 my-2"></div>

				<div
					v-for="char in props.characters ?? []"
					:key="char._id"
					class="p-3 rounded-lg cursor-pointer transition flex justify-between items-center bg-neutral-700 hover:bg-neutral-600"
					:class="{
						'bg-[#008736]/40 ring-1 ring-[#008736]': selected && selected._id === char._id,
					}"
					@click="selected = char"
				>
					<span class="text-gray-200">{{ char.id }} — {{ char.name }}</span>
					<font-awesome-icon :icon="['fas', 'arrow-right']" class="text-gray-400" />
				</div>
			</div>

			<!-- Charakterdetails -->
			<div v-if="selected" class="flex-1 overflow-y-auto bg-neutral-800 rounded-xl p-4 space-y-4">
				<p class="text-gray-400">Charakterdaten</p>
				<div class="w-full h-[1px] bg-[#008736]/60 my-2"></div>

				<!-- Name / ID -->
				<div>
					<p class="text-gray-400">Name</p>
					<p class="text-xl text-gray-200">{{ selected.name }}</p>
				</div>
				<div>
					<p class="text-gray-400">Charakter-ID</p>
					<p class="text-xl text-gray-200">{{ selected.id }}</p>
				</div>

				<!-- Groups -->
				<div>
					<p class="text-gray-400">Rang im Team</p>
					<div class="w-full h-[1px] bg-[#008736]/60 my-2"></div>

					<div class="flex justify-between items-center">
						<MultiSelect
							:model-value="selected?.groups"
							placeholder="Teamrang wählen"
							:options="AdminConfig.teamRoles"
							@update:model-value="(val) => (selected.groups = val as string[])"
						/>
					</div>
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

				<!-- More fields like Health, Armour, etc. -->
				<div>
					<p class="text-gray-400">Gesundheit</p>
					<p class="text-xl text-gray-200">{{ selected.health ?? '—' }}</p>
				</div>

				<div>
					<p class="text-gray-400">Geldbörse</p>
					<p class="text-xl text-gray-200">{{ selected.cash ?? 0 }}</p>
				</div>

				<div>
					<p class="text-gray-400">Kontostand</p>
					<p class="text-xl text-gray-200">{{ selected.bank ?? 0 }}</p>
				</div>

				<div>
					<p class="text-gray-400">Stunden</p>
					<p class="text-xl text-gray-200">{{ selected.hours ?? 0 }}</p>
				</div>

				<div>
					<p class="text-gray-400">Interior</p>
					<p class="text-xl text-gray-200">{{ selected.interior ?? '—' }}</p>
				</div>

				<!-- You can extend with weapons, clothes, etc. -->
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
