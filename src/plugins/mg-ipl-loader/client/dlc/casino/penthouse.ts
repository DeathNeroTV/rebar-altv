import { useIplLoaderApi } from "../../api.js";

const api = useIplLoaderApi();

export const DiamondPenthouse = {
    interiorId: 274689,
    ipl: {
        interior: {
            ipl: 'vw_casino_penthouse',
            prop: 'Set_Pent_Tint_Shell',
            load: function() {
                api.enableIpl(DiamondPenthouse.ipl.interior.ipl, true);
                api.setIplPropState(DiamondPenthouse.interiorId, DiamondPenthouse.ipl.interior.prop, true, true);
            },
            remove : function() {
                api.enableIpl(DiamondPenthouse.ipl.interior.ipl, false);
            },
        }
    },
    colors: {
        default: 0,
        sharp: 1,
        vibrant: 2,
        timeless: 3
    },
    interior: {
        walls: {
            propName: 'Set_Pent_Tint_Shell',
            setColor: function(color: number, refresh?: boolean) {
                api.setIplPropColor(DiamondPenthouse.interiorId, DiamondPenthouse.interior.walls.propName, color);
                if (!refresh) return;
                api.refreshInterior(DiamondPenthouse.interiorId)
            },
        },
        pattern: {
            pattern01: 'Set_Pent_Pattern_01',
            pattern02: 'Set_Pent_Pattern_02',
            pattern03: 'Set_Pent_Pattern_03',
            pattern04: 'Set_Pent_Pattern_04',
            pattern05: 'Set_Pent_Pattern_05',
            pattern06: 'Set_Pent_Pattern_06',
            pattern07: 'Set_Pent_Pattern_07',
            pattern08: 'Set_Pent_Pattern_08',
            pattern09: 'Set_Pent_Pattern_09',
            set: function(pattern: string, refresh?: boolean) {
                DiamondPenthouse.interior.pattern.clear(false);
                api.setIplPropState(DiamondPenthouse.interiorId, pattern, true, refresh);
            },
            clear: function(refresh?: boolean) {
                const patterns = [
                    DiamondPenthouse.interior.pattern.pattern01,
                    DiamondPenthouse.interior.pattern.pattern02,
                    DiamondPenthouse.interior.pattern.pattern03,
                    DiamondPenthouse.interior.pattern.pattern04,
                    DiamondPenthouse.interior.pattern.pattern05,
                    DiamondPenthouse.interior.pattern.pattern06,
                    DiamondPenthouse.interior.pattern.pattern07,
                    DiamondPenthouse.interior.pattern.pattern08,
                    DiamondPenthouse.interior.pattern.pattern09
                ];
                patterns.forEach(pattern => api.setIplPropState(DiamondPenthouse.interiorId, pattern, false, refresh));
            },
            setColor: function(pattern: string, color: number, refresh?: boolean) {
                api.setIplPropColor(DiamondPenthouse.interiorId, pattern, color);
                if (!refresh) return;
                api.refreshInterior(DiamondPenthouse.interiorId);
            },
        },
        spaBar: {
            open: 'Set_Pent_Spa_Bar_Open',
            closed: 'Set_Pent_Spa_Bar_Closed',
            set: function(state: string, refresh?: boolean) {
                DiamondPenthouse.interior.spaBar.clear(false);
                api.setIplPropState(DiamondPenthouse.interiorId, state, true, refresh);
            },
            clear: function(refresh) {
                const states = [
                    DiamondPenthouse.interior.spaBar.open,
                    DiamondPenthouse.interior.spaBar.closed,
                ];
                states.forEach(state => api.setIplPropState(DiamondPenthouse.interiorId, state, false, refresh));
            },
        },
        mediaBar: {
            open: 'Set_Pent_Media_Bar_Open',
            closed: 'Set_Pent_Media_Bar_Closed',
            set(state: string, refresh?: boolean) {
                DiamondPenthouse.interior.mediaBar.clear(false);
                api.setIplPropState(DiamondPenthouse.interiorId, state, true, refresh);
            },
            clear(refresh?: boolean) {
                const states = [
                    DiamondPenthouse.interior.mediaBar.open,
                    DiamondPenthouse.interior.mediaBar.closed,
                ];
                states.forEach(state => api.setIplPropState(DiamondPenthouse.interiorId, state, false, refresh));
            },
        },
        dealer: {
            open: 'Set_Pent_Dealer',
            closed: 'Set_Pent_NoDealer',
            set(state: string, refresh?: boolean) {
                DiamondPenthouse.interior.dealer.clear(false);
                api.setIplPropState(DiamondPenthouse.interiorId, state, true, refresh);
            },
            clear(refresh?: boolean) {
                const states = [
                    DiamondPenthouse.interior.dealer.open,
                    DiamondPenthouse.interior.dealer.closed,
                ];
                states.forEach(state => api.setIplPropState(DiamondPenthouse.interiorId, state, false, refresh));
            },
        },
        arcade: {
            none: '',
            modern: 'Set_Pent_Arcade_Modern',
            retro: 'Set_Pent_Arcade_Retro',
            set: function(arcade: string, refresh?: boolean) {
                DiamondPenthouse.interior.arcade.clear(false);
                api.setIplPropState(DiamondPenthouse.interiorId, arcade, true, refresh);
            },
            clear: function(refresh?: boolean) {
                const states = [
                    DiamondPenthouse.interior.arcade.none,
                    DiamondPenthouse.interior.arcade.modern,
                    DiamondPenthouse.interior.arcade.retro,
                ];
                states.forEach(state => api.setIplPropState(DiamondPenthouse.interiorId, state, false, refresh));
            }
        },
        clutter: {
            bar: 'Set_Pent_Bar_Clutter',
            clutter01: 'Set_Pent_Clutter_01',
            clutter02: 'Set_Pent_Clutter_02',
            clutter03: 'Set_Pent_Clutter_03',
            set(clutter: string, refresh?: boolean) {
                DiamondPenthouse.interior.clutter.clear(false);
                api.setIplPropState(DiamondPenthouse.interiorId, clutter, true, refresh);
            },
            clear(refresh?: boolean) {
                const states = [
                    DiamondPenthouse.interior.clutter.bar,
                    DiamondPenthouse.interior.clutter.clutter01,
                    DiamondPenthouse.interior.clutter.clutter02,
                    DiamondPenthouse.interior.clutter.clutter03,
                ];
                states.forEach(state => api.setIplPropState(DiamondPenthouse.interiorId, state, false, refresh));
            },
        },
        barLight: {
            none: '',
            light0: 'set_pent_bar_light_0',
            light1: 'set_pent_bar_light_01',
            light2: 'set_pent_bar_light_02',
            set(light: string, refresh?: boolean) {
                DiamondPenthouse.interior.barLight.clear(false);
                api.setIplPropState(DiamondPenthouse.interiorId, light, true, refresh);
            },
            clear(refresh?: boolean) {
                const states = [
                    DiamondPenthouse.interior.barLight.none,
                    DiamondPenthouse.interior.barLight.light0,
                    DiamondPenthouse.interior.barLight.light1,
                    DiamondPenthouse.interior.barLight.light2,
                ];
                states.forEach(state => api.setIplPropState(DiamondPenthouse.interiorId, state, false, refresh));
            },
        },
        barParty: {
            none: '',
            party0: 'set_pent_bar_party_0',
            party1: 'set_pent_bar_party_1',
            party2: 'set_pent_bar_party_2',
            partyAfter: 'set_pent_bar_party_after',
            set(party: string, refresh?: boolean) {
                DiamondPenthouse.interior.barParty.clear(false);
                api.setIplPropState(DiamondPenthouse.interiorId, party, true, refresh);
            },
            clear(refresh?: boolean) {
                const states = [
                    DiamondPenthouse.interior.barParty.none,
                    DiamondPenthouse.interior.barParty.party0,
                    DiamondPenthouse.interior.barParty.party1,
                    DiamondPenthouse.interior.barParty.party2,
                    DiamondPenthouse.interior.barParty.partyAfter,
                ];
                states.forEach(state => api.setIplPropState(DiamondPenthouse.interiorId, state, false, refresh));
            },
        }, 
        blockers: {
            guest: {
                enabled: 'Set_Pent_GUEST_BLOCKER',
                disabled: '',
                set(blocker: string, refresh?: boolean) {
                    DiamondPenthouse.interior.blockers.guest.clear(false);
                    api.setIplPropState(DiamondPenthouse.interiorId, blocker, true, refresh);
                },
                clear(refresh?: boolean) {
                    const states = [
                        DiamondPenthouse.interior.blockers.guest.enabled,
                        DiamondPenthouse.interior.blockers.guest.disabled,
                    ];
                    states.forEach(state => api.setIplPropState(DiamondPenthouse.interiorId, state, false, refresh));
                },
            },
            lounge: {
                enabled: 'Set_Pent_LOUNGE_BLOCKER',
                disabled: '',
                set(blocker: string, refresh?: boolean) {
                    DiamondPenthouse.interior.blockers.lounge.clear(false);
                    api.setIplPropState(DiamondPenthouse.interiorId, blocker, true, refresh);
                },
                clear(refresh?: boolean) {
                    const states = [
                        DiamondPenthouse.interior.blockers.lounge.enabled,
                        DiamondPenthouse.interior.blockers.lounge.disabled,
                    ];
                    states.forEach(state => api.setIplPropState(DiamondPenthouse.interiorId, state, false, refresh));
                },
            },
            office: {
                enabled: 'Set_Pent_OFFICE_BLOCKER',
                disabled: '',
                set(blocker: string, refresh?: boolean) {
                    DiamondPenthouse.interior.blockers.office.clear(false);
                    api.setIplPropState(DiamondPenthouse.interiorId, blocker, true, refresh);
                },
                clear(refresh?: boolean) {
                    const states = [
                        DiamondPenthouse.interior.blockers.office.enabled,
                        DiamondPenthouse.interior.blockers.office.disabled,
                    ];
                    states.forEach(state => api.setIplPropState(DiamondPenthouse.interiorId, state, false, refresh));
                },
            },
            cinema: {                
                enabled: 'Set_Pent_CINE_BLOCKER',
                disabled: '',
                set(blocker: string, refresh?: boolean) {
                    DiamondPenthouse.interior.blockers.cinema.clear(false);
                    api.setIplPropState(DiamondPenthouse.interiorId, blocker, true, refresh);
                },
                clear(refresh?: boolean) {
                    const states = [
                        DiamondPenthouse.interior.blockers.cinema.enabled,
                        DiamondPenthouse.interior.blockers.cinema.disabled,
                    ];
                    states.forEach(state => api.setIplPropState(DiamondPenthouse.interiorId, state, false, refresh));
                },
            },
            spa: {
                enabled: 'Set_Pent_SPA_BLOCKER',
                disabled: '',
                set(blocker: string, refresh?: boolean) {
                    DiamondPenthouse.interior.blockers.spa.clear(false);
                    api.setIplPropState(DiamondPenthouse.interiorId, blocker, true, refresh);
                },
                clear(refresh?: boolean) {
                    const states = [
                        DiamondPenthouse.interior.blockers.spa.enabled,
                        DiamondPenthouse.interior.blockers.spa.disabled,
                    ];
                    states.forEach(state => api.setIplPropState(DiamondPenthouse.interiorId, state, false, refresh));
                },
            },
            bar: {
                enabled: 'Set_Pent_BAR_BLOCKER',
                disabled: '',
                set(blocker: string, refresh?: boolean) {
                    DiamondPenthouse.interior.blockers.bar.clear(false);
                    api.setIplPropState(DiamondPenthouse.interiorId, blocker, true, refresh);
                },
                clear(refresh?: boolean) {
                    const states = [
                        DiamondPenthouse.interior.blockers.bar.enabled,
                        DiamondPenthouse.interior.blockers.bar.disabled,
                    ];
                    states.forEach(state => api.setIplPropState(DiamondPenthouse.interiorId, state, false, refresh));
                },
            },
            enableAllBlockers: function() {
                DiamondPenthouse.interior.blockers.bar.set(DiamondPenthouse.interior.blockers.bar.enabled);
                DiamondPenthouse.interior.blockers.guest.set(DiamondPenthouse.interior.blockers.guest.enabled);
                DiamondPenthouse.interior.blockers.spa.set(DiamondPenthouse.interior.blockers.spa.enabled);
                DiamondPenthouse.interior.blockers.cinema.set(DiamondPenthouse.interior.blockers.cinema.enabled);
                DiamondPenthouse.interior.blockers.lounge.set(DiamondPenthouse.interior.blockers.lounge.enabled);
                DiamondPenthouse.interior.blockers.office.set(DiamondPenthouse.interior.blockers.office.enabled);
            },
            disableAllBlockers: function() {
                DiamondPenthouse.interior.blockers.bar.set(DiamondPenthouse.interior.blockers.bar.disabled);
                DiamondPenthouse.interior.blockers.guest.set(DiamondPenthouse.interior.blockers.guest.disabled);
                DiamondPenthouse.interior.blockers.spa.set(DiamondPenthouse.interior.blockers.spa.disabled);
                DiamondPenthouse.interior.blockers.cinema.set(DiamondPenthouse.interior.blockers.cinema.disabled);
                DiamondPenthouse.interior.blockers.lounge.set(DiamondPenthouse.interior.blockers.lounge.disabled);
                DiamondPenthouse.interior.blockers.office.set(DiamondPenthouse.interior.blockers.office.disabled);
            },
        },
    },
    loadDefault: function() {
        const styleColor: number = DiamondPenthouse.colors.sharp;
        const stylePattern: string = DiamondPenthouse.interior.pattern.pattern01;

        DiamondPenthouse.ipl.interior.load();
        
        DiamondPenthouse.interior.walls.setColor(styleColor);
        DiamondPenthouse.interior.pattern.set(stylePattern);
        DiamondPenthouse.interior.pattern.setColor(stylePattern, styleColor);

        DiamondPenthouse.interior.spaBar.set(DiamondPenthouse.interior.spaBar.open);
        DiamondPenthouse.interior.mediaBar.set(DiamondPenthouse.interior.mediaBar.open);
        DiamondPenthouse.interior.dealer.set(DiamondPenthouse.interior.dealer.open);

        api.refreshInterior(DiamondPenthouse.interiorId);
    }
};