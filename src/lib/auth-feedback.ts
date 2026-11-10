// Public mail endpoints confirm receipt, never account existence or delivery.
export const emailRequestFeedback = 'Sjekk e-posten din.';

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
    ACCOUNT_LINK_REQUIRED:
      'Det finst eldre kontodata som må knytast til denne innlogginga. Kontakt eigaren av nettsida for hjelp.',
  };
  return messages[code || ''] || 'Noko gjekk gale. Prøv igjen.';
}
