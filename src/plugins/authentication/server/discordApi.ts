import * as alt from 'alt-server';
import { useRebar } from '@Server/index.js';
import { Client, GatewayIntentBits, TextChannel, EmbedBuilder } from 'discord.js';

const Rebar = useRebar();
const token = process.env.DISCORD_BOT_TOKEN;
const guildId = process.env.DISCORD_GUILD_ID;
const roleId = process.env.DISCORD_ROLE_ID;
const logChannelId = process.env.DISCORD_LOG_CHANNEL_ID;
const API_NAME = 'discord-bot-api';

if (!token || !guildId || !roleId || !logChannelId) {
    alt.logError('Discord Bot: Fehlende Konfiguration in .env');
}

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers],
});

let ready = false;

client.once('ready', () => {
    ready = true;
    alt.log(`Discord Bot eingeloggt als ${client.user?.tag}`);
});

client.login(token).catch((err) => alt.logError('Discord Bot konnte nicht starten:', err));

export function useApi() {
    async function waitForReady(timeout = 5000) {
        const start = Date.now();
        while (!ready && Date.now() - start < timeout) {
            await new Promise((r) => setTimeout(r, 100));
        }
        return ready;
    }

    async function checkDiscordAccess(discordId?: string) {
        await waitForReady();

        if (!discordId) return { onServer: false, hasRole: false, memberTag: null };

        try {
            const guild = await client.guilds.fetch(guildId);
            const member = await guild.members.fetch(discordId).catch(() => null);
            if (!member) return { onServer: false, hasRole: false, memberTag: null };

            const hasRole = member.roles.cache.has(roleId);
            return { onServer: true, hasRole, memberTag: `${member.user.username}#${member.user.discriminator}` };
        } catch (err) {
            alt.logError('Fehler bei Discord-Prüfung:', err);
            return { onServer: false, hasRole: false, memberTag: null };
        }
    }


    async function sendWhitelistRequestToChannel(payload: { playerName: string; accountId?: string; discord?: string | null; whitelistCode: string }) {
        try {
            const ch = (await client.channels.fetch(logChannelId)) as TextChannel | null;
            if (!ch || !ch.isTextBased()) {
                alt.logError('Team Channel nicht gefunden oder ist kein TextChannel.');
                return;
            }

            const embed = new EmbedBuilder()
                .setTitle('Neue Whitelist-Anfrage')
                .setColor(0x2ecc71)
                .addFields(
                    { name: 'Spieler', value: payload.playerName, inline: true },
                    { name: 'AccountId', value: payload.accountId ?? '–', inline: true },
                    { name: 'DiscordID', value: payload.discord ?? 'Nicht verknüpft', inline: false },
                    { name: 'Whitelist-Code', value: payload.whitelistCode, inline: true },
                )
                .setTimestamp();

            await ch.send({ embeds: [embed] });
        } catch (err) {
            alt.logError('Fehler beim Senden der Whitelist-Anfrage:', err);
        }
    }

    return {
        waitForReady,
        checkDiscordAccess,
        sendWhitelistRequestToChannel
    };
}

declare global {
    export interface ServerPlugin {
        [API_NAME]: ReturnType<typeof useApi>;
    }
}

Rebar.useApi().register(API_NAME, useApi());
