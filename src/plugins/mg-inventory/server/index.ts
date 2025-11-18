import * as alt from 'alt-server';
import { useRebar } from '@Server/index.js';
import { GTA_WEAPONS } from '../shared/weapons.js';
import { InventoryConfig } from '../shared/config.js';
import { InventoryEvents } from '../shared/events.js';
import { ActiveInventorySession, Inventory, Modifiers, Player, TlrpItem, Weapon } from '../shared/interfaces.js';
import { useInventoryService } from './itemService.js';
import { Character } from '@Shared/types/character.js';

const Rebar = useRebar();
const db = Rebar.database.useDatabase();
const notifyApi = await Rebar.useApi().getAsync('notify-api');
const CollectionNames = { 
    ...Rebar.database.CollectionNames, 
    Items: 'Items',  
    Inventories: 'Inventories'
};

const activeInventories: Map<string, ActiveInventorySession> = new Map();

Rebar.services.useServiceRegister().register('inventoryService', {
    async add(entity, uid, quantity, data) {
        const inventory = await useInventoryService().getInventoryByEntity(entity);
        if (!inventory) return false;

        const cloned = await db.get<TlrpItem>({ uid }, 'Items');
        if (!cloned) return false;

        const { item } = findItemWithSlot(inventory, uid);
        if (item) return false;

        const baseData = cloned.data ?? {};
        const extraData = data ?? {};
        const newData = { ...baseData, ...extraData };

        const newItem: TlrpItem = { ...cloned, quantity, data: newData };

        const hasSpace = await useInventoryService().hasSpace(entity, newItem);
        if (!hasSpace) return false;

        const freeIndex = await useInventoryService().getFreeSlot(entity);
        if (freeIndex !== -1) inventory.slots[freeIndex] = newItem;
        else inventory.slots.push(newItem);

        return await persistInventory(inventory);
    },
    async sub(entity, uid, quantity) {
        const inventory = await useInventoryService().getInventoryByEntity(entity);
        if (!inventory) return false;

        let remaining = quantity;
        for (let i = 0; i < inventory.slots.length; i++) {
            const data = inventory.slots[i];
            if (!data || data.uid !== uid) continue;

            if (data.quantity! >= remaining) {
                data.quantity! -= remaining;
                if (data.quantity! <= 0) inventory.slots[i] = null;
                await persistInventory(inventory);
                return true;
            } else {
                remaining -= data.quantity!;
                inventory.slots[i] = null;
            }
        }

        const result = await persistInventory(inventory);
        return result;
    },
    async addSlot(entity, uid, slot, quantity, data) {
        const inventory = await useInventoryService().getInventoryByEntity(entity);
        if (!inventory) return false;

        const cloned = await db.get<TlrpItem>({ uid }, 'Items');
        if (!cloned) return false;

        // 1. Slot MUSS existieren
        if (slot < 0 || slot >= inventory.slots.length) return false;

        // 2. Slot MUSS leer sein
        if (inventory.slots[slot]) return false;

        // 3. Data mergen
        const baseData = (cloned.data && typeof cloned.data === 'object') ? cloned.data : {};
        const extraData = (data && typeof data === 'object') ? data : {};
        const newData = { ...baseData, ...extraData };

        // 4. Item erstellen
        const newItem = { ...cloned, quantity, data: newData };

        // 5. Direkt in den gewünschten Slot
        inventory.slots[slot] = newItem;

        // 6. Inventar speichern
        return await persistInventory(inventory);
    },
    async subSlot(entity, slot, quantity) {
        const inventory = await useInventoryService().getInventoryByEntity(entity);
        if (!inventory) return false;

        const item = inventory.slots[slot];
        if (!item) return false;

        // 1) Slot selbst reicht aus
        if (item.quantity >= quantity) {
            item.quantity -= quantity;
            if (item.quantity <= 0) inventory.slots[slot] = null;
            return await persistInventory(inventory);
        }

        // 2) Mehrere Slots nutzen
        let remaining = quantity;
        const uid = item.uid;

        for (let i = 0; i < inventory.slots.length; i++) {
            const itm = inventory.slots[i];
            if (!itm || itm.uid !== uid) continue;

            if (itm.quantity >= remaining) {
                itm.quantity -= remaining;
                if (itm.quantity <= 0) inventory.slots[i] = null;
                return await persistInventory(inventory);
            } else {
                remaining -= itm.quantity;
                inventory.slots[i] = null;
            }
        }

        return await persistInventory(inventory);
    },
    async use(entity, slot) {
        const inventory = await useInventoryService().getInventoryByEntity(entity);
        if (!inventory) return null;

        const item = inventory.slots[slot];
        if (!item) return null;

        const leftOver = Math.max(0, item.quantity - 1);
        if (leftOver > 0) item.quantity = leftOver;
        else inventory.slots[slot] = null;

        const result = await persistInventory(inventory);
        return result ? item : null;
    },
    async itemCreate(data) {
        const found = await db.get<TlrpItem>({ uid: data.uid }, 'Items');
        if (found) {
            alt.logError(`Es gibt bereits ${data.name || data.uid}`);
            return false;
        }

        const identifier = Rebar.database.useIncrementalId('Items');
        const id = await identifier.getNext();

        const _id = await db.create({ ...data, id }, 'Items');
        if (!_id) {
            alt.logError(`${data.name || data.uid} konnte nicht erstellt werden`);
            return false;
        }
        return true;
    },
    async itemRemove(uid) {
        const found = await db.get<TlrpItem>({ uid }, 'Items');
        if (!found) return false;

        const success = await db.destroy(found._id, 'Items');
        return success;
    },
    async remove(entity, slot) {
        const inventory = await useInventoryService().getInventoryByEntity(entity);
        if (!inventory) return false;

        const item = inventory[slot];
        if (!item) return false;
        inventory.slots.splice(slot, 1);

        const result = await persistInventory(inventory);
        return result;
    },
    async split(entity, slot, quantity) {
        const inventory = await useInventoryService().getInventoryByEntity(entity);
        if (!inventory) return false;

        const original = inventory.slots[slot];
        if (!original || original.quantity <= 1 || quantity <= 0) return null;

        const taken = Math.min(quantity, original.quantity);

        original.quantity -= taken;

        const newItem: TlrpItem = { ...original, quantity: taken };

        const freeIndex = await useInventoryService().getFreeSlot(entity);
        if (freeIndex !== -1) inventory.slots[freeIndex] = newItem;
        else inventory.slots.push(newItem);

        inventory.slots[slot] = original;
        const result = await persistInventory(inventory);
        return result;
    },
    async has(entity, uid, quantity) {
        const inventory = await useInventoryService().getInventoryByEntity(entity);
        if (!inventory) return false;

        const amount = inventory.slots
        .filter(slot => slot?.uid === uid)
        .reduce((sum, slot) => sum + slot?.quantity || 0, 0);
        return amount >= quantity;
    },
    async hasSpace(entity, item) {
        const inventory = await useInventoryService().getInventoryByEntity(entity);
        if (!inventory) return false;
        const currentWeight = inventory.slots.reduce((sum, slot) => sum + (slot?.weight * slot?.quantity || 0), 0);
        const newWeight = currentWeight + (item.weight * item.quantity);
        return newWeight <= inventory.capacity;
    },
    async getFreeSlot(entity) {
        const inventory = await useInventoryService().getInventoryByEntity(entity);
        if (!inventory) return -1;
        return inventory.slots.findIndex((x) => x === null);
    },
    async getInventoryByEntity(entity) {
        if (entity.type !== alt.BaseObjectType.Player && entity.type !== alt.BaseObjectType.Vehicle) return null;

        if (entity.type === alt.BaseObjectType.Player) {
            const owner = Rebar.document.character.useCharacter(entity as alt.Player)?.getField('_id') ?? null;
            if (!owner) return null;
            const inventory = await db.get<Inventory>({ owner }, CollectionNames.Inventories);
            return inventory;
        }

        const vehId = Rebar.document.vehicle.useVehicle(entity as alt.Vehicle)?.getField('_id') ?? null;
        if (!vehId) return null;
        const inventory = await db.get<Inventory>({ owner: vehId }, CollectionNames.Inventories);
        return inventory;
    },
    async getInventoryByOwner(owner) {
        const document = await db.get<Inventory>({ owner }, 'Inventories');
        return document;
    },
    async getWeapons(entity) {
        const document = Rebar.document.character.useCharacter(entity as alt.Player);
        if (!document.isValid()) return [];
        const weapons = document.getField('weapons').map(x => {
            const weaponInfo = alt.getWeaponModelInfoByHash(x.hash);
            return {
                ...x,
                ammoType: weaponInfo.ammoType,
                totalAmmo: weaponInfo.defaultMaxAmmoMp,
                uid: weaponInfo.name.toLowerCase()
            } as Weapon;
        });
        return weapons;
    },
});

declare module '@Shared/types/character.js' {
    export interface Character {
        jobs?: string[] | string;
        phone?: string;
    }
}

function findItemWithSlot(inventory: Inventory, uid: string) {
    const index = inventory.slots.findIndex((x) => x?.uid === uid);
    if (index === -1) return { item: null, slot: -1 };
    return { slot: index, item: inventory.slots[index] };
}

async function persistInventory(inv: Inventory | null) {
    if (!inv) return false;
    return await db.update<Inventory>(inv, CollectionNames.Inventories);
}

async function persistWeaponsForPlayer(player: alt.Player, weapons: (Weapon | null)[]) {
    const doc = Rebar.document.character.useCharacter(player);
    if (!doc.isValid()) return false;
    // weapons in DB sollen nur IWeapon-Shape haben (siehe dein earlier mapping)
    const weaponsForDb = weapons.map(w => {
        if (!w) return null;
        const { ammo, totalAmmo, components, hash, tintIndex } = w as Weapon;
        return { ammo, totalAmmo, components, hash, tintIndex };
    }).filter(x => x !== null);
    await doc.set('weapons', weaponsForDb);
    return true;
}

function resolveInventoryFromUID(session: ActiveInventorySession, uid: string) {
    const [inv, slotStr] = uid.split('-');
    const index = Number(slotStr);
    if (inv === 'player') return { inventory: session.playerInventory, index };
    if (inv === 'other' && session.otherInventory) { return { inventory: session.otherInventory, index }; }
    return { inventory: null, index };
}

async function handleDataFetch(player: alt.Player) {
    const document = Rebar.document.character.useCharacter(player);
    if (!document.isValid()) return;

    const charId = document.getField('_id');
    const weapons = document.getField('weapons') ?? [];

    const pData: Player = {
        id: document.getField('id') ?? -1,
        bank: document.getField('bank') ?? 0,
        cash: document.getField('cash') ?? 0,
        name: document.getField('name') ?? 'Unbekannt',
        job: document.getField('jobs') ?? 'arbeitslos',
        phone: document.getField('phone') ?? '',
    };
    
    const wData: Weapon[] = weapons.map(entry => {
        const weaponInfo = alt.getWeaponModelInfoByHash(entry.hash);
        return {
            ...entry,
            ammoType: weaponInfo.ammoType,
            totalAmmo: weaponInfo.defaultMaxAmmoMp,
            uid: weaponInfo.name.toLowerCase()
        };
    });

    const items: TlrpItem[] = (
        await Promise.all(
            InventoryConfig.starterPack.map(async (x) => {
                const item = await db.get<TlrpItem>({ uid: x.uid }, CollectionNames.Items);
                if (!item) return null;
                return { ...item, quantity: x.quantity } as TlrpItem;
            })
        )
    ).filter((x): x is TlrpItem => x !== null);

    const iData: Inventory = await useInventoryService().getInventoryByOwner(charId) || {
        capacity: InventoryConfig.maxWeight,
        slots: [...items],
        owner: charId,
        type: 'player'
    };

    const oData: Inventory = null;
    const session = { player: pData, otherInventory: oData, playerInventory: iData, weapons: wData };
    activeInventories.set(charId, session);

    Rebar.player.useWebview(player).show('Inventory', 'page', true);
    Rebar.player.useWorld(player).disableControls();
    Rebar.player.useWorld(player).disableCameraControls(true);
    await refreshSession(player); 
}

function handleClearSession(player: alt.Player) {
    Rebar.player.useWorld(player).enableControls();
    Rebar.player.useWorld(player).disableCameraControls(false);
    const document = Rebar.document.character.useCharacter(player);
    if (!document.isValid()) return;
    
    const charId = document.getField('_id');
    if (activeInventories.has(charId)) 
        activeInventories.delete(charId);
}

async function handleLeftClick(player: alt.Player, uid: string, modifiers: Modifiers) {
    const doc = Rebar.document.character.useCharacter(player);
    if (!doc.isValid()) return;

    const charId = doc.getField('_id');
    const session = activeInventories.get(charId);
    if (!session) return;

    const { inventory, index } = resolveInventoryFromUID(session, uid);
    if (!inventory) return;

    const item = inventory.slots[index];
    if (!item) return;

    // SHIFT = split 50%
    if (modifiers.shift) {
        const amount = Math.floor(item.quantity / 2);
        if (amount <= 0) return;

        const splitted = await useInventoryService().split(player, index, amount);
        if (!splitted) return;

        notifyApi.general.send(player, {
            icon: notifyApi.general.getTypes().SUCCESS,
            title: "Tasche",
            message: `Geteilt: ${amount}x ${item.name}`,
            subtitle: "Aufteilung"
        });
        
        await refreshSession(player); 
        return;
    }

    // CTRL = split 1
    if (modifiers.ctrl) {
        if (item.quantity <= 1) return;

        const splitted = await useInventoryService().split(player, index, 1);
        if (!splitted) return;

        notifyApi.general.send(player, {
            icon: notifyApi.general.getTypes().SUCCESS,
            title: "Tasche",
            message: `Abgenommen: 1x ${item.name}`,
            subtitle: "Aufteilung"
        });

        await refreshSession(player); 
        return;
    }

    // Kein modifier → keine Aktion
}

async function handleRightClick(player: alt.Player, uid: string) {
    const doc = Rebar.document.character.useCharacter(player);
    if (!doc.isValid()) return;

    const charId = doc.getField('_id');
    const session = activeInventories.get(charId);
    if (!session) return;

    const { inventory, index } = resolveInventoryFromUID(session, uid);
    if (!inventory) return;

    const item = inventory.slots[index];
    if (!item) return;

    const success = await useInventoryService().use(player, index);
    if (!success) return;

    notifyApi.general.send(player, {
        icon: notifyApi.general.getTypes().SUCCESS,
        title: "Tasche",
        message: `Benutzt: ${item.name}`,
        subtitle: "Gegenstand"
    });

    await refreshSession(player); 
}

async function handleMiddleClick(player: alt.Player, uid: string) {
    const doc = Rebar.document.character.useCharacter(player);
    if (!doc.isValid()) return;

    const charId = doc.getField('_id');
    const session = activeInventories.get(charId);
    if (!session) return;

    const { inventory } = resolveInventoryFromUID(session, uid);
    if (!inventory) return;

    const slots = inventory.slots;
    const items = slots.filter((i): i is TlrpItem => i !== null);
    items.sort((a, b) => a.uid.localeCompare(b.uid));

    const merged: TlrpItem[] = [];
    for (const item of items) {
        const existing = merged.find(
            (i) => i.id === item.id && i.quantity < (i.maxStack ?? 1)
        );
        if (existing) {
            const max = existing.maxStack ?? 1;
            const free = max - existing.quantity;

            if (item.quantity <= free) existing.quantity += item.quantity;
            else {
                existing.quantity = max;
                merged.push({
                    ...item,
                    quantity: item.quantity - free,
                    uid: crypto.randomUUID(),
                });
            }
        } else merged.push({ ...item });
    }

    inventory.slots = [...merged];

    const success = await persistInventory(inventory);
    if (!success) return;

    notifyApi.general.send(player, {
        icon: notifyApi.general.getTypes().SUCCESS,
        title: "Tasche",
        message: `Inventar sortiert`,
        subtitle: "Sortierung"
    });
    
    await refreshSession(player); 
}

async function handleDragItem(player: alt.Player, fromId: string, toId: string) {
    const doc = Rebar.document.character.useCharacter(player);
    if (!doc.isValid()) return;

    const charId = doc.getField('_id');
    const session = activeInventories.get(charId);
    if (!session) return;

    const weapons = session.weapons;
    const fromIsWeapon = fromId.startsWith('weapons-');
    const toIsWeapon = toId.startsWith('weapons-');

    //
    // 1) WEAPONS → INVENTORY
    //
    if (fromIsWeapon && !toIsWeapon) {
        const fromIndex = Number(fromId.split('-')[1]);
        const weapon = weapons[fromIndex];
        if (!weapon) return;

        const { inventory: targetInv, index: toIndex } = resolveInventoryFromUID(session, toId);
        if (!targetInv) return;

        const targetSlot = targetInv.slots[toIndex];

        // Zielslot belegt → nur tauschbar, wenn ebenfalls Weapon-Item
        if (targetSlot && targetSlot.category !== "weapons") {
            notifyApi.general.send(player, {
                icon: notifyApi.general.getTypes().ERROR,
                title: "Tasche",
                message: "Zielslot belegt",
                subtitle: "Ablegen abgebrochen"
            });
            return;
        }

        // Swap Waffe <-> Waffen-Item
        if (targetSlot && targetSlot.category === "weapons") {
            const oldItem = targetSlot;

            // 1) Waffe in Slot packen
            targetInv.slots[toIndex] = {
                id: 0,
                uid: weapon.uid,
                name: weapon.uid,
                desc: "",
                icon: weapon.uid,
                quantity: 1,
                maxStack: 1,
                weight: 0,
                category: "weapons",
                data: {
                    hash: weapon.hash,
                    ammo: weapon.ammo,
                    totalAmmo: weapon.totalAmmo,
                    components: weapon.components,
                    tintIndex: weapon.tintIndex,
                }
            };

            // 2) Alte Weapon-Item wieder in die Weapon-Liste
            weapons[fromIndex] = {
                uid: oldItem.uid,
                hash: oldItem.data.hash,
                ammo: oldItem.data.ammo,
                totalAmmo: oldItem.data.totalAmmo,
                components: oldItem.data.components,
                tintIndex: oldItem.data.tintIndex,
                ammoType: oldItem.data.ammoType ?? "",
            };
        } 
        else {
            // Ablegen ohne Swap
            targetInv.slots[toIndex] = {
                id: 0,
                uid: weapon.uid,
                name: weapon.uid,
                desc: "",
                icon: weapon.uid,
                quantity: 1,
                maxStack: 1,
                weight: 0,
                category: "weapons",
                data: {
                    hash: weapon.hash,
                    ammo: weapon.ammo,
                    totalAmmo: weapon.totalAmmo,
                    components: weapon.components,
                    tintIndex: weapon.tintIndex,
                }
            };

            weapons[fromIndex] = null;
        }

        await persistInventory(targetInv);
        await persistWeaponsForPlayer(player, weapons);
        await refreshSession(player);

        notifyApi.general.send(player, {
            icon: notifyApi.general.getTypes().SUCCESS,
            title: "Tasche",
            message: "Waffe abgelegt",
            subtitle: "Inventar"
        });
        return;
    }

    //
    // 2) INVENTORY → WEAPONS
    //
    if (!fromIsWeapon && toIsWeapon) {
        const { inventory: srcInv, index: fromIndex } = resolveInventoryFromUID(session, fromId);
        if (!srcInv) return;

        const item = srcInv.slots[fromIndex];
        if (!item) return;

        if (item.category !== "weapons" || !item.data?.hash) {
            notifyApi.general.send(player, {
                icon: notifyApi.general.getTypes().ERROR,
                title: "Tasche",
                message: "Dies ist keine Waffe",
                subtitle: "Nicht ausrüstbar"
            });
            return;
        }

        const weaponIndex = Number(toId.split('-')[1]);
        const replaced = weapons[weaponIndex] ?? null;

        // Weapon aus Item erzeugen
        weapons[weaponIndex] = {
            uid: item.uid,
            hash: item.data.hash,
            ammo: item.data.ammo ?? 0,
            totalAmmo: item.data.totalAmmo ?? 0,
            components: item.data.components ?? [],
            tintIndex: item.data.tintIndex ?? 0,
            ammoType: item.data.ammoType ?? "",
        };

        srcInv.slots[fromIndex] = null;

        // Falls vorhandene Waffe ersetzt wird → zurück ins Inventar
        if (replaced) {
            const free = await useInventoryService().getFreeSlot(player);
            if (free === -1) {
                weapons[weaponIndex] = replaced;
                notifyApi.general.send(player, {
                    icon: notifyApi.general.getTypes().ERROR,
                    title: "Tasche",
                    message: "Kein Platz im Inventar",
                    subtitle: "Equip fehlgeschlagen"
                });
                return;
            }

            srcInv.slots[free] = {
                id: 0,
                uid: replaced.uid,
                name: replaced.uid,
                desc: "",
                icon: replaced.uid,
                quantity: 1,
                maxStack: 1,
                weight: 0,
                category: "weapons",
                data: {
                    hash: replaced.hash,
                    ammo: replaced.ammo,
                    totalAmmo: replaced.totalAmmo,
                    components: replaced.components,
                    tintIndex: replaced.tintIndex
                }
            };
        }

        await persistInventory(srcInv);
        await persistWeaponsForPlayer(player, weapons);
        await refreshSession(player);
        return;
    }

    //
    // 3) WEAPONS ↔ WEAPONS
    //
    if (fromIsWeapon && toIsWeapon) {
        const fromIndex = Number(fromId.split('-')[1]);
        const toIndex = Number(toId.split('-')[1]);

        const tmp = weapons[toIndex];
        weapons[toIndex] = weapons[fromIndex];
        weapons[fromIndex] = tmp;

        await persistWeaponsForPlayer(player, weapons);
        await refreshSession(player);
        return;
    }

    //
    // 4) INVENTORY ↔ INVENTORY
    //
    if (!fromIsWeapon && !toIsWeapon) {
        const { inventory: srcInv, index: fromIndex } = resolveInventoryFromUID(session, fromId);
        const { inventory: dstInv, index: toIndex } = resolveInventoryFromUID(session, toId);

        if (!srcInv || !dstInv) return;

        const a = srcInv.slots[fromIndex];
        const b = dstInv.slots[toIndex];
        if (!a) return;

        // Ziel leer → Move
        if (!b) {
            dstInv.slots[toIndex] = a;
            srcInv.slots[fromIndex] = null;

            await persistInventory(srcInv);
            if (dstInv !== srcInv) await persistInventory(dstInv);
            await refreshSession(player);
            return;
        }

        // Stacken
        if (a.uid === b.uid) {
            const max = b.maxStack ?? 1;
            const free = max - b.quantity;
            const add = Math.min(a.quantity, free);

            b.quantity += add;
            a.quantity -= add;

            if (a.quantity <= 0) srcInv.slots[fromIndex] = null;

            await persistInventory(srcInv);
            if (dstInv !== srcInv) await persistInventory(dstInv);
            await refreshSession(player);
            return;
        }

        // Swap
        dstInv.slots[toIndex] = a;
        srcInv.slots[fromIndex] = b;

        await persistInventory(srcInv);
        if (dstInv !== srcInv) await persistInventory(dstInv);
        await refreshSession(player);
        return;
    }

    // Unknown
    notifyApi.general.send(player, {
        icon: notifyApi.general.getTypes().ERROR,
        title: "Tasche",
        message: "Unbekannter Drag-Aktionstyp",
        subtitle: "Fehler"
    });
}

async function refreshSession(player: alt.Player) {
    const document = Rebar.document.character.useCharacter(player);
    if (!document.isValid()) return;

    const charId = document.getField('_id');
    const session: ActiveInventorySession = activeInventories.get(charId) ?? undefined;
    if (!session) return;
    
    const playerInventory = session.playerInventory?.owner
        ? (await db.get<Inventory>({ owner: session.playerInventory.owner }, CollectionNames.Inventories) || null)
        : null;

    const otherInventory = session.otherInventory?.owner
        ? (await db.get<Inventory>({ owner: session.otherInventory.owner }, CollectionNames.Inventories) || null)
        : null;

    const weaponList = document.getField('weapons') || [];
    const weapons = weaponList.map(entry => { 
        const weaponInfo = alt.getWeaponModelInfoByHash(entry.hash);
        return { 
            ...entry, 
            ammoType: weaponInfo.ammoType,
            totalAmmo: weaponInfo.defaultMaxAmmoMp,
            uid: weaponInfo.name.toLowerCase()
        };
    });

    const playerInfo: Player = { 
        ...session.player,
        bank: document.getField('bank'),
        cash: document.getField('cash'),
        job: document.getField('jobs'),
        phone: document.getField('phone')
    };

    activeInventories.set(charId, { player: playerInfo, playerInventory, otherInventory, weapons });
    Rebar.player.useWebview(player).emit(InventoryEvents.toWebview.updateView, { player: playerInfo, playerInventory, otherInventory, weapons });
}

async function init() {
    await db.createCollection(CollectionNames.Items);
    await db.createCollection(CollectionNames.Inventories);
    
    for (const weapon of GTA_WEAPONS) {
        const weaponInfo = alt.getWeaponModelInfoByHash(weapon.hash);
        const foundItem = await db.get<TlrpItem>({ uid: weaponInfo.name.toLowerCase() }, 'Items');
        if (foundItem) continue;

        const id = await Rebar.database.useIncrementalId('Items').getNext();

        const item: TlrpItem = {
            id,
            desc: weapon.desc[InventoryConfig.language],
            icon: weaponInfo.name.toLowerCase(),
            maxStack: 1,
            name: weapon.name[InventoryConfig.language],
            quantity: 1,
            uid: weaponInfo.name.toLowerCase(),
            weight: 0.0,
            category: 'weapons',
            data: {
                hash: weapon.hash,
                components: [],
                tintIndex: 0,
                ammo: 0,
                totalAmmo: weaponInfo.defaultMaxAmmoMp,
                ammoType: weaponInfo.ammoType
            }
        };
        const _id = await db.create<TlrpItem>(item, 'Items');
    }

    // Server Events
    alt.on('rebar:playerCharacterBound', async(player: alt.Player, character: Character) => {
        const inventory = await db.get<Inventory>({ owner: character._id }, CollectionNames.Inventories);
        if (!inventory) {
            await db.create<Inventory>({
                capacity: InventoryConfig.maxWeight,
                owner: character._id,
                slots: Array(30).fill(null),
                type: 'player'
            }, CollectionNames.Inventories);
        }
    });

    alt.on('mg-inventory:entityItemUse', async (entity: alt.Entity, item: TlrpItem) => {
        if (entity.type === alt.BaseObjectType.Player) {
            const player = entity as alt.Player;
            const document = Rebar.document.character.useCharacter(player);
            if (!document.isValid()) return;

            const food   = item?.data?.food   ?? 0;
            const water  = item?.data?.water  ?? 0;
            const health = item?.data?.health ?? 0;
            const armour = item?.data?.armour ?? 0;

            const currentFood   = document.getField('food') ?? 0;
            const currentWater  = document.getField('water') ?? 0;
            const currentHealth = document.getField('health') ?? 99;
            const currentArmour = document.getField('armour') ?? 0;

            const newFood   = Math.min(100, Math.max(0, currentFood + food));
            const newWater  = Math.min(100, Math.max(0, currentWater + water));
            const newHealth = Math.min(200, Math.max(99, currentHealth + health));
            const newArmour = Math.min(100, Math.max(0, currentArmour + armour));

            await document.setBulk({
                food: newFood,
                water: newWater,
                health: newHealth,
                armour: newArmour
            });

            return;
        }
    });

    // Client Events
    alt.onClient(InventoryEvents.toServer.fetchData, handleDataFetch);
    alt.onClient(InventoryEvents.toServer.clearSession, handleClearSession);
    alt.onClient(InventoryEvents.toServer.leftClick, handleLeftClick);
    alt.onClient(InventoryEvents.toServer.rightClick, handleRightClick);
    alt.onClient(InventoryEvents.toServer.middleClick, handleMiddleClick);
    alt.onClient(InventoryEvents.toServer.dragItem, handleDragItem);
}

init();