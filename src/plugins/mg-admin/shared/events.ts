export const AdminEvents = {
    toClient: {
        send: {
            stats: 'mg-admin:send:stats'
        }
    },
    toServer: {
        logout: 'mg-admin:logout',
        request: {
            stats: 'mg-admin:request:stats'
        }
    }
};