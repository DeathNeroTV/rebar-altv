import * as alt from 'alt-server';
import { DiscordAuthConfig } from './config.js';
import { DiscordAuthEvents } from '../shared/events.js';
import { useRebar } from '@Server/index.js';
import { Account, ServerConfig } from '@Shared/types/index.js';
import { getCurrentUser, getUserGuildMember, requestInit } from "./requests.js";
import { DiscordInfo, DiscordSession, WhitelistRequest } from "../shared/interfaces.js";
import { useTranslate } from "@Shared/translate.js";
import { invokeLogin, invokeWhitelistRequest } from './api.js';
import '../translate/index.js';
import { getClient } from '@Plugins/mg-discord-bot/server/bot.js';
import { Embed, EmbedBuilder, TextChannel } from 'discord.js';

const Rebar = useRebar();
const db = Rebar.database.useDatabase();
const { t } = useTranslate('de');

const sessions: Array<DiscordSession> = [];
const serverConfig = Rebar.useServerConfig();

const sections = [
    'disableVehicleSeatSwap',
    'disableAmbientNoise',
    'disableWeaponRadial',
    'disableCriticalHits',
    'disablePistolWhip',
    'hideHealthArmour',
    'hideAreaName',
    'hideMinimapInPage',
    'hideMinimapOnFoot',
    'hideStreetName',
    'hideVehicleClass',
    'hideVehicleName',
] as const satisfies (keyof ServerConfig)[];

sections.forEach(section => serverConfig.set(section, true));

requestInit();

function handleConnect(player: alt.Player) {
    const playerWorld = Rebar.player.useWorld(player);

    player.dimension = player.id + 1;
    playerWorld.setScreenFade(0);

    sessions.push({
        id: player.id,
        expiration: Date.now() + 60000 * DiscordAuthConfig.SESSION_EXPIRE_TIME_IN_MINUTES
    });

    const view = Rebar.player.useWebview(player);
    view.show("DiscordAuth", "page");

    player.emit(DiscordAuthEvents.toClient.requestToken, DiscordAuthConfig.APPLICATION_ID);
}

async function handleToken(player: alt.Player, token: string) {
    if (!player || !player.valid) return;

    setSessionFinish(player);

    if (!token) {
        player.kick(t("discord.auth.token.failed"));
        return;
    }

    const currentUser = await getCurrentUser(token) as DiscordInfo | undefined;
    if (!currentUser) {
        player.kick(t("discord.auth.request.failed"));
        return;
    }

    let account = await db.get<Account>(
        { discord: currentUser.id },
        Rebar.database.CollectionNames.Accounts
    );

    if ( !account ) {
        const _id = await db.create<Partial<Account>>(
            {
                discord: currentUser.id,
                email: currentUser.email,
            },
            Rebar.database.CollectionNames.Accounts
        );
        account = await db.get<Account>({ _id }, Rebar.database.CollectionNames.Accounts);
    }

    if (!account) {
        player.kick(t("discord.auth.account.failed"));
        return;
    }

    if (!account.email) {
        account.email = currentUser.email;
        await db.update<Account>
    }

    if (account.banned) {
        player.kick(account.reason || t("discord.auth.banned.no.reason"));
        return;
    }

    if (DiscordAuthConfig.SERVER_ID && DiscordAuthConfig.SERVER_ID.length !== 0) {
        try {
            const guildMember = await getUserGuildMember(currentUser.id);
            if (!guildMember) {
                player.kick(t("discord.auth.guild.no.member"));
                return;
            }
    
            if (DiscordAuthConfig.WHITELIST_ROLE_ID && DiscordAuthConfig.WHITELIST_ROLE_ID.length !== 0) {
                const role = guildMember.roles.cache.get(DiscordAuthConfig.WHITELIST_ROLE_ID);
                if (!role) {
                    let request = await db.get<WhitelistRequest>({ discordId: currentUser.id }, 'WhitelistRequests');
                    if (!request) {
                        request = {
                            code: '',
                            date: Date.now().toLocaleString(),
                            discordId: guildMember.id,
                            username: guildMember.displayName
                        };
                        const _id = await db.create<WhitelistRequest>(request, 'WhitelistRequests');
                        request._id = _id;

                        invokeWhitelistRequest(player, request);
                        const channel: TextChannel = await getClient().channels.fetch(DiscordAuthConfig.WHITELIST_CHANNEL_ID) as TextChannel;
                        const embed = new EmbedBuilder()
                            .setAuthor({ name: guildMember.nickname })
                            .setFields([
                                { name: 'Id', value: request._id },
                                { name: 'Name', value: guildMember.nickname },
                                { name: 'Code', value: request.code},
                            ])
                            .setTitle('Whitelist Anfrage')
                            .setTimestamp();
                        await channel.send({ embeds: [embed] });
                        Rebar.player.useWebview(player).emit(DiscordAuthEvents.toWebview.send, t('discord.auth.guild.request.whitelist', { code: request.code }));
                    } else player.kick(t('discord.auth.guild.no.whitelist'));
                    return;
                }
            }
        } catch (error) {
            if (error.code === 10007) player.kick(t("discord.auth.guild.no.member"));
            else player.kick(t("discord.auth.request.failed"));
            return;
        }
    }

    setAccount(player, account);
}

function cleanupSessions() {
    let count = 0;
    for (let i = sessions.length - 1; i >= 0; i--) {
        if (sessions[i].expiration > Date.now() && !sessions[i].finished) {
            continue;
        }

        const player = alt.Player.all.find((x) => x.id === sessions[i].id);
        if (player && player.valid && !sessions[i].finished) 
            player.kick(t("discord.auth.expired.session"));

        count += 1;
        sessions.splice(i, 1);
        break;
    }
}

function setSessionFinish(player: alt.Player) {
    const sessionIndex = sessions.findIndex((x) => x.id === player.id);
    if (sessionIndex <= -1) {
        player.kick(t("discord.auth.no.session"));
        return;
    }

    if (sessions[sessionIndex].finished) {
        player.kick(t("discord.auth.already.complete"));
        return;
    }

    sessions[sessionIndex].finished = true;


    if (Date.now() > sessions[sessionIndex].expiration) {
        player.kick(t("discord.auth.expired.session"));
        return;
    }

}

function setAccount(player: alt.Player, account: Account) {
    Rebar.document.account.useAccountBinder(player).bind(account);
    const playerWorld = Rebar.player.useWorld(player);
    const view = Rebar.player.useWebview(player);

    playerWorld.clearScreenFade(500);
    view.hide("DiscordAuth");

    invokeLogin(player, account);
}

async function init() {
    const introApi = await Rebar.useApi().getAsync('mg-intro-api');    
    introApi.onFinished(handleConnect);
    
    alt.onClient(DiscordAuthEvents.toServer.connected, handleConnect);
    alt.onClient(DiscordAuthEvents.toServer.pushToken, handleToken);
    alt.setInterval(cleanupSessions, 5000);
}

init();