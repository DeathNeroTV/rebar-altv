export const DeathEvents = {
    toServer: {
        checkState: 'mg-death:check:state',
        toggleRespawn: 'mg-death:toggle:respawn',
        toggleEms: 'mg-death:toggle:ems',
        toggleRevive: 'mg-death:toggle:revive',
        startRevive: 'mg-death:revive:start',
        reviveComplete: 'mg-death:revive:complete',
    },
    toWebview: {
        confirmEms: 'mg-death:webview:ems:confirmed',
        reviveComplete: 'mg-death:webview:revive:complete',
        startTimer: 'mg-death:webview:timer:start',
        stopTimer: 'mg-death:webview:timer:stop',
        startRevive: 'mg-death:webview:revive:start',
        stopRevive: 'mg-death:webview:revive:stop',
        respawned: 'mg-death:webview:respawned'
    },
    toClient: {
        startRescue: 'mg-death:start:rescue',
        startTimer: 'mg-death:timer:start',
        stopTimer: 'mg-death:timer:stop',
        startRevive: 'mg-death:revive:start',
        reviveProgress: 'mg-death:revive:progress',
        reviveComplete: 'mg-death:revive:complete',
        stopRevive: 'mg-death:revive:stop',
        confirmEms: 'mg-death:ems:confirmed',
        respawned: 'mg-death:player:respawn',
    }
}