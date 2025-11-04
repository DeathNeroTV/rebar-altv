import * as alt from 'alt-server';
import { useRebar } from '@Server/index.js';

const Rebar = useRebar();
const API_NAME = 'admin-api'; 

export function useAdmin() {

    
    return {

    }
}

declare global {
    export interface ServerPlugin {
        [API_NAME]:  ReturnType<typeof useAdmin>
    }
}


Rebar.useApi().register(API_NAME, useAdmin());