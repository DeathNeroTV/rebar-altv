import * as natives from 'natives';
import * as alt from 'alt-client';
import { useClientApi } from '@Client/api/index.js';

const API_NAME = 'ipl-loader-api';

export function useIplLoaderApi() {
    function enableIpl(iplName: string | string[], state: boolean) {
        if (!iplName?.length) return;
        if (Array.isArray(iplName)) {
            iplName.forEach(name => {                
                if (state) {
                    alt.requestIpl(name);
                    alt.log(`[IPL] Aktiviert: ${name}`);
                } else {
                    alt.removeIpl(name);
                    alt.log(`[IPL] Entfernt: ${name}`);
                }
            });
            return;
        }

        if (state) {
            alt.requestIpl(iplName);
            alt.log(`[IPL] Aktiviert: ${iplName}`);
        } else {
            alt.removeIpl(iplName);
            alt.log(`[IPL] Entfernt: ${iplName}`);
        }
    }

    function setIplPropState(interiorId: number | number[], propName: string, state: boolean, refresh = false) {
        if (!propName?.length || !interiorId) return;
        
        if (Array.isArray(interiorId)) {
            interiorId.forEach(id => {
                if (state) natives.activateInteriorEntitySet(id, propName);
                else natives.deactivateInteriorEntitySet(id, propName);

                if (refresh) natives.refreshInterior(id);
            });
            return;
        }
        
        if (state) natives.activateInteriorEntitySet(interiorId, propName);
        else natives.deactivateInteriorEntitySet(interiorId, propName);

        if (refresh) natives.refreshInterior(interiorId);
    }

    function setIplPropColor(interiorId: number, propName: string, propColor: number) {
        if (!propName?.length || !interiorId) return;
        natives.setInteriorEntitySetTintIndex(interiorId, propName, propColor);
    }

    function refreshInterior(interiorId: number) {
        if (!interiorId) return;
        natives.refreshInterior(interiorId);
    }

    return {
        enableIpl,
        setIplPropState,
        setIplPropColor,
        refreshInterior
    };
}

declare global {
    export interface ClientPlugin {
        [API_NAME]: ReturnType<typeof useIplLoaderApi>;
    }
}

useClientApi().register(API_NAME, useIplLoaderApi());