export interface TargetOption {
    label: string;
    event: string;
}

export interface TargetData {
    id: number;
    type: 'player' | 'vehicle' | 'object';
    options: TargetOption[];
}