const weaponHashes = {
    gadget_nightvision: 0xA720365C,
    gadget_parachute: 0xFBAB5776,
    weapon_acidpackage: 0xF7F1E25E,
    weapon_advancedrifle: 0xAF113F99,
    weapon_appistol: 0x22D8FE39,
    weapon_assaultrifle: 0xBFEFFF6D,
    weapon_assaultrifle_mk2: 0x394F415C,
    weapon_assaultshotgun: 0xE284C527,
    weapon_assaultsmg: 0xEFE7E2DF,
    weapon_autoshotgun: 0x12E82D3D,
    weapon_ball: 0x23C9F95C,
    weapon_bat: 0x958A4A8F,
    weapon_battleaxe: 0xCD274149,
    weapon_bird_crap: 0x6D5E2801,
    weapon_bottle: 0xF9E6AA4B,
    weapon_bullpuprifle: 0x7F229F94,
    weapon_bullpuprifle_mk2: 0x84D6FAFD,
    weapon_bullpupshotgun: 0x9D61E50F,
    weapon_bzgas: 0xA0973D5E,
    weapon_candycane: 0x6589186A,
    weapon_carbinerifle: 0x83BF0278,
    weapon_carbinerifle_mk2: 0xFAD1F1C9,
    weapon_ceramicpistol: 0x2B5EF5EC,
    weapon_combatmg: 0x7FD62962,
    weapon_combatmg_mk2: 0xDBBD7280,
    weapon_combatpdw: 0xA3D4D34,
    weapon_combatpistol: 0x5EF9FEC4,
    weapon_combatshotgun: 0x5A96BA4,
    weapon_compactlauncher: 0x781FE4A,
    weapon_compactrifle: 0x624FE830,
    weapon_crowbar: 0x84BD7BFD,
    weapon_dagger: 0x92A27487,
    weapon_dbshotgun: 0xEF951FBB,
    weapon_doubleaction: 0x97EA20B8,
    weapon_emplauncher: 0xDB26713A,
    weapon_fertilizercan: 0x184140A1,
    weapon_fireextinguisher: 0x60EC506,
    weapon_firework: 0x7F7497E5,
    weapon_flare: 0x497FACC3,
    weapon_flaregun: 0x47757124,
    weapon_flashlight: 0x8BB05FD7,
    weapon_gadgetpistol: 0x57A4368C,
    weapon_garbagebag: 0xE232C28C,
    weapon_golfclub: 0x440E4788,
    weapon_grenade: 0x93E220BD,
    weapon_grenadelauncher: 0xA284510B,
    weapon_grenadelauncher_smoke: 0x4DD2DC56,
    weapon_gusenberg: 0x61012683,
    weapon_hammer: 0x4E875F73,
    weapon_handcuffs: 0xD04C944D,
    weapon_hatchet: 0xF9DCBF2D,
    weapon_hazardcan: 0xBA536372,
    weapon_heavypistol: 0xD205520E,
    weapon_heavyrifle: 0xC78D71B4,
    weapon_heavyshotgun: 0x3AABBBAA,
    weapon_heavysniper: 0xC472FE2,
    weapon_heavysniper_mk2: 0xA914799,
    weapon_hominglauncher: 0x63AB0442,
    weapon_knife: 0x99B507EA,
    weapon_knuckle: 0xD8DF3C3C,
    weapon_machete: 0xDD5DF8D9,
    weapon_machinepistol: 0xDB1AA450,
    weapon_marksmanpistol: 0xDC4DB296,
    weapon_marksmanrifle: 0xC734385A,
    weapon_marksmanrifle_mk2: 0x6A6C02E0,
    weapon_mg: 0x9D07F764,
    weapon_microsmg: 0x13532244,
    weapon_militaryrifle: 0x9D1F17E6,
    weapon_minigun: 0x42BF8A85,
    weapon_minismg: 0xBD248B55,
    weapon_molotov: 0x24B17070,
    weapon_musket: 0xA89CB99E,
    weapon_navyrevolver: 0x917F6C8C,
    weapon_nightstick: 0x678B81B1,
    weapon_petrolcan: 0x34A67B97,
    weapon_pipebomb: 0xBA45E8B8,
    weapon_pistol: 0x1B06D571,
    weapon_pistol_mk2: 0xBFE256D4,
    weapon_pistol50: 0x99AEEB3B,
    weapon_pistolxm3: 0x1BC4FDB9,
    weapon_poolcue: 0x94117305,
    weapon_precisionrifle: 0x6E7DDDEC,
    weapon_proxmine: 0xAB564B93,
    weapon_pumpshotgun: 0x1D073A89,
    weapon_pumpshotgun_mk2: 0x555AF99A,
    weapon_railgun: 0x6D544C99,
    weapon_railgunxm3: 0xFEA23564,
    weapon_raycarbine: 0x476BF155,
    weapon_rayminigun: 0xB62D1F67,
    weapon_raypistol: 0xAF3696A1,
    weapon_revolver: 0xC1B3C3D1,
    weapon_revolver_mk2: 0xCB96392F,
    weapon_rpg: 0xB1CA77B1,
    weapon_sawnoffshotgun: 0x7846A318,
    weapon_smg: 0x2BE6766B,
    weapon_smg_mk2: 0x78A97CD0,
    weapon_smokegrenade: 0xFDBC8A50,
    weapon_sniperrifle: 0x5FC3C11,
    weapon_snowball: 0x787F0BB,
    weapon_snspistol: 0xBFD21232,
    weapon_snspistol_mk2: 0x88374054,
    weapon_specialcarbine: 0xC0A3098D,
    weapon_specialcarbine_mk2: 0x969C3D67,
    weapon_stickybomb: 0x2C3731D9,
    weapon_stinger: 0x687652CE,
    weapon_stone_hatchet: 0x3813FC08,
    weapon_stungun: 0x3656C8C1,
    weapon_stungun_mp: 0x45CD9CF3,
    weapon_switchblade: 0xDFE37640,
    weapon_tacticalrifle: 0xD1D5F52B,
    weapon_tecpistol: 0x14E5AFD5,
    weapon_tranquilizer: 0x32A888BD,
    weapon_unarmed: 0xA2719263,
    weapon_vintagepistol: 0x83839C4,
    weapon_wrench: 0x19044EE0,
};

/**
 * Get weapon name from hash
 *
 * @export
 * @param {number} hash
 * @return {(string | undefined)}
 */
export function getNameFromHash(hash: number): string | undefined {
    for (let key of Object.keys(weaponHashes)) {
        if (weaponHashes[key] != hash) {
            continue;
        }

        return key;
    }

    return undefined;
}

/**
 * Get weapons in the list
 *
 * @export
 * @return {string[]}
 */
export function getWeapons(): string[] {
    return Object.keys(weaponHashes);
}
