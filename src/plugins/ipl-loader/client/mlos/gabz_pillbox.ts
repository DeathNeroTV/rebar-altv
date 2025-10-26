import * as alt from 'alt-client';
import * as natives from 'natives';

alt.once('connectionComplete', () => {    
    // Lade das IPL
    natives.requestIpl('gabz_pillbox_milo_');

    // Ermittel den Interior-ID anhand der Koordinaten
    const interiorID = natives.getInteriorAtCoords(311.2546, -592.4204, 42.32737);

    // Prüfe, ob das Interior existiert
    if (natives.isValidInterior(interiorID)) {
        natives.removeIpl('rc12b_fixed');
        natives.removeIpl('rc12b_destroyed');
        natives.removeIpl('rc12b_default');
        natives.removeIpl('rc12b_hospitalinterior_lod');
        natives.removeIpl('rc12b_hospitalinterior');

        natives.refreshInterior(interiorID);
    } else {
        alt.logError('Gabz MRPD Interior konnte nicht gefunden werden!');
    }
});

