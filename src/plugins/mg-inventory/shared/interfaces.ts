import { Item } from "@Shared/types/items.js";
import { IWeapon } from "alt-shared";

export interface Inventory {
    slots: Item[];
    capacity: number;
}

export interface Player {
    id: number;
    name: string;
    phone: string;
    job: string;
    cash: number;
    bank: number;
}

export interface Weapon extends IWeapon {
    name: string;
    ammo: number;
    totalAmmo: number;
}