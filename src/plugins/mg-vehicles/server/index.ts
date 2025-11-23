import { useRebar } from '@Server/index.js';
import { Vehicle } from '@Shared/types/vehicle.js';
import * as alt from 'alt-server';
import { VehicleEvents } from '../shared/events.js';

const Rebar = useRebar();
const db = Rebar.database.useDatabase();

alt.onClient(VehicleEvents.toServer.toggle.lock, (player: alt.Player) => {
    if (!player || !player.valid) return;
    const vehicle = player.vehicle ?? alt.Utils.getClosestVehicle({ pos: player.pos , range: 3 });
    Rebar.vehicle.useVehicle(vehicle).toggleLockAsPlayer(player);
});

alt.onClient(VehicleEvents.toServer.toggle.engine, (player: alt.Player) => {
    if (!player || !player.valid) return;
    const vehicle = player.vehicle ?? alt.Utils.getClosestVehicle({ pos: player.pos , range: 3 });
    Rebar.vehicle.useVehicle(vehicle).toggleEngineAsPlayer(player);
});

async function init() {
    let counter = 0;
    const vehicles = (await db.getAll<Vehicle & { _id: string }>(Rebar.database.CollectionNames.Vehicles)).filter(x => !x.garageId);
    vehicles.forEach(document => {
        const tempVeh = new alt.Vehicle(document.model, document.pos, document.rot);
        if (tempVeh) counter++;
        Rebar.document.vehicle.useVehicleBinder(tempVeh).bind(document, true);
    });
    alt.log('[mg-vehicles] Es wurden', counter, 'Fahrzeuge erstellt');
}
init();