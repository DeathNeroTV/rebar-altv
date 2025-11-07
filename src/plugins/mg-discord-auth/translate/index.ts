import { useTranslate } from '@Shared/translate.js';
const { setBulk } = useTranslate();

setBulk({
    en: {
        'discord.auth.to.long': 'No session request found. Please restart the client.',
        'discord.auth.no.session': 'No session request found. Please restart the client.',
        'discord.auth.already.complete': 'Session request already completed. Please restart the client.',
        'discord.auth.expired.session': 'Authentication session has expired. Please restart the client.',
        'discord.auth.token.failed': 'Authentication with Discord failed. Please restart the client.',
        'discord.auth.request.failed': 'Unable to fetch the current Discord user.',
        'discord.auth.account.failed': 'Account could not be created or retrieved.',
        'discord.auth.guild.no.member': 'You are not a member of our Discord server. Please join before connecting.',
        'discord.auth.guild.no.whitelist': 'You are not on the whitelist. Please review our whitelist policy.',
        'discord.auth.guild.pending.whitelist': 'You have already sent a whitelist request to the team.',
        'discord.auth.guild.denied.whitelist': 'Your whitelist request has been denied.',
        'discord.auth.guild.request.whitelist': 'You have sent a whitelist request to the team. Code: {{code}}',
        'discord.auth.success': 'has been verified.',
        'discord.auth.banned.no.reason': 'without any reason',
        'discord.auth.title': 'Discord Verification.',
        'discord.auth.subtile': 'Please wait while we identify who you are.',
        'discord.auth.information': 'You may need to authorize our app in Discord.'
    },
    de: {
        'discord.auth.to.long': 'Keine Sitzungsanforderung gefunden. Starten Sie den Client neu.',
        'discord.auth.no.session': 'Keine Sitzungsanforderung gefunden. Starten Sie den Client neu.',
        'discord.auth.already.complete': 'Sitzungsanforderung bereits abgeschlossen. Starten Sie den Client neu.',
        'discord.auth.expired.session': 'Authentifizierungssitzung abgelaufen. Starten Sie den Client neu.',
        'discord.auth.token.failed': 'Authentifizierung bei Discord fehlgeschlagen. Starten Sie den Client neu.',
        'discord.auth.request.failed': 'Aktuellen Discord-Benutzer abrufen nicht möglich.',
        'discord.auth.account.failed': 'Konto konnte nicht erstellt oder abgerufen werden.',
        'discord.auth.guild.no.member': 'Sie sind nicht Mitglied unseres Discord-Servers. Bitte treten Sie vor der Verbindung bei.',
        'discord.auth.guild.no.whitelist': 'Sie sind nicht auf der Whitelist. Bitte überprüfen Sie unsere Whitelist-Richtlinien.',
        'discord.auth.guild.pending.whitelist': 'Sie haben bereits eine Whitelistanfrage an das Team gesendet. Code: {{code}}',
        'discord.auth.guild.denied.whitelist': 'Ihre Whitelistanfrage wurde abgelehnt.',
        'discord.auth.guild.request.whitelist': 'Sie haben eine Whitelistanfrage an das Team gesendet. Code: {{code}}',
        'discord.auth.success': 'wurde verifiziert.',
        'discord.auth.banned.no.reason': 'ohne jeglichen Grund',
        'discord.auth.title': 'Discord-Verifizierung.',
        'discord.auth.subtile': 'Warte, bis wir wissen, wer du bist.',
        'discord.auth.information': 'Möglicherweise müssen Sie unsere App in Discord autorisieren.'
    }
})