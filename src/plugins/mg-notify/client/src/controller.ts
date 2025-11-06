import { MGNotifications } from '@Plugins/mg-notify/shared/config.js';
import { NotifyEvents } from '../../shared/events.js';
import { Label, VueNotification } from '../../shared/interface.js';
import { useRebarClient } from '@Client/index.js';

const Rebar = useRebarClient();
const view = Rebar.webview.useWebview();

export function addNotification(notification: VueNotification) {
    if (!notification.duration) 
        notification.duration = MGNotifications.duration;

    view.emit(NotifyEvents.toWebview.createNotification, notification);
}

export function createTextlabel(label: Label) {
    view.emit(NotifyEvents.toWebview.createLabel, label);
}

export function removeTextlabel() {
    view.emit(NotifyEvents.toWebview.removeLabel);
}
