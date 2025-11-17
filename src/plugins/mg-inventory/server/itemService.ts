import * as alt from 'alt-server';
import { useServiceRegister } from '@Server/services/index.js';
import { Inventory, TlrpItem, Weapon } from '../shared/interfaces.js';

export interface InventoryService {
    getInventoryByEntity: (entity: alt.Entity) => Promise<Inventory>;
    getInventoryByOwner: (owner: string) => Promise<Inventory>;
    getWeapons: (entity: alt.Entity) => Promise<Weapon[]>;
    add: (entity: alt.Entity, uid: string, slot: number, quantity: number, data?: any) => Promise<boolean>;
    sub: (entity: alt.Entity, slot: number, quantity: number) => Promise<boolean>;
    has: (entity: alt.Entity, uid: string, quantity: number) => Promise<boolean>;
    split: (entity: alt.Entity, slot: number, quantity: number) => Promise<boolean>;
    remove: (entity: alt.Entity, slot: number) => Promise<boolean>;
    use: (entity: alt.Entity, slot: number) => Promise<boolean>;
    hasSpace: (entity: alt.Entity, item: TlrpItem) => Promise<boolean>;
    itemCreate: (data: TlrpItem) => Promise<boolean>;
    itemRemove: (uid: string) => Promise<boolean>;
}

declare global {
    interface RebarServices {
        inventoryService: InventoryService;
    }
}

declare module 'alt-server' {
    export interface ICustomEmitEvent {
        'mg-inventory:entityItemAdd': (entity: alt.Entity, id: string, slot: number, quantity: number, data?: any) => void;
        'mg-inventory:entityItemSub': (entity: alt.Entity, slot: number, quantity: number) => void;
        'mg-inventory:entityItemSplit': (entity: alt.Entity, slot: number, quantity: number) => void;
        'mg-inventory:entityItemUse': (entity: alt.Entity, slot: number) => void;
        'mg-inventory:entityItemRemove': (entity: alt.Entity, slot: number) => void;
    }
}

export function useInventoryService() {
    const service = useServiceRegister().get('inventoryService');

    async function getInventoryByEntity(...args: Parameters<InventoryService['getInventoryByEntity']>) {
        if (!service?.getInventoryByEntity) return null;
        const result = await service.getInventoryByEntity(...args);
        return result;
    }

    async function getInventoryByOwner(...args: Parameters<InventoryService['getInventoryByOwner']>) {
        if (!service?.getInventoryByOwner) return null;
        const result = await service.getInventoryByOwner(...args);
        return result;
    }

    async function getWeapons(...args: Parameters<InventoryService['getWeapons']>) {
        if (!service?.getWeapons) return false;
        const result = await service.getWeapons(...args);
        return result;
    }

    async function add(...args: Parameters<InventoryService['add']>) {
        if (!service?.add) return false;
        const result = await service.add(...args);
        if (result) alt.emit('mg-inventory:entityItemAdd', ...args);
        return result;
    }

    async function sub(...args: Parameters<InventoryService['sub']>) {
        if (!service?.sub) return false;
        const result = await service.sub(...args);
        if (result) alt.emit('mg-inventory:entityItemSub', ...args);
        return result;
    }

    async function split(...args: Parameters<InventoryService['split']>) {
        if (!service?.split) return false;
        const result = await service.split(...args);
        if (result) alt.emit('mg-inventory:entityItemSplit', ...args);
        return result;
    }

    async function has(...args: Parameters<InventoryService['has']>) {
        if (!service?.has) return false;
        return await service.has(...args);
    }

    async function remove(...args: Parameters<InventoryService['remove']>) {
        if (!service?.remove) return false;
        const result = await service.remove(...args);
        if (result) alt.emit('mg-inventory:entityItemRemove', ...args);
        return result;
    }

    async function use(...args: Parameters<InventoryService['use']>) {
        if (!service?.use) return false;
        const result = await service.use(...args);
        if (result) alt.emit('mg-inventory:entityItemUse', ...args);
        return result;
    }

    async function hasSpace(...args: Parameters<InventoryService['hasSpace']>) {
        if (!service?.hasSpace) return false;
        return await service.hasSpace(...args);
    }

    async function itemCreate(...args: Parameters<InventoryService['itemCreate']>) {
        if (!service?.itemCreate) return false;
        const result = await service.itemCreate(...args);
        return result;
    }

    async function itemRemove(...args: Parameters<InventoryService['itemRemove']>) {
        if (!service?.itemRemove) return false;
        const result = await service.itemRemove(...args);
        return result;
    }

    return {
        getInventoryByEntity,
        getInventoryByOwner,
        getWeapons,
        add,
        sub,
        split,
        has,
        hasSpace,
        itemCreate,
        itemRemove,
        remove,
        use,
    };
}
