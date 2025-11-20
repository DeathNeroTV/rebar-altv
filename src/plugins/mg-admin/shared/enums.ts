export enum ActionType {
    KICK = 'kick',
    BAN = 'ban',
    TELEPORT = 'teleport',
    SPECTATE = 'spectate',
    HEAL = 'heal',
    GIVE = 'give',
    TAKE = 'take',
    FREEZE = 'freeze',
    KILL = 'kill',
};

export enum TeleportType {
    GO_TO = 'goto',
    GET_HERE = 'gethere',
    WAYPOINT = 'waypoint',
    COORDS = 'coords',
};

export enum GiveType {
    CASH = 'cash',
    BANK = 'bank',
    WEAPON = 'weapon',
    ITEM = 'item',
};