export const DeathEvents = {
    toServer: {
        startRevive: 'mg-death:revive:start',
        toggleProgress: 'mg-death:start:progress',
        toggleRespawn: 'mg-death:toggle:respawn',
        toggleEms: 'mg-death:toggle:ems',
        toggleRevive: 'mg-death:toggle:revive',
    },
    toClient: {
        moveTo: 'mg-death:move:to',
        startTimer: 'mg-death:timer:start',
        stopTimer: 'mg-death:timer:stop',
        startRevive: 'mg-death:revive:start',
        reviveProgress: 'mg-death:revive:progress',
        reviveComplete: 'mg-death:revive:complete',
        stopRevive: 'mg-death:revive:stop',
        confirmEms: 'mg-death:call:ems:confirmed',
        respawned: 'mg-death:respawned',
    }
}