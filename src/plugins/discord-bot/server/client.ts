import {Client, GatewayIntentBits, Interaction} from "discord.js";
import {DiscordConfig} from "./config.js";
import * as alt from 'alt-server';

type DiscordCallback = (interaction: Interaction) => Promise<void>;

export interface Command {
    name: string;
    description: string;
    callback: DiscordCallback;
    inputs?: CommandInput[];
}

export interface CommandInput {
    name: string;
    description: string;
    type: 'STRING' | 'INTEGER' | 'USER';
    isRequired?: boolean;
    isAutocomplete?: boolean;
}

export const client: Client = new Client({
    intents: [GatewayIntentBits.Guilds, ...DiscordConfig.INTENTS]
});
export const commands: Command[] = [];

export function registerCommand(command: Command) {
    commands.push(command);
    alt.log('[DISCORD] register command:', command.name);
}