import { useTranslate } from '@Shared/translate.js';
const { setBulk } = useTranslate();

setBulk({
    en: {
        'intro.title': 'trial life roleplay',
        'intro.progress': 'Connecting to the network...',
        'intro.team.manager': 'Project management',
        'intro.team.admin': 'Administrator',
        'intro.team.dev': 'Developer',
        'intro.team.mod': 'Moderator',
        'intro.team.sup': 'Supporter',
        'intro.team.test': 'Tester',
    },
    de: {
        'intro.title': 'trial life roleplay',
        'intro.progress': 'Verbindung zum Netzwerk wird hergestellt...',
        'intro.team.manager': 'Projektleiter*in',
        'intro.team.admin': 'Administrator*in',
        'intro.team.mod': 'Moderator*in',
        'intro.team.sup': 'Supporter*in',
        'intro.team.dev': 'Entwickler*in',
        'intro.team.test': 'Tester*in',
    }
});