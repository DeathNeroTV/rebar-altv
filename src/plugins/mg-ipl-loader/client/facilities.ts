import * as alt from 'alt-client';
import * as natives from 'natives';
import { FacilityStyle } from "./interfaces.js";

export class FacilityLoader {
    private currentInteriorId: number | null = null;

    constructor(private style: FacilityStyle) {}

    public loadStyle(): void {
        this.style.iplList.forEach(ipl => alt.requestIpl(ipl));

        const interiorID = natives.getInteriorAtCoords(this.style.coords.x, this.style.coords.y, this.style.coords.z);

        if (!interiorID) {
            alt.logWarning('[FacilityLoader]', 'Interior konnte nicht gefunden werden');
            return;
        }
        
        this.currentInteriorId = interiorID;

        this.style.propList.forEach(prop => {
            if (!natives.isInteriorEntitySetActive(interiorID, prop)) {
                natives.activateInteriorEntitySet(interiorID, prop);
            }
        });

        if (this.style.propColors) {
            for (const [propName, tint] of Object.entries(this.style.propColors)) {
                natives.setInteriorEntitySetTintIndex(interiorID, propName, tint);
            }
        }

        natives.refreshInterior(interiorID);
        natives.pinInteriorInMemory(interiorID);

        alt.log(`[FacilityLoader] Facility '${this.style.name}' geladen`);
    }

    public unloadStyle(): void {
        if (!this.currentInteriorId) return;

        // Props deaktivieren
        this.style.propList.forEach(prop => {
            if (natives.isInteriorEntitySetActive(this.currentInteriorId!, prop)) {
                natives.deactivateInteriorEntitySet(this.currentInteriorId!, prop);
            }
        });

        // Optional: IPLs entfernen
        this.style.iplList.forEach(ipl => alt.removeIpl(ipl));

        natives.refreshInterior(this.currentInteriorId);
        alt.log(`[FacilityLoader] Facility '${this.style.name}' entladen`);
        this.currentInteriorId = null;
    }
}