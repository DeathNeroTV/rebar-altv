import * as alt from 'alt-server';
import { useDiscord } from "@Plugins/mg-discord/server/api.js";
import {DiscordAuthConfig} from "../shared/config.js";
import {Client, GuildMember} from "discord.js";
import {DiscordInfo} from "../shared/interfaces.js";
import * as https from "node:https";

let client: Client = undefined;

export function requestInit() {
    if (!DiscordAuthConfig.SERVER_ID || DiscordAuthConfig.SERVER_ID.length <= 3) return;

    client = useDiscord().client();
    if (!client) alt.logError('[Discord-Auth]', 'no discord client found');
    else alt.log('[Discord-Auth]', 'discord client found');
}

export async function getCurrentUser(token: string): Promise<DiscordInfo | undefined> {
    return new Promise<DiscordInfo | undefined>((resolve, reject) => {
        https.get("https://discord.com/api/users/@me", {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': `Bearer ${token}`,
            }
        }, (res) => {
            if (res.statusCode !== 200) {
                reject(new Error(`HTTP Error: ${res.statusCode}`));
                res.resume(); // Consume response data to free up memory
                return;
            }

            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => {
                try {
                    const parsedData = JSON.parse(data) as DiscordInfo;
                    resolve(parsedData);
                } catch (e) {
                    reject(new Error("Failed to parse response"));
                }
            });
        }).on('error', (e) => {
            reject(new Error(`Request Error: ${e.message}`));
        });
    });
}

export async function getGuildMember(userId: string): Promise<GuildMember> {
    if (!client) return undefined;
    
    const guild = client.guilds.cache.get(DiscordAuthConfig.SERVER_ID) ?? await client.guilds.fetch(DiscordAuthConfig.SERVER_ID);
    const cached = guild.members.cache.get(userId);
    if (cached) return cached;

    try {
        const member = await guild.members.fetch(userId);
        return member;
    } catch (err) { return undefined; }
}