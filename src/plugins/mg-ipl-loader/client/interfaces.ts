import * as alt from 'alt-client';

export interface FacilityStyle {
    name: string;
    iplList: string[];
    propList: string[];
    propColors?: Record<string, number>;
    coords: alt.IVector3;
}