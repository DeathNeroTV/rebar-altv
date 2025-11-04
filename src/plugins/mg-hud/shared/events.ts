export const HudEvents = {
    toServer: {
        updateFuel: 'mg-hud:vehicle:fuel',
        sendLabelDataToServer: 'mg-hud:send:data:from:webview'
    },
    toWebview: {
        syncTime: 'mg-hud:sync:time',
        updatePlayer: 'mg-hud:player:update',
        updateVehicle: 'mg-hud:vehicle:update',
        toggleVehicle: 'mg-hud:vehicle:visible',
    },
};