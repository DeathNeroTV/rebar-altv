import { NotifyEvents } from '../../shared/events.js';
import { Label, Notification } from '../../shared/interface.js';
import { useRebarClient } from '@Client/index.js';

const Rebar = useRebarClient();
const view = Rebar.webview.useWebview();

export function addNotification(notification: Notification) {
    if (!notification.duration) {
        notification.duration = 5000;
    }

    view.emit(NotifyEvents.toWebview.createNotification, notification);
}

export function createTextlabel(label: Label) {
    view.emit(NotifyEvents.toWebview.createLabel, label);
}

export function removeTextlabel() {
    view.emit(NotifyEvents.toWebview.removeLabel);
}
