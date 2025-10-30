import * as alt from 'alt-client';
import * as natives from 'natives';
import { Global } from '../common.js';
import { FinanceOffice1 } from '../../dlc/finance/office1.js';

const scanDelay: number = 500;
let interval: number | undefined = undefined;

alt.once('connectionComplete', () => {
    interval = alt.setInterval(() => {
        let office: FinanceOffice1 | FinanceOffice2 | FinanceOffice3 | FinanceOffice4 | undefined = undefined;
        if (Global.FinanceOffices.isInsideOffice1) {
            office = FinanceOffice1;
        } else if (Global.FinanceOffices.isInsideOffice2) {
            office = FinanceOffice2;
        } else if (Global.FinanceOffices.isInsideOffice3) {
            office = FinanceOffice3;
        } else if (Global.FinanceOffices.isInsideOffice4) {
            office = FinanceOffice4;
        }

        if (!office) return;

        var doorHandle = office.Safe.getDoorHandle(office.currentSafeDoors.hashL);
    }, scanDelay);
});

alt.once('disconnect', () => {
    if (!interval) return;
    alt.clearInterval(interval);
});