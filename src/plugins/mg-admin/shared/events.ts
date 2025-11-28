export const AdminEvents = {
    toClient: {
        whitelist: {
            add: 'mg-admin:whitelist:add',
            update: 'mg-admin:whitelist:update',
            remove: 'mg-admin:whitelist:remove'
        },
        waypoint: 'mg-admin:waypoint:get',
        ghosting: {
            toggle: 'mg-admin:ghost:toggle',
        },
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
            reject: 'mg-admin:whitelist:reject',
            delete: 'mg-admin:whitelist:delete',
        },
        ghosting: {
            toggle: 'mg-admin:ghost:toggle',
            request: 'mg-admin:ghost:request',
        },
        request: {
            owner: 'mg-admin:request:owner',
            usage: 'mg-admin:request:usage',
            stats: 'mg-admin:request:stats',
            whitelist: 'mg-admin:request:whitelist',
            player: 'mg-admin:request:player',
            items: 'mg-admin:request:items',
            weapons: 'mg-admin:request:weapons',
            configs: 'mg-admin:request:configs',
            user: {
                account: 'mg-admin:request:user:account',
                ban: 'mg-admin:request:user:ban',
                unban: 'mg-admin:request:user:unban',
                vehicles: 'mg-admin:request:user:vehicles',
                characters: 'mg-admin:request:user:characters',
                logs: 'mg-admin:request:user:logs',
                create: {
                    character: 'mg-admin:user:create:character',
                    vehicle: 'mg-admin:user:create:vehicle',
                },
                edit: {
                    account: 'mg-admin:user:edit:account',
                    character: 'mg-admin:user:edit:character',
                    vehicle: 'mg-admin:user:edit:vehicle',
                },
                delete: {
                    account: 'mg-admin:user:delete:account',
                    character: 'mg-admin:user:delete:character',
                    vehicle: 'mg-admin:user:delete:vehicle',
                },
            },
            vehicle: {
                fix: 'mg-admin:request:vehicle:repair',
                fuel: 'mg-admin:request:vehicle:refuel',
            },
        },
        item: {
            create: 'mg-admin:item:create',
            save: 'mg-admin:item:save',
            delete: 'mg-admin:item:delete',
        },
        teleport: 'mg-admin:server:teleport',
        action: 'mg-admin:action:invoke',
    }
};