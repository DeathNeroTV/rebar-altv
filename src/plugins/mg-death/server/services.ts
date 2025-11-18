import * as alt from 'alt-server';
import { useServiceRegister } from '@Server/services/index.js';

export interface DeathService {
    unconscious: (player: alt.Player) => void;
    revive: (player: alt.Player, victim: alt.Player) => Promise<void>;
    revived: (player: alt.Player, isReviver: boolean) => Promise<void>;
    respawn: (player: alt.Player, pos?: alt.Vector3) => Promise<void>;
    called: (player: alt.Player) => void;
    hospital: (pos: alt.IVector3) => { pos: alt.IVector3; rot: alt.IVector3 };
}

declare global {
    interface RebarServices {
        medicalService: DeathService;
    }
}

declare module 'alt-server' {
    export interface ICustomEmitEvent {
        'mg-death:playerUnconscious': (...args: Parameters<DeathService['unconscious']>) => void;
        'mg-death:playerRevive': (...args: Parameters<DeathService['revive']>) => void;
        'mg-death:playerRevived': (...args: Parameters<DeathService['revived']>) => void;
        'mg-death:playerRespawned': (...args: Parameters<DeathService['respawn']>) => void;
        'mg-death:playerCalledEms': (...args: Parameters<DeathService['called']>) => void;
        'mg-death:playerHospital': (...args: Parameters<DeathService['hospital']>) => alt.IVector3;
    }
}

export function useMedicalService() {
    return {
        unconscious(...args: Parameters<DeathService['unconscious']>) {
            const service = useServiceRegister().get('medicalService');
            if (service && service.unconscious) 
                service.unconscious(...args);

            alt.emit('mg-death:playerUnconscious', ...args);
        },
        async revive(...args: Parameters<DeathService['revive']>) {
            const service = useServiceRegister().get('medicalService');
            if (service && service.revive) 
                service.revive(...args);

            alt.emit('mg-death:playerRevive', ...args);
        },
        async revived(...args: Parameters<DeathService['revived']>) {
            const service = useServiceRegister().get('medicalService');
            if (service && service.revived) 
                service.revived(...args);

            alt.emit('mg-death:playerRevived', ...args);
        },
        async respawn(...args: Parameters<DeathService['respawn']>) {
            const service = useServiceRegister().get('medicalService');
            if (service && service.respawn) 
                service.respawn(...args);

            alt.emit('mg-death:playerRespawned', ...args);
        },
        hospital(...args: Parameters<DeathService['hospital']>) {
            const service = useServiceRegister().get('medicalService');            
            alt.emit('mg-death:playerHospital', ...args);
            return service.hospital(...args);
        },
        called(...args: Parameters<DeathService['called']>) {
            const service = useServiceRegister().get('medicalService');
            if (service && service.called) 
                service.called(...args);

            alt.emit('mg-death:playerCalledEms', ...args);
        }
    }; 
}