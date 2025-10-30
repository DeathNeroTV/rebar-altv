import * as alt from 'alt-client';

// Alle IPL-Module hier importieren
import * as SP from './sp/index.js';
import * as GTAO from './gtao/index.js';
import * as DLC from './dlc/index.js';

import { loadMapData } from './mlos/gabz_mapdata.js';
import { loadMrpd } from './mlos/gabz_mrpd.js';
import { loadPillbox } from './mlos/gabz_pillbox.js';

export type IplModule = {
    name: string;
    load: () => void;
};

// Registry erstellen
export const IplRegistry: IplModule[] = [
    ...SP.modules,
    ...GTAO.modules,
    ...DLC.modules,
    { name: 'gabz_mapdata', load: () => loadMapData() },
    { name: 'gabz_mrpd', load: () => loadMrpd() },
    { name: 'gabz_pillbox', load: () => loadPillbox() },
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