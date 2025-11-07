export const AdminEvents = {
    toClient: {
        whitelist: {
            add: 'mg-admin:whitelist:add',
            remove: 'mg-admin:whitelist:remove'
        }
    },
    toWebview: {
        send: {
            whitelist: 'mg-admin:send:whitelist',
            stats: 'mg-admin:send:stats'
        }
    },
    toServer: {
        login: 'mg-admin:login',
        logout: 'mg-admin:logout',
        request: {
            usage: 'mg-admin:request:usage',
            stats: 'mg-admin:request:stats',
            whitelist: 'mg-admin:request:whitelist'
        }
    }
};