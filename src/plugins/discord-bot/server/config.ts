import {GatewayIntentBits} from "discord.js";

export const DiscordConfig = {
    CLIENT_ID: "1284150599490998376",
    APPLICATION_ID: "1284150599490998376",
    SERVER_ID: "1284160784364081295",
    BOT_TOKEN: "MTI4NDE1MDU5OTQ5MDk5ODM3Ng.GQl6OX.sDL7qnAPl44eSE9bzcAXdOnLyac6tqu9iLtRyo",
    BOT_STATES: [
        "[_player_count_/250] Spieler verbunden",
        "_vehicle_count_ Fahrzeuge erstellt",
        "sooo funny"
    ],
    BOT_WEBSITE_URL: '',
    INTENTS: [
        GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers
    ],
    DISABLE_DEFAULT_COMMANDS: false,
}