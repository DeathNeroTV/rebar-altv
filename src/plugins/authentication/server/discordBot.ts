import { Client, GatewayIntentBits, TextChannel, EmbedBuilder } from 'discord.js';
import * as alt from 'alt-server';

const token = process.env.DISCORD_BOT_TOKEN;
const guildId = process.env.DISCORD_GUILD_ID;
const roleId = process.env.DISCORD_ROLE_ID;
const logChannelId = process.env.DISCORD_LOG_CHANNEL_ID;

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

async function waitForReady(timeout = 5000) {
    const start = Date.now();
    while (!ready && Date.now() - start < timeout) {
        await new Promise((r) => setTimeout(r, 100));
    }
    return ready;
}

export async function checkDiscordAccess(discordId?: string) {
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

export async function sendWhitelistRequestToChannel(payload: { playerName: string; accountId?: string; discordId?: string | null; whitelistCode: string }) {
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
                { name: 'DiscordID', value: payload.discordId ?? 'Nicht verknüpft', inline: false },
                { name: 'Whitelist-Code', value: payload.whitelistCode, inline: true },
            )
            .setTimestamp();

        await ch.send({ embeds: [embed] });
        alt.log(`[Whitelist] Anfrage von ${payload.playerName} (${payload.discordId ?? 'no discord'}) -> Code: ${payload.whitelistCode}`);
    } catch (err) {
        alt.logError('Fehler beim Senden der Whitelist-Anfrage:', err);
    }
}
