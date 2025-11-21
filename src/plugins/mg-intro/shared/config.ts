import { useTranslate } from "@Shared/translate.js";

const { t } = useTranslate('de');

export const IntroConfig = {
    team: [
        { name: 'DeathNeroTV', role: [t('intro.team.manager'), t('intro.team.dev')] },
        { name: 'Gremmler86', role: [t('intro.team.manager'), t('intro.team.test')] },
        { name: 'Sindy1302', role: [t('intro.team.mod'), t('intro.team.test')] },
    ]
};