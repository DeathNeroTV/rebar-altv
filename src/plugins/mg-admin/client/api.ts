import * as alt from 'alt-client';
import { useRebarClient } from '@Client/index.js';

const Rebar = useRebarClient();
const API_NAME = 'admin-api';

export function useAdmin() {

    return {

    }
}

declare global {
    export interface ClientPlugin {
        [API_NAME]: ReturnType<typeof useAdmin>;
    }
}

Rebar.useClientApi().register(API_NAME, useAdmin());