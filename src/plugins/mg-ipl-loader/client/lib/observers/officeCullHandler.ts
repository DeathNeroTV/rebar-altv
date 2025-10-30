import * as alt from 'alt-client';
import * as natives from 'natives';

import { Global } from '../common.js';

let interval: number | undefined = undefined;

alt.once('connectionComplete', () => {
    interval = alt.setInterval(() => {
        if (Global.Security.isInsideOffice1 || Global.Security.isInsideOffice2 || Global.Security.isInsideOffice3 || Global.Security.isInsideOffice4) {
            if (Global.Security.isInsideOffice1) {
                natives.enableExteriorCullModelThisFrame(alt.hash('bh1_05_build1'));
                natives.enableExteriorCullModelThisFrame(alt.hash('bh1_05_em'));
                return;
            }

            if (Global.Security.isInsideOffice2) {
                natives.enableExteriorCullModelThisFrame(alt.hash('hei_hw1_08_hotplaz01'));
                natives.enableExteriorCullModelThisFrame(alt.hash('hw1_08_hotplaz_rail'));
                natives.enableExteriorCullModelThisFrame(alt.hash('hw1_08_emissive_c'));
                return;
            }

            if (Global.Security.isInsideOffice3) {
                natives.enableExteriorCullModelThisFrame(alt.hash('hei_kt1_05_01'));
                natives.enableExteriorCullModelThisFrame(alt.hash('kt1_05_glue_b'));
                natives.enableExteriorCullModelThisFrame(alt.hash('kt1_05_kt_emissive_kt1_05'));
                return;
            }

            if (Global.Security.isInsideOffice4) {
                natives.enableExteriorCullModelThisFrame(alt.hash('hei_kt1_08_buildingtop_a'));
                natives.enableExteriorCullModelThisFrame(alt.hash('hei_kt1_08_kt1_emissive_ema'));
                return;
            }
        }
    }, 0);
});