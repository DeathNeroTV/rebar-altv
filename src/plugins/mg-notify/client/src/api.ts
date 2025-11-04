import { useClientApi } from '@Client/api/index.js';
import { Label, Notification } from '../../shared/interface.js';
import { addNotification, createTextlabel, removeTextlabel } from './controller.js';

const API_NAME = 'notify-api';

export function useNotificationAPI() {
    function create(notification: Notification) {
        addNotification(notification);
    }
    function createTextLabel(label: Label) {
        createTextlabel(label);
    }
    function removeTextLabel() {
        removeTextlabel();
    }
    return {
        create,
        createTextLabel,
        removeTextLabel,
    };
}

declare global {
    export interface ClientPlugin {
        [API_NAME]: ReturnType<typeof useNotificationAPI>;
    }
}

useClientApi().register(API_NAME, useNotificationAPI());
