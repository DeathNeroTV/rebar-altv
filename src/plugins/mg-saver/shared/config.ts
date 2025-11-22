export interface StateConfig {
    _id?: string;
    name: string;
    update: {
        vehicles: boolean;
        players: boolean;
    }
    intervalInSeconds: number; 
}

export const Config: StateConfig = {
    name: 'State Saver Config',
    intervalInSeconds: 5,
    update: {
        vehicles: true,
        players: true,
    }
}