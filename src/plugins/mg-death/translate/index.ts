import { useTranslate } from '@Shared/translate.js';
const { setBulk } = useTranslate();

setBulk({
    en: {
        'death.downed': 'Emergency system',
        'death.critical': 'You have fallen unconscious due to your injuries.',
        'death.timerUntilRespawn': ' until the rescue helicopter arrives.',
        'death.callEMS': 'Press G to make an emergency call.',
        'death.emsCalled': 'The emergency call has been made.',
        'death.pressEToRespawn': 'Press E to be picked up by the helicopter.',
        'death.beingRevived': 'Resuscitation underway...',
    },
    de: {
        'death.downed': 'Notfallsystem',
        'death.critical': 'Du bist durch deine Verletzungen ohnmächtig geworden.',
        'death.timerUntilRespawn': ' bis zum Eintreffen des Rettungshelikopters.',
        'death.callEMS': 'Drücke G, um einen Notruf abzusetzen',
        'death.emsCalled': 'Der Notruf wurde abgesetzt',
        'death.pressEToRespawn': 'Drücke E, um mit dem Helikopter abgeholt zu werden',
        'death.beingRevived': 'Reanimation im Gange...',
    }
});