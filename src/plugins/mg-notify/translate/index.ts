import { useTranslate } from '@Shared/translate.js';

const { setBulk } = useTranslate();

setBulk({
    de: {
        'notification.title': 'Trial Life Roleplay',
        'notification.subtitle': 'Meldung vom Team',
        'notification.timing.now': 'Jetzt',
        'notification.character.created.title': 'Charakter erstellt',
        'notification.character.created.subtitle': 'Willkommen!',
        'notification.character.created.message': 'Herzlich Willkommen auf unserem Server, {{name}}!',
        'notification.character.welcomeback.title': 'Charakter aussgewählt',
        'notification.character.welcomeback.subtitle': 'Schön dich zu sehen!',
        'notification.character.welcomeback.message': 'Willkommen zurück auf unserem Server, {{name}}!',
    },
    en: {
        'notification.title': 'Trial Life Roleplay',
        'notification.subtitle': 'Message from the team',
        'notification.timing.now': 'now',
        'notification.character.created.title': 'Character Created',
        'notification.character.created.subtitle': 'Welcome!',
        'notification.character.created.message': 'Welcome to our server, {{name}}!',
        'notification.character.welcomeback.title': 'Character selected',
        'notification.character.welcomeback.subtitle': 'Good to see you!',
        'notification.character.welcomeback.message': 'Welcome back to our server, {{name}}!',
    },
});