export const HudEvents = {
    toServer: {
        updateFuel: 'mg-hud:vehicle:fuel',
        updateStats: 'mg-hud:player:stats',
        fetchId: 'mg-hud:player:id',
        loadPlayer: 'mg-hud:player:load'
    },
    toClient: {
        syncTime: 'mg-hud:sync:time',
    },
    toWebview: {
        syncTime: 'mg-hud:sync:time',
        updatePlayer: 'mg-hud:player:update',
        updateVehicle: 'mg-hud:vehicle:update',
        toggleVehicle: 'mg-hud:vehicle:visible',
    },
};