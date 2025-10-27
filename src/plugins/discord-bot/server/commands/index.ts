import alt from "alt-server";
import {
    EmbedBuilder,
    Interaction,
    REST,
    Routes,
    SlashCommandBuilder,
    SlashCommandIntegerOption,
    SlashCommandStringOption,
    SlashCommandUserOption
} from "discord.js";
import {DiscordConfig} from "../config.js";
import {readdir} from "fs/promises";
import {useRebar} from "@Server/index.js";
import {client, commands, registerCommand} from "../client.js";
import {Account, Character} from "@Shared/types/index.js";

const _TAG = "[DISCORD]";
let rest: REST = undefined;
let uptime: number = 0;

const Rebar = useRebar();
const db = Rebar.database.useDatabase();

export async function init() {
    rest = new REST().setToken(DiscordConfig.BOT_TOKEN);
    client.on('interactionCreate', onInteraction);

    if ( !DiscordConfig.DISABLE_DEFAULT_COMMANDS ) {
        registerCommand({
            name: "info",
            description: 'display player character information',
            callback: commandCharacterInfo,
            inputs: [
                { type: 'USER', name: 'target', description: 'player', isRequired: true },
                { type: 'STRING', name: 'character', description: 'character of player', isRequired: true, isAutocomplete: true },
            ]
        });
        registerCommand({
            name: 'kick',
            description: 'kick a player ingame by discord user',
            callback: commandKick,
            inputs: [
                { type: 'USER', name: 'target', description: 'player', isRequired: true },
                { type: 'STRING', name: 'message', description: 'write an message to show', isRequired: true },
            ]
        });
        registerCommand({ name: 'plugins', description: 'shows all plugins', callback: commandPlugin});
        registerCommand({ name: 'uptime', description: 'display how long server is online', callback: commandUptime});
        registerCommand({ name: 'players', description: 'display all players', callback: commandPlayers});
    }


    alt.setInterval(() => {
        uptime++;
    }, 1_000);

    await alt.Utils.wait(10_000); // wait 10 seconds to be sure all plugins have commands registered.
    refreshSlashCommands();
    alt.setInterval(refreshSlashCommands, 60_000 * 120); // refresh every 2 hours
}

async function onInteraction(interaction: Interaction) {
    const command = commands.find((cmd) => cmd.name === interaction.commandName);
    if ( !command ) return;

    await command.callback(interaction);
}

async function refreshSlashCommands() {
    if ( !rest ) return;

    if ( !DiscordConfig.CLIENT_ID || DiscordConfig.CLIENT_ID.length <= 1 ) {
        alt.log(_TAG, "cant start refreshing slash commands, please set 'CLIENT_ID' in Discord-Plugin config");
        return;
    }
    if ( !DiscordConfig.SERVER_ID || DiscordConfig.SERVER_ID.length <= 1 ) {
        alt.log(_TAG, "cant start refreshing slash commands, please set 'SERVER_ID' in Discord-Plugin config");
        return;
    }

    alt.log(_TAG, 'Started refreshing application (/) commands.');
    const slashCommands = [];

    for ( const command of commands ) {
        const slashCommand = new SlashCommandBuilder()
            .setName(command.name)
            .setDescription(command.description);

        if ( command.inputs ) {
            for ( const input of command.inputs ) {
                if ( input.type === "STRING" ) {
                    const commandOption = new SlashCommandStringOption();
                    commandOption.setName(input.name);
                    commandOption.setDescription(input.description);
                    commandOption.setRequired(input.isRequired ?? false);
                    commandOption.setAutocomplete(input.isAutocomplete ?? false);
                    slashCommand.addStringOption(commandOption);

                } else if ( input.type === 'INTEGER' ) {
                    const commandOption = new SlashCommandIntegerOption();
                    commandOption.setName(input.name);
                    commandOption.setDescription(input.description);
                    commandOption.setRequired(input.isRequired ?? false);
                    commandOption.setAutocomplete(input.isAutocomplete ?? false);

                    slashCommand.addIntegerOption(commandOption);
                } else if ( input.type === 'USER' ) {
                    const commandOption = new SlashCommandUserOption();
                    commandOption.setName(input.name);
                    commandOption.setDescription(input.description);
                    commandOption.setRequired(input.isRequired ?? false);

                    slashCommand.addUserOption(commandOption);
                }
            }
        }

        slashCommands.push(slashCommand.toJSON());
    }


    await rest.put(
        Routes.applicationGuildCommands(DiscordConfig.CLIENT_ID, DiscordConfig.SERVER_ID),
        {
            body: slashCommands
        }
    );
    alt.log(_TAG, 'Successfully reloaded application (/) commands.');
}

async function commandUptime(interaction: Interaction) {
    interaction.reply(`Server is up since ${uptime} seconds`);
}

async function commandPlugin(interaction: Interaction) {
    const getDirectories = async source =>
        (await readdir(source, { withFileTypes: true }))
            .filter(dirent => dirent.isDirectory())
            .map(dirent => dirent.name);

    const plugins = await getDirectories("src/plugins/");
    interaction.reply("current plugins installed in RebarV: \n" + plugins.join(", "));
}

async function commandPlayers(interaction: Interaction) {
    interaction.reply("Players Online: " + alt.Player.all.length);
}

async function commandKick(interaction: Interaction) {
    if( !interaction.member.permissions.has("KICK_MEMBERS") )
        return interaction.followUp({ content: "You do not have the power to kick that member.", ephemeral: true });

    const target = interaction.options.get('target');
    const message = interaction.options.get('message');

    const player = await getOnlinePlayerByDiscord(target.value);
    if ( !player ) return interaction.followUp({ content: "Player does not exists!", ephemeral: true });

    player.kick(message.value ?? "Kicked by Discord Member");
    interaction.reply(`${player.name} was successfully kicked. Reason: ${message.value ?? 'no reason'}`);
}

async function commandCharacterInfo(interaction: Interaction): Promise<any> {
    if ( interaction.isAutocomplete() ) {
        const player = interaction.options.get('target');
        const account = await db.get<Account>({discord: player.value as string}, Rebar.database.CollectionNames.Accounts);
        if ( !account ) return await interaction.respond([]);

        const characters = await db.getMany<Character>({account_id: account._id}, Rebar.database.CollectionNames.Characters);
        if ( !characters ) return await interaction.respond([]);

        await interaction.respond(characters.map(char => {
            return {
                name: char.name,
                value: char._id
            }
        }));
        return;
    }

    const character = interaction.options.get("character");
    if ( !character.value ) return interaction.reply("cant fetch character info without character id");

    const char = await db.get<Character>({ _id: character.value }, Rebar.database.CollectionNames.Characters);

    const characterEmbed = new EmbedBuilder()
        .setColor(0x0099FF)
        .setTitle(char.name)
        .setDescription('some character from Rebar, YOOO')
        .addFields(
            { name: 'Dead?', value: char.isDead ? 'Yes' : 'No', inline: true },
            { name: 'Male', value: char.appearance.sex == 0 ? 'No' : 'Yes', inline: true },
        )
        .setFooter({ text: 'character playtime: ' + char.hours });

    interaction.reply({ embeds: [characterEmbed]});
}

async function getOnlinePlayerByDiscord(id: string) {
    const account = await db.get<Account>({discord: id}, Rebar.database.CollectionNames.Accounts);
    return Rebar.get.usePlayerGetter().byAccount(account._id);
}