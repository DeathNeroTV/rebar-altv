import { MissionFlag, MissionType } from "./enums.js";

export interface HeliMission {
    missionType: MissionType;
    speed: number;
    radius: number;
    heading: -1;
    maxHeight: number;
    minHeight: number;
    slowDistance: number;
    missionFlags: MissionFlag;
}