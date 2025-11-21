<script lang="ts" setup>
	import { ref, watch } from 'vue';
	import { PlayerLog, PlayerStats } from '@Plugins/mg-admin/shared/interfaces';
	import { useEvents } from '@Composables/useEvents';

	import PlayerActions from './PlayerActions.vue';
	import PlayerLogPanel from './panels/PlayerLogPanel.vue';
	import PlayerAccountPanel from './panels/PlayerAccountPanel.vue';
	import PlayerCharacterPanel from './panels/PlayerCharacterPanel.vue';
	import PlayerVehiclePanel from './panels/PlayerVehiclePanel.vue';
	import { AdminEvents } from '@Plugins/mg-admin/shared/events';
	import { Account, Character, Vehicle } from '@Shared/types/index';

	const props = defineProps<{
		player: PlayerStats | null;
		visible: boolean;
	}>();

	const emits = defineEmits<{
		(e: 'close'): void;
	}>();

	const events = useEvents();
	const show = ref<boolean>(props.visible);
	const showAccount = ref<boolean>(false);
	const showCharacters = ref<boolean>(false);
	const showVehicles = ref<boolean>(false);
	const showLogs = ref<boolean>(false);

	const account = ref<Account | null>(null);
	const character = ref<Character | null>(null);
	const vehicle = ref<Vehicle | null>(null);
	const characters = ref<Character[]>([]);
	const vehicles = ref<Vehicle[]>([]);
	const logs = ref<PlayerLog[]>([]);

	// loading / error flags
	const loadingAccount = ref(false);
	const loadingCharacters = ref(false);
	const loadingVehicles = ref(false);
	const loadingLogs = ref(false);
	const lastAccountIdLoaded = ref<string | null>(null);

	// Clipboard helpers left unchanged (you already use textarea fallback)
	const copyPosition = () => {
		if (!props.player?.pos) return;
		const text = `{ x: ${props.player.pos.x.toFixed(4)}, y: ${props.player.pos.y.toFixed(4)}, z: ${props.player.pos.z.toFixed(4)} }`;
		const el = document.createElement('textarea');
		el.value = text;
		document.body.appendChild(el);
		el.select();
		document.execCommand('copy');
		document.body.removeChild(el);
	};

	const copyRotation = () => {
		if (!props.player?.rot) return;
		const text = `{ x: ${props.player.rot.x.toFixed(4)}, y: ${props.player.rot.y.toFixed(4)}, z: ${props.player.rot.z.toFixed(4)} }`;
		const el = document.createElement('textarea');
		el.value = text;
		document.body.appendChild(el);
		el.select();
		document.execCommand('copy');
		document.body.removeChild(el);
	};

	// zentrale Refresh-Funktion (Account + Characters)
	const refreshAll = async () => {
		if (!props.player || !show.value) return;
		const accId = props.player.account_id;
		if (!accId) {
			console.warn('[AdminMenu] Kein account_id vorhanden auf props.player');
			account.value = null;
			characters.value = [];
			return;
		}

		// optional: vermeiden mehrfacher identischer Requests
		if (lastAccountIdLoaded.value === accId && account.value) return;

		try {
			loadingAccount.value = true;
			account.value = await events.emitServerRpc(AdminEvents.toServer.request.user.account, accId);
			lastAccountIdLoaded.value = accId ?? null;
		} catch (err) {
			console.error('[AdminMenu] Fehler beim Laden des Accounts:', err);
			account.value = null;
		} finally {
			loadingAccount.value = false;
		}

		// Characters nur laden wenn Account existiert
		if (account.value?._id) {
			try {
				loadingCharacters.value = true;
				characters.value = await events.emitServerRpc(AdminEvents.toServer.request.user.characters, account.value._id);
			} catch (err) {
				console.error('[AdminMenu] Fehler beim Laden der Characters:', err);
				characters.value = [];
			} finally {
				loadingCharacters.value = false;
			}
		} else {
			characters.value = [];
		}
	};

	// --- Panel-öffner: laden bei Bedarf ---
	const openAccount = async () => {
		showAccount.value = true;
		showCharacters.value = false;
		showVehicles.value = false;
		showLogs.value = false;

		// Lade Account sofort (auch wenn refreshAll bereits lief, double-check)
		if (!account.value && props.player?.account_id) {
			await refreshAll();
		} else if (props.player?.account_id && props.player?.account_id !== lastAccountIdLoaded.value) {
			await refreshAll();
		}
	};

	const openCharacters = async () => {
		showCharacters.value = true;
		showAccount.value = false;
		showVehicles.value = false;
		showLogs.value = false;

		// Wenn characters noch nicht geladen oder falsche account id -> (re)load
		if ((!characters.value || characters.value.length === 0) && props.player?.account_id) {
			await refreshAll();
		}
	};

	const openVehicles = async () => {
		showVehicles.value = true;
		showAccount.value = false;
		showCharacters.value = false;
		showLogs.value = false;

		// Wenn ein character selektiert ist, lade dessen Fahrzeuge
		if (character.value?._id) {
			try {
				loadingVehicles.value = true;
				vehicles.value = await events.emitServerRpc(AdminEvents.toServer.request.user.vehicles, character.value._id);
			} catch (err) {
				console.error('[AdminMenu] Fahrzeuge laden fehlgeschlagen:', err);
				vehicles.value = [];
			} finally {
				loadingVehicles.value = false;
			}
		}
	};

	const openLogs = async () => {
		showLogs.value = true;
		showAccount.value = false;
		showCharacters.value = false;
		showVehicles.value = false;

		// Wenn ein character selektiert ist, lade dessen Logs
		if (character.value?._id) {
			try {
				loadingLogs.value = true;
				logs.value = await events.emitServerRpc(AdminEvents.toServer.request.user.logs, character.value._id);
			} catch (err) {
				console.error('[AdminMenu] Logs laden fehlgeschlagen:', err);
				logs.value = [];
			} finally {
				loadingLogs.value = false;
			}
		}
	};

	const closePanels = () => {
		showAccount.value = showCharacters.value = showVehicles.value = showLogs.value = false;
	};

	// Watcher: show und player.id → refresh bei beiden Fällen
	watch(
		() => props.visible,
		(val) => {
			show.value = val;
		}
	);

	watch(
		() => props.player?.account_id,
		async (val) => {
			// wird getriggert, wenn in der Tabelle ein anderer Spieler ausgewählt wird
			if (!val) {
				account.value = null;
				characters.value = [];
				lastAccountIdLoaded.value = null;
				return;
			}
			// nur aktualisieren wenn Panel offen ist (oder du willst immer laden)
			if (show.value) {
				await refreshAll();
			}
		}
	);

	// Wenn das Haupt-Panel geöffnet wird, lade Account/Characters (falls vorhanden)
	watch(
		() => show.value,
		async (val) => {
			if (val) {
				await refreshAll();
			} else {
				account.value = null;
				character.value = null;
				characters.value = [];
				vehicles.value = [];
				logs.value = [];
				lastAccountIdLoaded.value = null;
			}
		}
	);

	// Character watcher: wenn character wechselt, lade vehicles + logs
	watch(
		() => character.value?._id,
		async (val) => {
			if (val) {
				try {
					loadingVehicles.value = true;
					vehicles.value = await events.emitServerRpc(AdminEvents.toServer.request.user.vehicles, val);
				} catch (err) {
					console.error('[AdminMenu] Fahrzeuge laden fehlgeschlagen (watch):', err);
					vehicles.value = [];
				} finally {
					loadingVehicles.value = false;
				}

				try {
					loadingLogs.value = true;
					logs.value = await events.emitServerRpc(AdminEvents.toServer.request.user.logs, val);
				} catch (err) {
					console.error('[AdminMenu] Logs laden fehlgeschlagen (watch):', err);
					logs.value = [];
				} finally {
					loadingLogs.value = false;
				}
			} else {
				vehicles.value = [];
				logs.value = [];
			}
		}
	);

	// restliche helper functions (select/create/unban) unverändert
	const selectCharacter = async (_id: string) => {
		const selected = characters.value.find((x) => x._id === _id) || null;
		character.value = selected;
		// die watch auf character.value?._id lädt vehicles/logs automatisch
	};

	const selectVehicle = (_id: string) => {
		vehicle.value = vehicles.value.find((x) => x._id === _id) || null;
	};

	const createCharacter = (name: string) => {
		if (!props.player) return;
		events.emitServer(AdminEvents.toServer.request.user.create.character, props.player.account_id, name);
	};

	const createVehicle = (name: string) => {
		if (!character.value) return;
		events.emitServer(AdminEvents.toServer.request.user.create.vehicle, character.value._id, name);
	};

	const unbanAccount = async (_id: string) => {
		account.value = await events.emitServerRpc(AdminEvents.toServer.request.user.unban, _id);
	};
</script>

<template>
	<div v-if="show" class="fixed inset-0 bg-neutral-950/95 flex items-center justify-center z-50 select-none">
		<div class="bg-neutral-900 rounded-2xl shadow-2xl w-[50vw] max-h-[90vh] border-2 border-[#008736]/40 p-6 text-gray-200 flex flex-col transition-all duration-500">
			<!-- 🧍 Header: Name / ID / Ping -->
			<div class="flex flex-row gap-4 items-center justify-between mb-2">
				<div class="w-full flex flex-col gap-1">
					<h2 class="text-3xl font-semibold text-[#008736]">
						{{ props.player?.name || 'Unbekannter Spieler' }}
					</h2>
					<div class="flex flex-row gap-5 ml-4">
						<p class="text-md text-neutral-500">
							ID: <span class="text-gray-100">{{ props.player?.id }}</span>
						</p>
						<p class="text-md text-neutral-500">
							Account ID: <span class="text-gray-100">{{ props.player?.account_id ?? '—' }}</span>
						</p>
						<p class="text-md text-neutral-500">
							PING: <span class="text-gray-100">{{ props.player?.ping ?? '—' }}</span>
						</p>
					</div>
				</div>
				<font-awesome-icon :icon="['fas', 'file-lines']" @click="openLogs" class="text-neutral-600 hover:text-emerald-500 transition text-2xl cursor-pointer" />
				<font-awesome-icon :icon="['fas', 'user']" @click="openAccount" class="text-neutral-600 hover:text-emerald-500 transition text-2xl cursor-pointer" />
				<font-awesome-icon :icon="['fas', 'users']" @click="openCharacters" class="text-neutral-600 hover:text-emerald-500 transition text-2xl cursor-pointer" />
				<font-awesome-icon :icon="['fas', 'car']" @click="openVehicles" class="text-neutral-600 hover:text-emerald-500 transition text-2xl cursor-pointer" />
				<div class="w-0.5 h-10 bg-[#008736]"></div>
				<font-awesome-icon :icon="['fas', 'xmark']" @click="emits('close')" class="text-neutral-600 hover:text-red-500 transition text-2xl cursor-pointer" />
			</div>

			<!-- 🔹 Zwei Spalten: Spielerinfos links, Aktionen rechts -->
			<div class="flex gap-2">
				<!-- 🔸 Linke Seite: Statusinformationen -->
				<div class="flex-1 space-y-2">
					<!-- Health -->
					<div class="bg-neutral-800 rounded-xl p-4 text-gray-100 text-md">
						<p class="text-gray-400">Health</p>
						<div class="w-full h-[1px] bg-[#008736] mb-2"></div>
						<p class="text-lg font-medium text-gray-200">{{ props.player?.health ?? '—' }}</p>
					</div>

					<!-- Armour -->
					<div class="bg-neutral-800 rounded-xl p-4 text-gray-100 text-md">
						<p class="text-gray-400">Armour</p>
						<div class="w-full h-[1px] bg-[#008736] mb-2"></div>
						<p class="text-lg font-medium text-gray-200">{{ props.player?.armour ?? '—' }}</p>
					</div>

					<!-- Position -->
					<div class="bg-neutral-800 rounded-xl p-4 text-gray-100 text-md">
						<p class="text-gray-400">Position</p>
						<div class="w-full h-[1px] bg-[#008736] mb-2"></div>
						<div class="w-full flex flex-row gap-2 justify-between items-center">
							<p class="text-lg font-medium text-gray-200">
								X: {{ props.player?.pos?.x.toFixed(4) ?? '—' }} | Y: {{ props.player?.pos?.y.toFixed(4) ?? '—' }} | Z:
								{{ props.player?.pos?.z.toFixed(4) ?? '—' }}
							</p>
							<font-awesome-icon :icon="['fas', 'copy']" class="text-gray-400 hover:text-[#008736] cursor-pointer ml-2" @click="copyPosition" />
						</div>
					</div>
					<!-- Rotation -->
					<div class="bg-neutral-800 rounded-xl p-4 text-gray-100 text-md">
						<p class="text-gray-400">Rotation</p>
						<div class="w-full h-[1px] bg-[#008736] mb-2"></div>
						<div class="w-full flex flex-row gap-2 justify-between items-center">
							<p class="text-lg font-medium text-gray-200">
								X: {{ props.player?.rot?.x.toFixed(4) ?? '—' }} | Y: {{ props.player?.rot?.y.toFixed(4) ?? '—' }} | Z:
								{{ props.player?.rot?.z.toFixed(4) ?? '—' }}
							</p>
							<font-awesome-icon :icon="['fas', 'copy']" class="text-gray-400 hover:text-[#008736] cursor-pointer ml-2" @click="copyRotation" />
						</div>
					</div>
				</div>

				<!-- 🔸 Rechte Seite: Aktionen -->
				<div class="w-96 bg-neutral-900 ring-1 ring-[#008736]/60 rounded-xl">
					<PlayerActions :visible="isNaN(Number(player?.name))" :player="player" @close="emits('close')" />
				</div>
			</div>
			<!-- Panels: außerhalb der Box, rechts einfahrende Slider -->
			<transition name="slide-panel"> <PlayerLogPanel :visible="showLogs" :logs="logs" @close="closePanels" /></transition>
			<transition name="slide-panel"> <PlayerAccountPanel :visible="showAccount" :account="account" @close="closePanels" @unban="unbanAccount" /></transition>
			<transition name="slide-panel">
				<PlayerCharacterPanel
					:visible="showCharacters"
					:characters="characters"
					@close="closePanels"
					@create-character="createCharacter"
					@select-character="selectCharacter"
			/></transition>
			<transition name="slide-panel">
				<PlayerVehiclePanel :visible="showVehicles" :vehicles="vehicles" @close="closePanels" @create-vehicle="createVehicle" @select-vehicle="selectVehicle"
			/></transition>
		</div>
	</div>
</template>

<style scoped>
	::-webkit-scrollbar {
		width: 0;
	}
	::-webkit-scrollbar-thumb {
		background-color: #008736;
		border-radius: 4px;
	}
	.slide-panel-enter-active,
	.slide-panel-leave-active {
		transition: all 0.35s ease;
	}

	.slide-panel-enter-from {
		transform: translateX(100%);
		opacity: 0;
	}

	.slide-panel-enter-to {
		transform: translateX(0);
		opacity: 1;
	}

	.slide-panel-leave-from {
		transform: translateX(0);
		opacity: 1;
	}

	.slide-panel-leave-to {
		transform: translateX(100%);
		opacity: 0;
	}
</style>
