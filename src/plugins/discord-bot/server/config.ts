import {GatewayIntentBits} from "discord.js";

export const DiscordConfig = {
    CLIENT_ID: "",
    APPLICATION_ID: "",
    SERVER_ID: "",
    BOT_TOKEN: "",
    BOT_STATES: [
        "[_player_count_/250] players connected",
        "_vehicle_count_ vehicles spawned",
        "sooo funny"
    ],
    BOT_WEBSITE_URL: '',
    INTENTS: [
        GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers
    ],
    DISABLE_DEFAULT_COMMANDS: false,
}