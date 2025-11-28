import { IplModule } from "../index.js";
import { loadAdminBase } from "./admin_base.js";
import { loadMrpd } from "./gabz_mrpd.js";
import { loadPillbox } from "./gabz_pillbox.js";
import { loadGardens } from "./strawberry_gardens.js";

export const modules: IplModule[] = [
    { name: 'gabz_mrpd', load: () => loadMrpd() },
    { name: 'gabz_pillbox', load: () => loadPillbox() },
    { name: 'Verpi_park', load: () => loadGardens() },
    { name: 'Adminbase', load: () => loadAdminBase() }
];