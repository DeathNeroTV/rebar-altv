export interface DiscordInfo {
    id: string;
    username: string;
    avatar: string;
    mfa_enabled: boolean;
    email: string;
    discriminator: string;
}

export interface DiscordSession {
    id: number;
    expiration: number;
    finished?: boolean;
}

export interface WhitelistRequest {
    _id?: string;
    username: string;
    discordId: string;
    code: string;
    date: string;
    state: 'pending' | 'approved' | 'rejected'
}