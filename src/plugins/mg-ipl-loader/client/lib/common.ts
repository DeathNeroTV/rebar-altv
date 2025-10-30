import { GlobalType, InteriorGroup } from '@Plugins/mg-ipl-loader/shared/interfaces.js';

export const Global: GlobalType = {
    currentInteriorId: 0,

    Online: {
        isInsideApartmentHi1: false,
        isInsideApartmentHi2: false,
        isInsideHouseHi1: false,
        isInsideHouseHi2: false,
        isInsideHouseHi3: false,
        isInsideHouseHi4: false,
        isInsideHouseHi5: false,
        isInsideHouseHi6: false,
        isInsideHouseHi7: false,
        isInsideHouseHi8: false,
        isInsideHouseLow1: false,
        isInsideHouseMid1: false
    },

    Biker: {
        isInsideClubhouse1: false,
        isInsideClubhouse2: false
    },

    FinanceOffices: {
        isInsideOffice1: false,
        isInsideOffice2: false,
        isInsideOffice3: false,
        isInsideOffice4: false
    },

    HighLife: {
        isInsideApartment1: false,
        isInsideApartment2: false,
        isInsideApartment3: false,
        isInsideApartment4: false,
        isInsideApartment5: false,
        isInsideApartment6: false
    },

    Security: {
        isInsideOffice1: false,
        isInsideOffice2: false,
        isInsideOffice3: false,
        isInsideOffice4: false
    },

    ResetInteriorVariables() {
        const groups = ["Biker", "FinanceOffices", "HighLife", "Security"] as const;
        for (const key of groups) {
            const group = (Global as any)[key] as InteriorGroup;
            for (const prop in group) {
                group[prop] = false;
            }
        }
    }
};
