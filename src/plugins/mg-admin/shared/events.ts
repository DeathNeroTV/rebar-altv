export const AdminEvents = {
    toClient: {
        send: {
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