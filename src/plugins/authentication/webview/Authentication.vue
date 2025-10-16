<script lang="ts" setup>
    import { ref, watch } from 'vue';
    import { useEvents } from '../../../../webview/composables/useEvents';

    const Events = useEvents();
    const mode = ref<'login' | 'register'>('login');

    const username = ref<string>('');
    const password = ref<string>('');
    const confirmPassword = ref('');

    const usernameValid = ref(false);
    const passwordValid = ref(false);
    const passwordsMatch = ref(true);

    const whitelistCode = ref<string | null>(null);
    const serverMessage = ref<string | null>(null);

    watch(username, (value) => {
        usernameValid.value = value.length > 2 && /^[A-Za-z]+$/gm.test(value);
    });

    watch(password, (value) => {
        passwordValid.value = value.length > 2;
    });

    watch([password, confirmPassword], ([a, b]) => {
        passwordsMatch.value = a === b;
    });

    async function loginOrRegister() {
        // vorher evtl. Validierung
        const result = await Events.emitServerRpc('authenticate:login', username.value, password.value);

        // result ist jetzt ein Objekt (siehe server)
        if (!result) {
            serverMessage.value = 'Unbekannter Fehler beim Server-Call.';
            return;
        }

        if (result.success) {
            serverMessage.value = 'Login erfolgreich!';
            whitelistCode.value = null;
            // ggf. UI schließen
        } else if (result.whitelistRequested) {
            whitelistCode.value = result.whitelistCode;
            serverMessage.value = 'Du bist nicht auf dem Discord-Server oder hast nicht die erforderliche Rolle. Ein Whitelist-Antrag wurde an das Team gesendet.';
        } else if (result.reason === 'wrong_password') {
            serverMessage.value = 'Falsches Passwort.';
        } else {
            serverMessage.value = 'Zugriff verweigert.';
        }
    }

    function copyToClipboard(text: string) {
        if (!text) return;
        navigator.clipboard
            .writeText(text)
            .then(() => {
                serverMessage.value = `Whitelist-Code "${text}" wurde in die Zwischenablage kopiert.`;
                setTimeout(() => (serverMessage.value = null), 3000);
            })
            .catch(() => {
                serverMessage.value = 'Fehler: Konnte Code nicht kopieren.';
                setTimeout(() => (serverMessage.value = null), 3000);
            });
    }
</script>

<template>
    <div class="fixed inset-0 flex items-center justify-center bg-neutral-950/70 backdrop-blur-md">
        <div class="flex w-[28rem] flex-col gap-5 rounded-2xl bg-neutral-950/90 p-8 shadow-2xl border border-zinc-800 transition-all">
            <div class="text-center select-none">
                <h1 class="text-2xl font-bold text-white tracking-wide">
                    {{ mode === 'login' ? 'Anmeldung' : 'Registrierung' }}
                </h1>
                <p class="text-sm text-zinc-400 mt-1">
                    {{ mode === 'login'
                        ? 'Melde dich mit deinem bestehenden Konto an.'
                        : 'Erstelle jetzt ein neues Konto.' }}
                </p>
            </div>

            <div class="flex flex-col gap-3">
                <input
                    v-model="username"
                    type="text"
                    placeholder="Benutzername"
                    class="input-auth"
                />

                <span v-if="username && !usernameValid" class="hint">
                    Nur Buchstaben erlaubt, mindestens 3 Zeichen.
                </span>

                <input
                    v-model="password"
                    type="password"
                    placeholder="Passwort"
                    class="input-auth"
                />
                <span v-if="password && !passwordValid" class="hint">
                    Passwort muss mindestens 3 Zeichen lang sein.
                </span>

                <transition name="fade">
                    <div v-if="mode === 'register'" class="flex flex-col gap-1">
                        <input
                            v-model="confirmPassword"
                            type="password"
                            placeholder="Passwort bestätigen"
                            class="input-auth"
                        />
                        <span v-if="!passwordsMatch" class="hint">
                            Passwörter stimmen nicht überein.
                        </span>
                    </div>
                </transition>
            </div>

            <button
                @click="loginOrRegister"
                :disabled="!(usernameValid && passwordValid && (mode === 'login' || passwordsMatch))"
                class="w-full rounded-md bg-green-700 py-3 font-semibold text-white hover:bg-green-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {{ mode === 'login' ? 'Anmelden' : 'Registrieren' }}
            </button>

            <div class="text-center text-sm text-zinc-400 mt-2">
                <span v-if="mode === 'login'">
                    <span class="select-none">Kein Konto?</span> 
                    <span
                        @click="mode = 'register'"
                        class="text-emerald-400 hover:text-emerald-300 cursor-pointer transition"
                    >
                        Registrieren
                    </span>
                </span>
                <span v-else>
                    <span class="select-none">Bereits registriert?</span>
                    <span
                        @click="mode = 'login'"
                        class="text-emerald-400 hover:text-emerald-300 cursor-pointer transition"
                    >
                        Anmelden
                    </span>
                </span>
            </div>

            <!-- unterhalb des Buttons -->
            <div v-if="whitelistCode" class="text-center mt-3 rounded-md bg-neutral-800 p-3">
                <div class="text-sm text-gray-100">Whitelist-Code:</div>
                <div class="mt-1 flex items-center gap-2">
                    <div class="rounded-md bg-neutral-700 px-3 py-2 font-mono text-lg text-green-700">{{ whitelistCode }}</div>
                    <button @click="copyToClipboard(whitelistCode)" class="text-sm text-gray-100 underline">Kopieren</button>
                </div>
                <p class="text-xs text-zinc-400 mt-2">
                    Sende diesen Code im Discord (in #whitelist-requests) oder warte, bis ein Teammitglied die Anfrage bearbeitet hat.
                </p>
            </div>

            <div v-if="serverMessage" class="select-none text-center m-2 text-md text-gray-100 bg-neutral-800 rounded-md p-2">
                {{ serverMessage }}
            </div>
        </div>
    </div>
</template>

<style scoped>
    .input-auth {
        @apply rounded-md bg-neutral-800 text-gray-100 px-3 py-2 outline-none border border-transparent focus:border-green-500 transition;
    }
    .hint {
        @apply text-xs text-red-400 -mt-1;
    }
    .fade-enter-active,
    .fade-leave-active {
        transition: opacity 0.3s;
    }
    .fade-enter-from,
    .fade-leave-to {
        opacity: 0;
    }
</style>
