import * as alt from 'alt-client';
import * as natives from 'natives';
import { useIplLoaderApi } from '../api.js';

const api = useIplLoaderApi();
const defaultIpls: string[] = [
    'rc12b_fixed',
    'rc12b_default',
    'rc12b_destroyed',
    'rc12b_hospitalinterior_lod',
    'rc12b_hospitalinterior'
];

export function loadPillbox() {    
    const interiorID = natives.getInteriorAtCoords(311.2546, -592.4204, 42.32737);
    api.enableIpl('gabz_pillbox_milo_', true);
    if (natives.isValidInterior(interiorID)) {
        defaultIpls.forEach(iplName => api.enableIpl(iplName, false));
        api.refreshInterior(interiorID);
    } else alt.logError('Gabz Pillbox Hospital Interior konnte nicht gefunden werden!');
}