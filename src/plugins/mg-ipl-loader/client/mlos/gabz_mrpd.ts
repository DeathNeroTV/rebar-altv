/* This TypeScript code snippet is using the alt:V client-side API to load and activate an interior in
a game environment. Here's a breakdown of what the code is doing: */
import * as alt from 'alt-client';
import * as natives from 'natives';

const rooms: string[] = [
    'v_gabz_mrpd_rm1', 'v_gabz_mrpd_rm2', 'v_gabz_mrpd_rm3', 'v_gabz_mrpd_rm4',
    'v_gabz_mrpd_rm5', 'v_gabz_mrpd_rm6', 'v_gabz_mrpd_rm7', 'v_gabz_mrpd_rm8',
    'v_gabz_mrpd_rm9', 'v_gabz_mrpd_rm10', 'v_gabz_mrpd_rm11', 'v_gabz_mrpd_rm12',
    'v_gabz_mrpd_rm13', 'v_gabz_mrpd_rm14', 'v_gabz_mrpd_rm15', 'v_gabz_mrpd_rm16',
    'v_gabz_mrpd_rm17', 'v_gabz_mrpd_rm18', 'v_gabz_mrpd_rm19', 'v_gabz_mrpd_rm20',
    'v_gabz_mrpd_rm21', 'v_gabz_mrpd_rm22', 'v_gabz_mrpd_rm23', 'v_gabz_mrpd_rm24',
    'v_gabz_mrpd_rm25', 'v_gabz_mrpd_rm26', 'v_gabz_mrpd_rm27', 'v_gabz_mrpd_rm28',
    'v_gabz_mrpd_rm29', 'v_gabz_mrpd_rm30', 'v_gabz_mrpd_rm31'
];

alt.once('connectionComplete', () => {    
    // Lade das IPL
    natives.requestIpl('gabz_mrpd_milo_');

    // Ermittel den Interior-ID anhand der Koordinaten
    const interiorID = natives.getInteriorAtCoords(451.0129, -993.3741, 29.1718);

    // Prüfe, ob das Interior existiert
    if (natives.isValidInterior(interiorID)) {
        rooms.forEach(room => natives.activateInteriorEntitySet(interiorID, room));
        natives.refreshInterior(interiorID);
    } else {
        alt.logError('Gabz MRPD Interior konnte nicht gefunden werden!');
    }
});

