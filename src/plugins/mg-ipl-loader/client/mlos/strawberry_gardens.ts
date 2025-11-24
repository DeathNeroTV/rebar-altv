import * as alt from 'alt-client';
import * as natives from 'natives';
import { useIplLoaderApi } from "../api.js";

const api = useIplLoaderApi();
const iplList: string[] = [
    'verpi_legion_gas', 'verpi_legion_intmilo', 'verpi_legion_lod_lights_distantlights', 'verpi_legion_lod_lights_lodlights',
    'verpi_park_addition_placements', 'verpi_park_lod_lights_distantlights', 'verpi_park_lod_lights_lodlights'
];

export function loadGardens() {
    iplList.forEach(ipl => api.enableIpl(ipl, true));
}