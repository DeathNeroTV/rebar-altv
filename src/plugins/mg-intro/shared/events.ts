export const introEvents = {
    toServer: {
        start: 'mg-intro:start',
        request: 'mg-intro:load:plugins',
        finished: 'mg-intro:finished'
    },
    toClient: {
        start: 'mg-intro:start',
        stop: 'mg-intro:stop'
    }
}