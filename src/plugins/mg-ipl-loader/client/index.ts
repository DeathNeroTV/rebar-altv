import * as alt from 'alt-client';
import * as MLO from './mlos/index.js';

export type IplModule = {
    name: string;
    load: () => void;
};

alt.once('connectionComplete', () => {
    alt.log(`[IPL-Loader] Starte initiales Laden von ${MLO.modules.length} Modulen...`);
    alt.loadDefaultIpls();

    for (const module of MLO.modules) {
        try {
            module.load();
            alt.log(`[IPL-Loader] ${module.name} geladen.`);
        } catch (err) {
            alt.logError(`[IPL-Loader] Fehler bei ${module.name}: ${err}`);
        }
    }

    alt.log(`[IPL-Loader] Alle Module erfolgreich geladen.`);
});