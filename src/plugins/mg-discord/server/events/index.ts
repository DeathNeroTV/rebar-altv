import {Client} from "discord.js";
import {getClient} from "../bot.js";

const _TAG = "[DISCORD-EVENTS]";
let client: Client = undefined;

export function init() {
    client = getClient();
}