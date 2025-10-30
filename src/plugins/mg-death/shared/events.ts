export const DeathEvents = {
    toServer: {
        toggleRespawn: 'death:screen:respawn',
        callEms: 'death:screen:call:ems',
        startRevive: 'death:screen:revive:start',
        reviveTarget: 'death:screen:revive:target',
    },
    toClient: {
        startTimer: 'death:screen:timer:start',
        stopTimer: 'death:screen:timer:stop',
        startRevive: 'death:screen:revive:start',
        reviveProgress: 'death:screen:revive:progress',
        reviveComplete: 'death:screen:revive:complete',
        stopRevive: 'death:screen:revive:stop',
        confirmEms: 'death:screen:call:ems:confirmed',
        respawned: 'death:screen:respawned',
    }
}