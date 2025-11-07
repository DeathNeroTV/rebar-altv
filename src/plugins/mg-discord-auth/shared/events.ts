export const DiscordAuthEvents = {
    toServer: {
        connected: 'discord:event:connected',
        pushToken: 'discord:event:pushToken'
    },
    toClient: {
        requestToken: 'discord:event:requestToken'
    },
    toWebview: {
        send: 'discord:event:send'
    }
};