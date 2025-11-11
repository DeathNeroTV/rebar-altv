import * as alt from 'alt-server';
import { useServiceRegister } from '@Server/services/index.js';

export interface MedicalService {
    /**
     * Called when a player is respawned in a new location
     *
     * @memberof MedicalService
     */
    respawn: (player: alt.Player, pos: alt.Vector3) => void;

    /**
     * Called when a player is reviving another player
     *
     * @memberof MedicalService
     */
    revive: (player: alt.Player, victim: alt.Player) => void;
}

declare global {
    interface RebarServices {
        medicalService: MedicalService;
    }
}