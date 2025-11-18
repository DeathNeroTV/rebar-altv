import * as alt from 'alt-server';
import { useServiceRegister } from '@Server/services/index.js';
import { Inventory, TlrpItem, Weapon } from '../shared/interfaces.js';

export interface InventoryService {
    getFreeSlot: (entity: alt.Entity) => Promise<number>;
    getInventoryByEntity: (entity: alt.Entity) => Promise<Inventory>;
    getInventoryByOwner: (owner: string) => Promise<Inventory>;
    getWeapons: (entity: alt.Entity) => Promise<Weapon[]>;    
    add: (entity: alt.Entity, uid: string, quantity: number, data?: any) => Promise<boolean>;
    sub: (entity: alt.Entity, uid: string, quantity: number) => Promise<boolean>;
    addSlot: (entity: alt.Entity, uid: string, slot: number, quantity: number, data?: any) => Promise<boolean>;
    subSlot: (entity: alt.Entity, slot: number, quantity: number) => Promise<boolean>;
    has: (entity: alt.Entity, uid: string, quantity: number) => Promise<boolean>;
    split: (entity: alt.Entity, slot: number, quantity: number) => Promise<boolean>;
    remove: (entity: alt.Entity, slot: number) => Promise<boolean>;
    use: (entity: alt.Entity, slot: number) => Promise<TlrpItem>;
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
        'mg-inventory:entityItemAdd': (entity: alt.Entity, uid: string, quantity: number, data?: any) => void;
        'mg-inventory:entityItemSub': (entity: alt.Entity, uid: string, quantity: number) => void;
        'mg-inventory:entityItemAddOnSlot': (entity: alt.Entity, id: string, slot: number, quantity: number, data?: any) => void;
        'mg-inventory:entityItemSubOnSlot': (entity: alt.Entity, slot: number, quantity: number) => void;
        'mg-inventory:entityItemSplit': (entity: alt.Entity, slot: number, quantity: number) => void;
        'mg-inventory:entityItemUse': (entity: alt.Entity, item: TlrpItem) => void;
        'mg-inventory:entityItemRemove': (entity: alt.Entity, slot: number) => void;
    }
}

export function useInventoryService() {
    const service = useServiceRegister().get('inventoryService');

    async function getFreeSlot(...args: Parameters<InventoryService['getFreeSlot']>) {
        if (!service?.getFreeSlot) return null;
        const result = await service.getFreeSlot(...args);
        return result;
    }

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

    async function addSlot(...args: Parameters<InventoryService['addSlot']>) {
        if (!service?.addSlot) return false;
        const result = await service.addSlot(...args);
        if (result) alt.emit('mg-inventory:entityItemAddOnSlot', ...args);
        return result;
    }

    async function subSlot(...args: Parameters<InventoryService['subSlot']>) {
        if (!service?.subSlot) return false;
        const result = await service.subSlot(...args);
        if (result) alt.emit('mg-inventory:entityItemSubOnSlot', ...args);
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
        if (!service?.use) return null;
        const result = await service.use(...args);
        if (!result) return false;
        alt.emit('mg-inventory:entityItemUse', args[0], result);
        return true;
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
        getFreeSlot,
        getInventoryByEntity,
        getInventoryByOwner,
        getWeapons,
        add,
        addSlot,
        sub,
        subSlot,
        split,
        has,
        hasSpace,
        itemCreate,
        itemRemove,
        remove,
        use,
    };
}
