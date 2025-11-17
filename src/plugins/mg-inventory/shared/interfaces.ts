import { Item } from "@Shared/types/items.js";
import { IWeapon } from "alt-shared";

export interface Inventory {
    owner: string;
    type: 'player' | 'vehicle' | 'storage' | 'shop';
    slots: Item[];
    capacity: number;
}

export interface Modifiers {
    shift: boolean;
    ctrl: boolean;
    alt: boolean;
}

export interface Player {
    id: number;
    name: string;
    phone: string;
    job: string | string[];
    cash: number;
    bank: number;
}

export interface Weapon extends IWeapon {
    hash: number;
    uid: string;
    ammo: number;
    totalAmmo: number;
    ammoType: string;
}

export interface ActiveInventorySession {
    player: Player;
    playerInventory: Inventory;
    otherInventory: Inventory | null;
    weapons: Weapon[];
}