import * as alt from 'alt-server';
import { useRebar } from '@Server/index.js';
import { Account, Character } from '@Shared/types/index.js';
import { checkDiscordAccess, sendWhitelistRequestToChannel } from './discordBot.js';
import crypto from 'crypto';

const Rebar = useRebar();
const db = Rebar.database.useDatabase();
const ServerConfig = Rebar.useServerConfig();

const WHITELIST_COLLECTION = 'WhitelistCodes';
ServerConfig.set('hideMinimapInPage', true);

type AccountExtended = Account & { username: string };

// =================== Player Connect ===================
alt.on('playerConnect', async (player) => {
    player.pos = new alt.Vector3(0, 0, 100);
    player.frozen = true;
    player.visible = false;
    player.dimension = player.id + 1;

    await alt.Utils.wait(1000);

    const rPlayer = Rebar.usePlayer(player);
    rPlayer.world.freezeCamera(true);
    rPlayer.webview.show('Authentication', 'page');
    rPlayer.world.setScreenBlur(200);
    rPlayer.world.disableControls();
});

// =================== Whitelist-Code Generator ===================
export async function generateWhitelistCode(length = 6): Promise<string> {
    let code: string;
    let exists = true;
    let attempts = 0;

    while (exists && attempts < 10) {
        attempts++;
        code = crypto.randomBytes(Math.ceil(length / 2)).toString('hex').slice(0, length).toUpperCase();
        const existing = await db.get({ code }, WHITELIST_COLLECTION);
        if (!existing) exists = false;
    }

    if (exists) throw new Error('Konnte keinen eindeutigen Whitelist-Code generieren (zu viele Kollisionen)');

    await db.create({ code, createdAt: Date.now(), used: false }, WHITELIST_COLLECTION);
    return code!;
}

// =================== Save Whitelist Request ===================
async function saveWhitelistRequest(accountId: string | undefined, playerName: string, discordId: string | undefined, code: string) {
    const payload = {
        accountId: accountId ?? null,
        playerName,
        discordId: discordId ?? null,
        code,
        status: 'pending',
        createdAt: Date.now(),
    };
    try {
        await db.create(payload, 'WhitelistRequests');
    } catch (err) {
        console.error('Fehler beim Speichern der Whitelist-Anfrage:', err);
    }
}

// =================== Login Handler ===================
async function handleLogin(player: alt.Player, document: AccountExtended) {
    const account = Rebar.document.account.useAccountBinder(player).bind(document);
    const characters = await account.getCharacters();
    if (characters.length <= 0) {
        const accountId = account.getField<AccountExtended>('_id');
        const username = account.getField<AccountExtended>('username');

        const _id = await db.create<Character>(
            { account_id: accountId, name: username },
            Rebar.database.CollectionNames.Characters
        );

        const charDoc = await db.get<Character>({ _id }, Rebar.database.CollectionNames.Characters);
        Rebar.document.character.useCharacterBinder(player).bind(charDoc);
        return;
    }

    Rebar.document.character.useCharacterBinder(player).bind(characters[0]);
    finish(player);
}

function finish(player: alt.Player) {
    player.frozen = false;
    player.visible = true;
    player.dimension = 0;
    player.model = 'mp_m_freemode_01';
    player.spawn(new alt.Vector3(-864.14, -172.62, 37.79));

    const rPlayer = Rebar.usePlayer(player);
    rPlayer.world.freezeCamera(false);
    rPlayer.world.clearScreenBlur(200);
    rPlayer.world.enableControls();
    rPlayer.webview.hide('Authentication');
}

// =================== RPC Handler ===================
alt.onRpc('authenticate:login', async (player: alt.Player, username: string, password: string) => {
    const results = await db.getMany<AccountExtended>({ username }, Rebar.database.CollectionNames.Accounts);
    const discordId = player.discordID;
    let document: AccountExtended;

    // Registrieren
    if (results.length <= 0) {
        const pbkdf2Password = Rebar.utility.password.hash(password);
        const _id = await db.create(
            { username, password: pbkdf2Password, discordId },
            Rebar.database.CollectionNames.Accounts
        );
        document = await db.get<AccountExtended>({ _id }, Rebar.database.CollectionNames.Accounts);
    } else {
        document = results[0];
        if (!Rebar.utility.password.check(password, document.password)) {
            return { success: false, reason: 'wrong_password' };
        }
    }

    const accountId = document._id as string | undefined;
    const discordCheck = await checkDiscordAccess(discordId);

    if (discordCheck.onServer && discordCheck.hasRole) {
        await handleLogin(player, document);
        return { success: true };
    }

    // Kein Discord oder keine Rolle → Whitelist-Code generieren & Team benachrichtigen
    const code = await generateWhitelistCode(6);
    await saveWhitelistRequest(accountId, username, discordId, code);

    await sendWhitelistRequestToChannel({
        playerName: username,
        accountId,
        discordId: discordId ?? null,
        whitelistCode: code,
    });

    return { success: false, whitelistRequested: true, whitelistCode: code, reason: 'discord_missing_or_no_role' };
});
