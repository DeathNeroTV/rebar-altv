export interface WhitelistRequest {
    _id?: string;
    accountId?: string;
    username: string;
    status: 'pending' | 'approved' | 'denied';
    discord?: string | null;
    code: string;
    createdAt: number;
}

export interface WhitelistCode {
    code: string;
    createdAt: number;
}