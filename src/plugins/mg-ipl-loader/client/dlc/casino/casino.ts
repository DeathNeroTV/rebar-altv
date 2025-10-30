import { useIplLoaderApi } from "../../api.js";

const api = useIplLoaderApi();

export const DiamondCasino = {
    ipl: {
        building: {
            ipl: [
                'hei_dlc_windows_casino',
                'hei_dlc_casino_aircon',
                'vw_dlc_casino_door',
                'hei_dlc_casino_door'
            ],
            load() {
                api.enableIpl(DiamondCasino.ipl.building.ipl, true);
            },
            remove() {
                api.enableIpl(DiamondCasino.ipl.building.ipl, false);
            },
        },
        main: {
            ipl: 'vw_casino_main',
            load() {
                api.enableIpl(DiamondCasino.ipl.main.ipl, true);
            },
            remove() {
                api.enableIpl(DiamondCasino.ipl.main.ipl, false);
            },
        },
        garage: {            
            ipl: 'vw_casino_garage',
            load() {
                api.enableIpl(DiamondCasino.ipl.garage.ipl, true);
            },
            remove() {
                api.enableIpl(DiamondCasino.ipl.garage.ipl, false);
            },
        },
        carpark: {
            ipl: 'vw_casino_carpark',
            load() {
                api.enableIpl(DiamondCasino.ipl.carpark.ipl, true);
            },
            remove() {
                api.enableIpl(DiamondCasino.ipl.carpark.ipl, false);
            },
        }
    },
    loadDefault: function() {
        DiamondCasino.ipl.building.load();
        DiamondCasino.ipl.main.load();
        DiamondCasino.ipl.garage.load();
        DiamondCasino.ipl.carpark.load();
    },
};