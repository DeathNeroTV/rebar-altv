import * as alt from 'alt-server';
import { useRebar } from '@Server/index.js';
import { AdminEvents } from '@Plugins/mg-admin/shared/events.js';

import './rpcEvents.js';

const Rebar = useRebar();
const notifyApi = await Rebar.useApi().getAsync('notify-api');

alt.onClient(AdminEvents.toServer.request.vehicle.fix, async (player: alt.Player, _id: string) => {
    const vehicle = alt.Vehicle.all.find(x => Rebar.document.vehicle.useVehicle(x).isValid() && Rebar.document.vehicle.useVehicle(x).getField('_id') === _id);
    if (!vehicle) return;

    const vehicleCtrl = Rebar.vehicle.useVehicle(vehicle);
    if (!vehicleCtrl) return;

    const repairedVehicle = await vehicleCtrl.repair();
    if (vehicle.id === repairedVehicle.id) return;

    notifyApi.general.send(player, {
        title: 'Admin-System',
        message: 'Die reperatur war erfolgreich',
        icon: notifyApi.general.getTypes().SUCCESS,
        subtitle: 'Fahrzeugverwaltung',
        oggFile: 'notification'
    });
});

alt.onClient(AdminEvents.toServer.request.vehicle.fuel, async (player: alt.Player, _id: string) => {
    const vehicle = alt.Vehicle.all.find(x => Rebar.document.vehicle.useVehicle(x).isValid() && Rebar.document.vehicle.useVehicle(x).getField('_id') === _id);
    if (!vehicle) return;

    const document = Rebar.document.vehicle.useVehicle(vehicle);
    if (!document.isValid()) return;
    await document.set('fuel', 100);

    Rebar.document.vehicle.useVehicleBinder(vehicle).unbind();
    Rebar.document.vehicle.useVehicleBinder(vehicle).bind({ ...document.get(), fuel: 100 }, true);

    notifyApi.general.send(player, {
        title: 'Admin-System',
        message: 'Die reperatur war erfolgreich',
        icon: notifyApi.general.getTypes().SUCCESS,
        subtitle: 'Fahrzeugverwaltung',
        oggFile: 'notification'
    });
});