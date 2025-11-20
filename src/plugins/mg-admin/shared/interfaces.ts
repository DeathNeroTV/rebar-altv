import { ActionType, GiveType, TeleportType } from "./enums.js";

export interface DashboardStat {
    id: string;
    title: string;
    value: number;
    icon: string;
};

export interface SidebarInfo {
    icon: string;
    label: string;
    id: string;
    color: string;
}

export interface WhitelistRequest {
    _id?: string;
    username: string;
    discordId: string;
    code: string;
    date: string;
    state: 'pending' | 'approved' | 'rejected';
}

export interface PlayerLog {
    character_id?:string;
    timestamp: number;
    category: 'trade' | 'bank' | 'rule' | 'job' | 'team' | 'other';
    action: string;
    details?: string;
}

export interface PlayerStats {
    id: number; 
    account_id: string;
    name: string;
    ping: number;
    health: number;
    armour: number;
    pos?: { x: number; y: number; z: number };
    rot?: { x: number; y: number; z: number };
    job?: string | string[]; 
}

export interface AdminAction {
    type: ActionType;
    playerId: number;
    reason?: string;
    coords?: { x: number; y: number; z: number };
    amount?: number;
    itemId?: string;
    teleportType?: TeleportType;
    giveType?: GiveType;
    value?: any;
}

export interface DropDownOption {
    label: string;
    value: string | number | GiveType | ActionType | TeleportType;
}
