import { IplModule } from "../index.js";
import { DiamondCasino } from "./casino/casino.js";
import { DiamondPenthouse } from "./casino/penthouse.js";

export const modules: IplModule[] = [
    { name: 'Diamond - Casino', load: () => DiamondCasino.loadDefault() },
    { name: 'Diamond - Penthouse', load: () => DiamondPenthouse.loadDefault() },
];