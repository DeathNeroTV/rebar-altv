export const DeathEvents = {
    toServer: {
        startRevive: 'mg-death:revive:start',
        toggleRespawn: 'mg-death:toggle:respawn',
        toggleEms: 'mg-death:toggle:ems',
        toggleRevive: 'mg-death:toggle:revive',
    },
    toWebview: {
        confirmEms: 'mg-death:webview:ems:confirmed',
        reviveProgress: 'mg-death:webview:revive:progress',
        reviveComplete: 'mg-death:webview:revive:complete',
        startTimer: 'mg-death:webview:timer:start',
        stopTimer: 'mg-death:webview:timer:stop',
        startRevive: 'mg-death:webview:revive:start',
        stopRevive: 'mg-death:webview:revive:stop',
        respawned: 'mg-death:webview:respawned'
    },
    toClient: {
        startTimer: 'mg-death:timer:start',
        stopTimer: 'mg-death:timer:stop',
        startRevive: 'mg-death:revive:start',
        reviveProgress: 'mg-death:revive:progress',
        reviveComplete: 'mg-death:revive:complete',
        stopRevive: 'mg-death:revive:stop',
        confirmEms: 'mg-death:ems:confirmed',
        respawned: 'mg-death:respawned',
    }
}