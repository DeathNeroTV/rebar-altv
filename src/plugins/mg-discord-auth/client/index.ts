import * as alt from 'alt-client';
import { DiscordAuthEvents } from '../shared/events.js';
import { useWebview } from '@Client/webview/index.js';

alt.onRpc(DiscordAuthEvents.toClient.requestToken, async(appId: string) => {
    return await alt.Discord.requestOAuth2Token(appId);
});
