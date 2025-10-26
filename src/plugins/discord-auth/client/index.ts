import * as alt from 'alt-client';
import { AuthEvents } from '../shared/events.js';

async function getDiscordToken(applicationIdentifier: string) {
    let bearerToken: string;

    try {
        bearerToken = await alt.Discord.requestOAuth2Token(applicationIdentifier);
    } catch (err) {
        console.log('Error getDiscordToken');
        console.log(err);
    }

    alt.emitServer(AuthEvents.toServer.pushToken, bearerToken);
}

alt.onServer(AuthEvents.toClient.requestToken, getDiscordToken);