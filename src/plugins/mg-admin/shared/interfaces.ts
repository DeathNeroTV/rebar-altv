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

export interface PlayerStats {
    id: number; 
    name: string;
    ping: number;
    health: number;
    armour: number;
    pos?: { x: number; y: number; z: number };
    job?: string | string[]; 
}

export interface AdminAction {
    type: ActionType;
    playerId: number;
    reason?: string;
    amount?: number;
    itemId?: string;
    weaponId?: string;
    teleportType?: TeleportType;
    giveType?: GiveType;
    value?: any;
}

export interface DropDownOption {
    label: string;
    value: string | number | GiveType | ActionType | TeleportType;
}
