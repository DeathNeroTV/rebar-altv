// client/targeting.ts
import * as alt from 'alt-client';
import * as native from 'natives';
import { TargetData, TargetOption } from '../shared/index.js';


let currentTarget: TargetData | null = null;

alt.everyTick(() => {
    const playerPed = alt.Player.local.scriptID;
    const [isHit, entity, endCoords, surfaceNormal, entityHit] = native.getEntityPlayerIsFreeAimingAt(playerPed);

    if (isHit) {
        const entityType = native.getEntityType(entityHit);
        let type: TargetData['type'] | null = null;

        switch (entityType) {
            case 1: type = 'player'; break;
            case 2: type = 'vehicle'; break;
            case 3: type = 'object'; break;
        }

        if (type) {
            currentTarget = {
                id: entityHit,
                type,
                options: getOptionsForType(type)
            };
            alt.emit('rtebar:ui:showTarget', currentTarget);
        }
    } else {
        if (currentTarget) {
            currentTarget = null;
            alt.emit('rtebar:ui:hideTarget');
        }
    }
});

function getOptionsForType(type: TargetData['type']): TargetOption[] {
    switch (type) {
        case 'player':
            return [{ label: 'Ansprechen', event: 'interaction:talk' }];
        case 'vehicle':
            return [{ label: 'Einsteigen', event: 'interaction:enterVehicle' }];
        case 'object':
            return [{ label: 'Untersuchen', event: 'interaction:inspect' }];
        default:
            return [];
    }
}
