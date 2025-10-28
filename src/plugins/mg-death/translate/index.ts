import { useTranslate } from '@Shared/translate.js';
const { setBulk } = useTranslate();

setBulk({
    en: {
        'death.downed': 'Unconscious',
        'death.critical': 'You are critically injured. Revival soon.',
        'death.timerUntilRespawn': ' until the helicopter arrives.',
        'death.callEMS': 'Press G to call EMS.',
        'death.emsCalled': 'EMS called',
        'death.pressEToRespawn': 'Press E to be picked up by helicopter.',
        'death.beingRevived': 'Being revived...',
    },
    de: {
        'death.downed': 'Bewusstlos',
        'death.critical': 'Du bist kritisch verletzt. Reanimation in Kürze.',
        'death.timerUntilRespawn': ' bis zum Eintreffen des Helikopters.',
        'death.callEMS': 'Drücke G für Notruf',
        'death.emsCalled': 'Notruf abgesetzt',
        'death.pressEToRespawn': 'Drücke E, um mit dem Helikopter abgeholt zu werden',
        'death.beingRevived': 'Wird wiederbelebt ...',
    }
});