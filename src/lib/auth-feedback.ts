// Public mail endpoints confirm receipt, never account existence or delivery.
export const emailRequestFeedback =
  'Førespurnaden er teken imot. Av omsyn til personvernet stadfestar vi ikkje om adressa har konto eller om e-post vart send. Sjå etter ei lenkje i innboksen og søppelpost. Kjem ho ikkje, kan du prøve igjen seinare.';

export function authErrorMessage(code?: string, status?: number) {
  if (status === 429) return 'For mange forsøk. Vent litt og prøv igjen.';
  const messages: Record<string, string> = {
    INVALID_EMAIL_OR_PASSWORD: 'E-post eller passord er feil.',
    EMAIL_NOT_VERIFIED:
      'Stadfest e-postadressa før du loggar inn. Du kan be om ei ny lenkje nedanfor.',
    INVALID_EMAIL: 'Skriv inn ei gyldig e-postadresse.',
    PASSWORD_TOO_SHORT: 'Passordet må ha minst 10 teikn.',
    PASSWORD_TOO_LONG: 'Passordet kan ha høgst 128 teikn.',
    INVALID_TOKEN: 'Lenkja er ugyldig, brukt eller har gått ut. Be om ei ny lenkje.',
    TOKEN_EXPIRED: 'Lenkja har gått ut. Be om ei ny lenkje.',
    TOO_MANY_REQUESTS: 'For mange forsøk. Vent litt og prøv igjen.',
  };
  return messages[code || ''] || 'Førespurnaden kunne ikkje fullførast. Prøv igjen seinare.';
}
