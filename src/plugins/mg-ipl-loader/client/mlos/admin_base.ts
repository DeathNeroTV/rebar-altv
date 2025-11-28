import { useIplLoaderApi } from '../api.js';

const api = useIplLoaderApi();
const interiorId = 269313;
const colorType = {
    utility: 1,
    expertise: 2,
    altitude: 3,
    power: 4,
    authority: 5,
    influence: 6,
    order: 7,
    empire: 8,
    supremacy: 9
}

export function loadAdminBase() {
    api.enableIpl('xm_hatch_10_cutscene', true);
    api.enableIpl('xm_hatch_closed', true);
    api.enableIpl('xm_hatches_terrain', true);
    api.enableIpl('xm_hatches_terrain_lod', true);
    
    api.setIplPropState(interiorId, 'set_int_02_shell', true, true);
    api.setIplPropColor(interiorId, 'set_int_02_shell', colorType.expertise);
    
    api.setIplPropState(interiorId, 'set_int_02_decal_02', true);

    api.setIplPropState(interiorId, 'set_int_02_lounge2', true);
    api.setIplPropColor(interiorId, 'set_int_02_lounge2', colorType.expertise);

    api.setIplPropState(interiorId, 'set_int_02_sleep2', true);
    api.setIplPropColor(interiorId, 'set_int_02_sleep2', colorType.expertise);

    api.setIplPropState(interiorId, 'set_int_02_security', true);
    api.setIplPropColor(interiorId, 'set_int_02_security', colorType.expertise);

    api.setIplPropState(interiorId, 'set_int_02_cannon', true);
    api.setIplPropColor(interiorId, 'set_int_02_cannon', colorType.expertise);

    api.setIplPropState(interiorId, 'set_int_02_cannon', true);
    api.setIplPropColor(interiorId, 'set_int_02_cannon', colorType.expertise);
    
    api.setIplPropState(interiorId, 'Set_Int_02_Parts_Panther1', true);
    api.setIplPropState(interiorId, 'Set_Int_02_Parts_Panther2', true);
    api.setIplPropState(interiorId, 'Set_Int_02_Parts_Panther3', true);

    api.setIplPropState(interiorId, 'Set_Int_02_outfit_khanjali', true);
    
    api.setIplPropState(interiorId, 'set_int_02_trophy_sub', true);
    api.setIplPropColor(interiorId, 'set_int_02_trophy_sub', colorType.expertise);

    api.setIplPropState(interiorId, 'set_int_02_clutter1', true);
    api.setIplPropState(interiorId, 'set_int_02_clutter2', true);

    api.refreshInterior(interiorId);
}