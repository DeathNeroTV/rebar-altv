export const DiscordAuthEvents = {
    toServer: {
        connected: 'discord:event:connected',
        pushToken: 'discord:event:pushToken'
    },
    toClient: {
        openUrl: 'discord:event:open:url',
        requestToken: 'discord:event:requestToken'
    },
    toWebview: {
        send: 'discord:event:send'
    }
};