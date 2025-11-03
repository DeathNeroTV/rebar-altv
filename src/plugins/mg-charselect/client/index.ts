import * as alt from 'alt-client';
import { useCamera } from '@Client/player/camera.js';
import { CharacterSelectEvents } from '../shared/characterSelectEvents.js';

const camera = useCamera();

function handleToggleCamera(value: boolean) {    
    if (value) camera.destroy();
    else camera.create();
}

alt.onServer(CharacterSelectEvents.toClient.toggleCamera, handleToggleCamera);