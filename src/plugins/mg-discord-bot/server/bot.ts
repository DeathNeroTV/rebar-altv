import alt from "alt-server";
import {DiscordConfig} from "./config.js";
import {client} from "./client.js";
import { ActivityType } from "discord.js";

export function init() {
    if ( !DiscordConfig.BOT_TOKEN || DiscordConfig.BOT_TOKEN.length === 0 )
        alt.logError("Bot token is empty");

    client.on('ready', () => {
        alt.log('[DISCORD]', `Logged in as ${client.user.username}!`);
        client.user.setActivity({ name: 'Trial Life Roleplay', state: "server starting", type: ActivityType.Playing });
        alt.setTimeout(() => {
            if (!client) return;
            client.user.setActivity({ name: 'Trial Life Roleplay', state: 'Wartet auf Befehle', type: ActivityType.Listening })
        }, 10000);
    });

    client.login(DiscordConfig.BOT_TOKEN);
}

export function getClient() {
    return client;
}