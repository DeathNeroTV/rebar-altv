import { useApi } from '@Server/api/index.js';
import { sendNotification, createTextlabel, removeTextlabel, sendNotificationToAll } from './controller.js';
import { NotificationTypes } from '../../shared/interface.js';

const API_NAME = 'notify-api';

function useNotificationAPI() {
    const general = {
        send: sendNotification,
        sendAll: sendNotificationToAll,
        getTypes: () => {
            return NotificationTypes;
        },
    };

    const textLabel = {
        create: createTextlabel,
        remove: removeTextlabel,
    };

    return {
        general,
        textLabel,
    };
}

declare global {
    export interface ServerPlugin {
        [API_NAME]: ReturnType<typeof useNotificationAPI>;
    }
}

useApi().register(API_NAME, useNotificationAPI());
