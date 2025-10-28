export const DeathEvents = {
    toServer: {
        toggleRespawn: 'death:screen:respawn',
        callEms: 'death:screen:call:ems'
    },
    toClient: {
        startTimer: 'death:screen:timer:start',
        updateTimer: 'death:screen:timer:update',
        startRevive: 'death:screen:revive:start',
        confirmEms: 'death:screen:call:ems:confirmed',
        respawned: 'death:screen:respawned',
        stopRevive: 'death:screen:revive:stop',
    }
}