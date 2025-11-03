import * as alt from 'alt-client';

// Alle IPL-Module hier importieren
import * as SP from './sp/index.js';
import * as GTAO from './gtao/index.js';
import * as DLC from './dlc/index.js';
import * as MLO from './mlos/index.js';

export type IplModule = {
    name: string;
    load: () => void;
};

export const IplRegistry: IplModule[] = [
    ...SP.modules,
    ...GTAO.modules,
    ...DLC.modules,
    ...MLO.modules,
];

alt.once('connectionComplete', () => {
    alt.log(`[IPL-Loader] Starte initiales Laden von ${IplRegistry.length} Modulen...`);

    for (const module of IplRegistry) {
        try {
            module.load();
            alt.log(`[IPL-Loader] ${module.name} geladen.`);
        } catch (err) {
            alt.logError(`[IPL-Loader] Fehler bei ${module.name}: ${err}`);
        }
    }

    alt.log(`[IPL-Loader] Alle Module erfolgreich geladen.`);
});