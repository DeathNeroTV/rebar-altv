import { IplModule } from "../index.js";
import { Ammunition } from "./singleplayer/ammunations.js";
import { Michael } from "./singleplayer/michael.js";

export const modules: IplModule[] = [
    { name: 'Ammunitions', load: () => Ammunition.loadDefault() },
    { name: `Michael's House`, load: () => Michael.loadDefault() },
];