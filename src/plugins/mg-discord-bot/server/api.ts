import {useRebar} from "@Server/index.js";
import {DiscordConfig} from "./config.js";
import {getClient} from "./bot.js";
import {registerCommand} from "./client.js";
import { GuildMember } from "discord.js";

const Rebar = useRebar();

export function useDiscord() {
    function client() {
        return getClient();
    }

    function getConfig() {
        return DiscordConfig;
    }

    async function getDiscordMember(discordId: string): Promise<GuildMember> {
        const client = getClient();
        
        const guild = await client.guilds.fetch(DiscordConfig.SERVER_ID);
        if (!guild) {
            console.error(`[Discord] Gilde ${DiscordConfig.SERVER_ID} nicht gefunden.`);
            return null;
        }

        try {
            const member = await guild.members.fetch(discordId);
            if (!member) {
                console.warn(`[Discord] Kein Mitglied mit ID ${discordId} gefunden.`);
                return null;
            }

            return member;
        } catch (err) { return null; }
    }

    return {
        client,
        getConfig,
        getDiscordMember,
        registerCommand
    }
}

declare global {
    export interface ServerPlugin {
        ['discord-api']: ReturnType<typeof useDiscord>;
    }
}

Rebar.useApi().register('discord-api', useDiscord());