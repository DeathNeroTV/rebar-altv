export interface TargetOption {
    label: string;
    event?: string;
    type?: EventType;
    icon?: string;
    data?: Record<string, any>;
}

export type EventType = 'server' | 'client';
export type TargetType = 'model' | 'zone' | 'entity';

export interface RayCastHit {
    pos:  { x: number; y: number; z: number };
    entityHit: number;
}

export interface TargetDefinition {
    id: string;
    type: TargetType;
    model?: number;
    entityId?: number;
    position?: { x: number, y: number, z: number };
    radius?: number;
    options?: TargetOption[];
}

export interface TargetingAPI {
    addModel(model: number, options: TargetOption[]): void;
    addZone(pos: { x: number, y: number, z: number }, radius: number, options: TargetOption[]): void;
    addEntity(entityId: number, options: TargetOption[]): void;
    removeTarget(id: string): void;
}