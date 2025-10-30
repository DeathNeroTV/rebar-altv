import * as natives from 'natives';
import { SetIplPropState } from '../../lib/common.js';

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
            SetIplPropState(Michael.interiorId, style, true, refresh);
        },

        clear: function(refresh: boolean) {
            SetIplPropState(Michael.interiorId, [...Michael.style.normal, ...Michael.style.moved], false, refresh);
        }
    },

    bed: {
        tidy: 'V_Michael_bed_tidy',
        messy: 'V_Michael_bed_Messy',

        set: function(bed: string, refresh: boolean = false) {
            Michael.bed.clear(false);
            SetIplPropState(Michael.interiorId, bed, true, refresh);
        },
        clear: function(refresh: boolean) {
            SetIplPropState(Michael.interiorId, [Michael.bed.tidy, Michael.bed.messy], false, refresh);
        }
    },

    garage: {
        scuba: 'V_Michael_Scuba',

        enable: function(scuba: string | string[], state: boolean, refresh: boolean = false) {
            SetIplPropState(Michael.garageId, scuba, state, refresh);
        },
    },

    details: {
        moviePoster: 'Michael_premier',
        fameShamePost: 'V_Michael_FameShame',
        planeTicket: 'V_Michael_plane_ticket',
        spyGlass: 'V_Michael_JewelHeist',
        burgerShot: 'burgershot_yoga',

        enable: function(details: string, state: boolean, refresh: boolean = false) {
            SetIplPropState(Michael.garageId, details, state, refresh);
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
