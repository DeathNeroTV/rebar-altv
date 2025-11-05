export const HudEvents = {
    toServer: {
        updateFuel: 'mg-hud:vehicle:fuel',
        updateStats: 'mg-hud:player:stats',
    },
    toWebview: {
        syncTime: 'mg-hud:sync:time',
        updateDead: 'mg-hud:player:dead',
        updatePlayer: 'mg-hud:player:update',
        updateVehicle: 'mg-hud:vehicle:update',
        toggleVehicle: 'mg-hud:vehicle:visible',
    },
};