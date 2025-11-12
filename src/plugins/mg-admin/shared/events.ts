export const AdminEvents = {
    toClient: {
        whitelist: {
            add: 'mg-admin:whitelist:add',
            update: 'mg-admin:whitelist:update',
            remove: 'mg-admin:whitelist:remove'
        }
    },
    toWebview: {
        whitelist: {
            add: 'mg-admin:webview:whitelist:add',
            update: 'mg-admin:webview:whitelist:update',
        },
        send: {
            whitelist: 'mg-admin:send:whitelist',
            stats: 'mg-admin:send:stats'
        }
    },
    toServer: {
        login: 'mg-admin:login',
        logout: 'mg-admin:logout',
        whitelist: {
            approve: 'mg-admin:whitelist:approve',
            reject: 'mg-admin:whitelist:reject'
        },
        request: {
            usage: 'mg-admin:request:usage',
            stats: 'mg-admin:request:stats',
            whitelist: 'mg-admin:request:whitelist',
            player: 'mg-admin:request:player',
            items: 'mg-admin:request:items',
            weapons: 'mg-admin:request:weapons',
        },
        action: 'mg-admin:action:invoke',
    }
};