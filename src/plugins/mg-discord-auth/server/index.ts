import * as alt from 'alt-server';
import { DiscordAuthConfig } from './config.js';
import { DiscordAuthEvents } from '../shared/events.js';
import { useRebar } from '@Server/index.js';
import { Account, ServerConfig } from '@Shared/types/index.js';
import { getCurrentUser, getGuildMember, requestInit } from "./requests.js";
import { DiscordInfo, DiscordSession, WhitelistRequest } from "../shared/interfaces.js";
import { useTranslate } from "@Shared/translate.js";
import { invokeLogin, invokeWhitelistRequest } from './api.js';
import '../translate/index.js';
import { getClient } from '@Plugins/mg-discord/server/bot.js';
import { EmbedBuilder, TextChannel } from 'discord.js';
import { CollectionNames } from '@Server/document/shared.js';
import { useIntroApi } from '@Plugins/mg-intro/server/api.js';

const Rebar = useRebar();
const db = Rebar.database.useDatabase();
const { t } = useTranslate('de');

const sessionKey = 'can-auth-account';
const sessions: Array<DiscordSession> = [];
const serverConfig = Rebar.useServerConfig();

const disable = [
    'disableVehicleEngineAutoStart',
    'disableVehicleEngineAutoStop',
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

declare module '@Shared/types/account.js' {
    export interface Account {
        username: string;
    }
}

disable.forEach(section => serverConfig.set(section, true));

async function handleFinished(player: alt.Player) {
    player.dimension = player.id + 1;

    sessions.push({
        id: player.id,
        expiration: Date.now() + 60000 * DiscordAuthConfig.SESSION_EXPIRE_TIME_IN_MINUTES
    });
    player.setMeta(sessionKey, true);

    Rebar.player.useWebview(player).show('DiscordAuth', 'page');

    const token: string = await player.emitRpc(DiscordAuthEvents.toClient.requestToken, DiscordAuthConfig.APPLICATION_ID);

    setSessionFinish(player);

    if (!token) {
        Rebar.player.useWebview(player).emit(DiscordAuthEvents.toWebview.send, t("discord.auth.token.failed"));
        return;
    }

    await handleCheckToken(player, token);
}

async function handleCheckToken(player: alt.Player, token: string) {
    const webview = Rebar.player.useWebview(player);
    const currentUser = await getCurrentUser(token) as DiscordInfo | undefined;
    if (!currentUser) {
        webview.emit(DiscordAuthEvents.toWebview.send, t("discord.auth.request.failed"));
        return;
    }

    let account = await db.get<Account>(
        { discord: currentUser.id },
        Rebar.database.CollectionNames.Accounts
    );

    if (!account) {
        const _id = await db.create<Partial<Account>>({
            discord: currentUser.id,
            username: currentUser.username,
            ...(currentUser.email ? { email: currentUser.email } : {})
        }, Rebar.database.CollectionNames.Accounts);
        account = await db.get<Account>({ _id }, Rebar.database.CollectionNames.Accounts);
    }

    if (!account) {
        webview.emit(DiscordAuthEvents.toWebview.send, t("discord.auth.account.failed"));
        return;
    }

    if (account.banned) {
        if (account.time >= Date.now()) {            
            webview.emit(DiscordAuthEvents.toWebview.send, 
                account.reason 
                ? t("discord.auth.banned.with.reason", {reason: account.reason }) 
                : t("discord.auth.banned.no.reason")
            );
            return;
        }
        account.time = 0;
        account.banned = false;
        account.reason = '';
        await db.update<Account>(account, CollectionNames.Accounts);
    }

    if (!account.email) {
        account = { 
            ...account, 
            ...(currentUser.email ? { email: currentUser.email } : {}),
            username: currentUser.username
        };
        await db.update<Account>(account, CollectionNames.Accounts);
    }

    if (DiscordAuthConfig.SERVER_ID && DiscordAuthConfig.SERVER_ID.length !== 0) {
        const guildMember = await getGuildMember(currentUser.id);
        if (!guildMember) {
            webview.emit(DiscordAuthEvents.toWebview.send, t("discord.auth.guild.no.member"));
            return;
        }

        if (DiscordAuthConfig.WHITELIST_ROLE_ID && DiscordAuthConfig.WHITELIST_ROLE_ID.length !== 0) {
            const role = guildMember.roles.cache.get(DiscordAuthConfig.WHITELIST_ROLE_ID);
            const request: WhitelistRequest = await db.get<WhitelistRequest>({ discordId: currentUser.id }, 'WhitelistRequests');

            if (!request) {
                const code = await generateWhitelistCode();
                const data: WhitelistRequest = { code, date: new Date().toLocaleString(), discordId: guildMember.id, username: guildMember.displayName, state: 'pending' };

                const _id = await db.create<WhitelistRequest>(data, 'WhitelistRequests');
                data._id = _id.toString();

                const channel: TextChannel = await getClient().channels.fetch(DiscordAuthConfig.WHITELIST_CHANNEL_ID) as TextChannel;
                const embed = new EmbedBuilder()
                .setAuthor({ name: "Test", })
                .setTitle("Whitelist-Anfrage")
                .addFields(
                    { name: "Id", value: data._id, inline: false },
                    { name: "Name", value: currentUser.username, inline: false },
                    { name: "Code", value: data.code, inline: false },
                    { name: "Status", value: data.state, inline: false },
                )
                .setColor("#008736");
                await channel.send({ embeds: [embed] });

                invokeWhitelistRequest(player, data);
                webview.emit(DiscordAuthEvents.toWebview.send, t('discord.auth.guild.request.whitelist', { code: data.code }));
                return;
            }

            if (!role) { 
                if (request.state === 'pending') {
                    webview.emit(DiscordAuthEvents.toWebview.send, t('discord.auth.guild.pending.whitelist', { code: request.code }));
                    return;
                }

                if (request.state === 'rejected') {
                    webview.emit(DiscordAuthEvents.toWebview.send, t('discord.auth.guild.rejected.whitelist'));
                    return;
                }

                if (request.state === 'approved') {
                    await guildMember.roles.add(DiscordAuthConfig.WHITELIST_ROLE_ID);
                    setAccount(player, account);
                    return;
                }

                webview.emit(DiscordAuthEvents.toWebview.send, t('discord.auth.guild.no.whitelist'));
                return;
            }

            if (request.state === 'pending') {
                webview.emit(DiscordAuthEvents.toWebview.send, t('discord.auth.guild.pending.whitelist', { code: request.code }));
                return;
            }

            if (request.state === 'rejected') {
                await guildMember.roles.remove(DiscordAuthConfig.WHITELIST_ROLE_ID);
                webview.emit(DiscordAuthEvents.toWebview.send, t('discord.auth.guild.rejected.whitelist'));
                return;
            }
        }
    }

    setAccount(player, account);
}

async function generateWhitelistCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const generateCode = () => {
        const random = Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
        return random.slice(0, 3) + '-' + random.slice(3);
    };

    let unique = false;
    let code = '';

    // So lange wiederholen, bis ein unbenutzter Code gefunden wurde
    while (!unique) {
        code = generateCode();
        const existing = await db.get<{ code: string }>({ code }, 'WhitelistRequests');
        if (!existing) unique = true;
    }

    return code;
}

function cleanupSessions(tick: number) {
    if (tick % 5 !== 0) return;

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
    player.deleteMeta(sessionKey);
    Rebar.document.account.useAccountBinder(player).bind(account);

    const playerWorld = Rebar.player.useWorld(player);
    playerWorld.clearScreenFade(500);
    
    Rebar.player.useWebview(player).hide("DiscordAuth");
    invokeLogin(player, account);
}

function init() {
    requestInit();
    useIntroApi().onFinished(handleFinished);
    alt.on('rebar:onTick', cleanupSessions);
}
init();