import { useIplLoaderApi } from '../../api.js';
import { SetIplPropState } from '../../lib/common.js';
import { Ammunitions } from '@Plugins/mg-ipl-loader/shared/interfaces.js';

const api = useIplLoaderApi();
export const Ammunition: Ammunitions = {
    interiorId: [
        140289, // 249.8, -47.1, 70.0
        153857, // 844.0, -1031.5, 28.2
        168193, // -664.0, -939.2, 21.8
        164609, // -1308.7, -391.5, 36.7
        176385, // -3170.0, 1085.0, 20.8
        175617, // -1116.0, 2694.1, 18.6
        200961, // 1695.2, 3756.0, 34.7
        180481, // -328.7, 6079.0, 31.5
        178689 // 2569.8, 297.8, 108.7
    ],
    addonId: [
        137729, // 19.1, -1110.0, 29.8
        248065  // 811.0, -2152.0, 29.6
    ],
    details: {
        hooks: 'GunStoreHooks',
        hooksClub: 'GunClubWallHooks',
        enable: function (details: string, state: boolean, refresh: boolean = false) {
            if (details === Ammunition.details.hooks) api.setIplPropState(Ammunition.interiorId, details, state, refresh);
            else if (details === Ammunition.details.hooksClub) api.setIplPropState(Ammunition.addonId, details, state, refresh);
            
        }
    },
    loadDefault: function() {
        Ammunition.details.enable(Ammunition.details.hooks, true, true);
        Ammunition.details.enable(Ammunition.details.hooksClub, true, true);
    }
};