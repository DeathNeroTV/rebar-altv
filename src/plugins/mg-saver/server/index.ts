import * as alt from 'alt-server';
import { useRebar } from '@Server/index.js';
import { Config } from '../shared/config.js';
import { Character } from '@Shared/types/character.js';

const Rebar = useRebar();
let isUpdatingPlayers = false;
let isUpdatingVehicles = false;

declare module 'alt-server' {
    export interface ICustomEmitEvent {
        'mg-saver:onTick': (tick: number) => void;
    }
}

const updatePlayers = async () => {
    if (!Config.update.players || isUpdatingPlayers) return;
    isUpdatingPlayers = true;

    for (let player of alt.Player.all) {
        if (!player.valid) continue;        
        try {
            const document = Rebar.document.character.useCharacter(player);
            if (!document.isValid()) continue;

            const natives = Rebar.player.useNative(player);
            const weapon = document.getField('weapon');
            if (weapon && weapon.hash === player.currentWeapon) {
                weapon.ammo = await natives.invokeWithResult('getAmmoInClip', player, weapon.hash);
                weapon.totalAmmo = await natives.invokeWithResult('getAmmoInPedWeapon', player, weapon.hash);       
                await document.set('weapon', weapon);     
            }
            Rebar.player.useState(player).save();
            Rebar.player.useWeapon(player).save();
        } catch {}
    }

    isUpdatingPlayers = false;
}

const updateVehicles = () => {
    if (!Config.update.vehicles || isUpdatingVehicles) return;
    isUpdatingVehicles = true;

    for (let vehicle of alt.Vehicle.all) {
        if (!vehicle.valid) continue;
        const document = Rebar.document.vehicle.useVehicle(vehicle);
        if (!document.isValid()) continue;
        Rebar.vehicle.useVehicle(vehicle).save();
    }

    isUpdatingVehicles = false;
}

alt.on('playerDisconnect', (player: alt.Player, reason: string) => {
    try {        
        const document = Rebar.document.character.useCharacter(player);
        if (!document.isValid()) return;
        const name = document.getField('name').replaceAll('_', ' ');
        const data: Partial<Character> = { pos: player.pos, rot: player.rot, dimension: player.dimension };
        document.setBulk(data);
        alt.log('[mg-saver]', `Datensätze für ${name} gespeichert.`);
    } catch {}
});

alt.on('rebar:onTick', (tick: number) => {
    if (tick % Config.intervalInSeconds === 0) {
        updatePlayers();
        updateVehicles();
    }
});
