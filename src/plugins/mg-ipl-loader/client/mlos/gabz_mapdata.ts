/* This TypeScript code snippet is using the alt:V client-side API to load and activate an interior in
a game environment. Here's a breakdown of what the code is doing: */
import * as alt from 'alt-client';
import * as natives from 'natives';
import { useIplLoaderApi } from '../api.js';

const api = useIplLoaderApi();
interface Interior {
    ipl?: string;
    coords?: alt.IVector3;
    entitySets: { name: string; enable: boolean; color?: number }[];
}

const interiors: Interior[] = [
    {
        ipl: 'gabz_davispd_milo_',
        coords: { x: 371.0543, y: -1600.378, z: 34.73263 },
        entitySets: [
            { name: 'davispd_room01_rainhall_es', enable: true },
            { name: 'davispd_room02_reception_es', enable: true },
            { name: 'davispd_room03_captainoffice_es', enable: true },
            { name: 'davispd_room04_officeleft_es', enable: true },
            { name: 'davispd_room05_officeright_es', enable: true },
            { name: 'davispd_room06_archives_es', enable: true },
            { name: 'davispd_room07_staircase_es', enable: true },
            { name: 'davispd_room08_basementa_es', enable: true },
            { name: 'davispd_room09_listening_es', enable: true },
            { name: 'davispd_room10_interrogation_es', enable: true },
            { name: 'davispd_room11_toilets_es', enable: true },
            { name: 'davispd_room12_mugshot_es', enable: true },
            { name: 'davispd_room13_basementb_es', enable: true },
            { name: 'davispd_room14_armory_es', enable: true },
            { name: 'davispd_room15_forensics_es', enable: true },
            { name: 'davispd_room16_lockers_es', enable: true },
            { name: 'davispd_room17_showerleft_es', enable: true },
            { name: 'davispd_room18_showerright_es', enable: true },
        ]
    },
];

export function loadMapData() {
    interiors.forEach(data => {
        if (!data.ipl || !data.coords || !data.entitySets) return;
        api.enableIpl(data.ipl, true); 

        // Ermittel den Interior-ID anhand der Koordinaten
        const interiorID = natives.getInteriorAtCoords(data.coords.x, data.coords.y, data.coords.z);

        // Prüfe, ob das Interior existiert
        if (natives.isValidInterior(interiorID)) {
            data.entitySets.forEach(entitySet => {
                api.setIplPropState(interiorID, entitySet.name, entitySet.enable);
                if (entitySet.color) api.setIplPropColor(interiorID, entitySet.name, entitySet.color);
            });
            natives.refreshInterior(interiorID);
        }
    });
}