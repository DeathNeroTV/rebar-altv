import { useTranslate } from '@Shared/translate.js';
const { setBulk } = useTranslate();

setBulk({
    en: {
        'death.downed': 'Emergency System',
        'death.critical': 'You have fallen unconscious due to your injuries.',
        'death.timerUntilRespawn': ' until the rescue helicopter arrives.',
        'death.callEMS': 'Press G to call emergency services.',
        'death.emsCalled': 'Emergency services have been called.',
        'death.pressEToRespawn': 'Press E to be picked up by the helicopter.',
        'death.pressedEToRespawn': 'The helicopter has been requested.',
        'death.beingRevived': 'Being resuscitated...',
    },
    de: {
        'death.downed': 'Notfallsystem',
        'death.critical': 'Du bist durch deine Verletzungen ohnmächtig geworden.',
        'death.timerUntilRespawn': ' bis zum Eintreffen des Rettungshelikopters.',
        'death.callEMS': 'Drücke G, um einen Notruf abzusetzen',
        'death.emsCalled': 'Der Notruf wurde abgesetzt',
        'death.pressEToRespawn': 'Drücke E, um mit dem Helikopter abgeholt zu werden',
        'death.pressedEToRespawn': 'Der Hubschrauber wurde angefordert',
        'death.beingRevived': 'Reanimation im Gange...',
    }
});
