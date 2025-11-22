import { IplModule } from "../index.js";
import { loadMrpd } from "./gabz_mrpd.js";
import { loadPillbox } from "./gabz_pillbox.js";

export const modules: IplModule[] = [
    { name: 'gabz_mrpd', load: () => loadMrpd() },
    { name: 'gabz_pillbox', load: () => loadPillbox() },
];