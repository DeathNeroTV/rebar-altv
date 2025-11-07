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

export interface LoginResponse {
    success: boolean;
    username?: string;
    discordId?: string;
    permissions?: string[];
    reason?: string;
}