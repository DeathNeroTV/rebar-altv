export interface DashboardStat {
    id: string;
    title: string;
    value: number;
    icon: string;
    color: string;
};

export interface WhitelistEntry {
    _id: string;
    username: string;
    discordId: string;
    code: string;
    date: string;
}

export interface LoginResponse {
    success: boolean;
    username?: string;
    discordId?: string;
    permissions?: string[];
    reason?: string;
}