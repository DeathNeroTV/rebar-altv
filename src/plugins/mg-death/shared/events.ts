export const DeathEvents = {
    toServer: {
        startRevive: 'mg-death:screen:revive:start',
        toggleProgress: 'mg-death:screen:start:progress',
        toggleRespawn: 'mg-death:toggle:respawn',
        toggleEms: 'mg-death:toggle:ems',
        toggleRevive: 'mg-death:toggle:revive',
    },
    toClient: {
        animation: { play: 'mg-death:animation:play', stop: 'mg-death:animation:stop' },
        startTimer: 'mg-death:screen:timer:start',
        stopTimer: 'mg-death:screen:timer:stop',
        startRevive: 'mg-death:screen:revive:start',
        reviveProgress: 'mg-death:screen:revive:progress',
        reviveComplete: 'mg-death:screen:revive:complete',
        stopRevive: 'mg-death:screen:revive:stop',
        confirmEms: 'mg-death:screen:call:ems:confirmed',
        respawned: 'mg-death:screen:respawned',
    }
}