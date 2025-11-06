import * as alt from 'alt-server';

import { useApi } from '@Server/api/index.js';
import { useRebar } from '@Server/index.js';
import { sendNotification } from './src/controller.js';
import { MGNotifications } from '../shared/config.js';
import { useTranslate } from '@Shared/translate.js';

import './src/api.js';
import '../translate/index.js';
import { Label, NotificationTypes, VueNotification } from '../shared/interface.js';
import { NotifyEvents } from '../shared/events.js';

const { t } = useTranslate('de');
const api = useApi();
const Rebar = useRebar();

const sendCharacterNotification = (
    player: alt.Player,
    type: NotificationTypes,
    titleKey: string,
    subtitleKey: string,
    messageKey: string,
) => {
    const playerData = Rebar.document.character.useCharacter(player).get();
    sendNotification(player, {
        icon: type,
        title: t(titleKey),
        subtitle: t(subtitleKey),
        message: t(messageKey, { name: playerData.name.replaceAll('_', ' ') }),        
    });
};

const handleCharacterCreated = (player: alt.Player) => {
    sendCharacterNotification(
        player,
        NotificationTypes.SUCCESS,
        'notification.character.created.title',
        'notification.character.created.subtitle',
        'notification.character.created.message',
    );
};

const handleCharacterCreateSkip = (player: alt.Player) => {
    sendCharacterNotification(
        player,
        NotificationTypes.SUCCESS,
        'notification.character.welcomeback.title',
        'notification.character.welcomeback.subtitle',
        'notification.character.welcomeback.message',
    );
};

Rebar.services.useServiceRegister().register('notificationService', {
    broadcast(message: string, type: NotificationTypes) {
        const notify: VueNotification = {
            icon: type,
            message,
            title: '',
            duration: 5000,
            id: Date.now(),
            oggFile: 'notification',
            elapsedSeconds: 0,
            startTime: Date.now(),
            progress: 0
        };
        for (const player of [...alt.Player.all]) {
            
            sendCharacterNotification(player, type, t('notification.title'), t('notification.subtitle'), message);
        }
    },
    emit(player, message: string, type: NotificationTypes) {
        const notify: VueNotification = {
            icon: type,
            message,
            title: '',
            duration: 5000,
            id: Date.now(),
            oggFile: 'notification',
            elapsedSeconds: 0,
            startTime: Date.now(),
            progress: 0
        };
        sendCharacterNotification(player, type, t('notification.title'), t('notification.subtitle'), message);
    },
});

async function init() {
    const charCreatorApi = await api.getAsync('character-creator-api');
    charCreatorApi.onCreate(handleCharacterCreated);
    charCreatorApi.onSkipCreate(handleCharacterCreateSkip);
}

if (MGNotifications.enableRebarSelector) {
    init();
}

function handleCallback(player: alt.Player, label: Label) {}

alt.onClient(NotifyEvents.toServer.sendLabelDataToServer, handleCallback);