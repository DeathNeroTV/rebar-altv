import * as natives from 'natives';
import { useIplLoaderApi } from '../../api.js';

const api = useIplLoaderApi();

export const Michael = {
    interiorId: 166657,
    garageId: 166401,

    style: {
        normal: [
            "V_Michael_bed_tidy",
            "V_Michael_M_items",
            "V_Michael_D_items",
            "V_Michael_S_items",
            "V_Michael_L_Items"
        ],
        moved: [
            "V_Michael_bed_Messy",
            "V_Michael_M_moved",
            "V_Michael_D_Moved",
            "V_Michael_L_Moved",
            "V_Michael_S_items_swap",
            "V_Michael_M_items_swap"
        ],

        set: function(style: string | string[], refresh: boolean = false) {
            Michael.style.clear(false);
            if (Array.isArray(style)) style.forEach(name => api.setIplPropState(Michael.interiorId, name, true, refresh));
            else api.setIplPropState(Michael.interiorId, style, true, refresh);
        },

        clear: function(refresh: boolean) {
            Michael.style.normal.forEach(style => api.setIplPropState(Michael.interiorId, style, false, refresh));
            Michael.style.moved.forEach(style => api.setIplPropState(Michael.interiorId, style, false, refresh));
        }
    },

    bed: {
        tidy: 'V_Michael_bed_tidy',
        messy: 'V_Michael_bed_Messy',

        set: function(bed: string, refresh: boolean = false) {
            Michael.bed.clear(false);
            api.setIplPropState(Michael.interiorId, bed, true, refresh);
        },
        clear: function(refresh: boolean) {
            api.setIplPropState(Michael.interiorId, Michael.bed.tidy, false, refresh);
            api.setIplPropState(Michael.interiorId, Michael.bed.messy, false, refresh);
        }
    },

    garage: {
        scuba: 'V_Michael_Scuba',

        enable: function(scuba: string, state: boolean, refresh: boolean = false) {
            api.setIplPropState(Michael.garageId, scuba, state, refresh);
        },
    },

    details: {
        moviePoster: 'Michael_premier',
        fameShamePost: 'V_Michael_FameShame',
        planeTicket: 'V_Michael_plane_ticket',
        spyGlass: 'V_Michael_JewelHeist',
        burgerShot: 'burgershot_yoga',

        enable: function(details: string, state: boolean, refresh: boolean = false) {
            api.setIplPropState(Michael.garageId, details, state, refresh);
        },
    },

    loadDefault: () => {
        Michael.garage.enable(Michael.garage.scuba, false, true);
        Michael.style.set(Michael.style.normal);
        Michael.bed.set(Michael.bed.tidy);
        Michael.details.enable(Michael.details.moviePoster, false);
        Michael.details.enable(Michael.details.fameShamePost, false);
        Michael.details.enable(Michael.details.planeTicket, false);
        Michael.details.enable(Michael.details.spyGlass, false);
        Michael.details.enable(Michael.details.burgerShot, false);

        natives.refreshInterior(Michael.interiorId);
    },
};
