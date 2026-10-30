'use client';
import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight } from 'lucide-react';
import { authClient } from '@/lib/auth-client';
type Mode = 'login' | 'register' | 'forgot' | 'reset' | 'verify';
const titles: Record<Mode, string> = {
  login: 'Velkomen tilbake.',
  register: 'Din eigen oppskriftsbok.',
  forgot: 'Gløymt passordet?',
  reset: 'Ein ny start.',
  verify: 'Stadfest e-postadressa.',
};
const descriptions: Record<Mode, string> = {
  login: 'Logg inn og finn tilbake til det du likar.',
  register: 'Samle favorittar og gjer handleturen litt enklare.',
  forgot: 'Vi hjelper deg med å få tilgang til kontoen igjen.',
  reset: 'Vel eit nytt, sterkt passord til kontoen din.',
  verify: 'Be om ei ny lenkje dersom den førre har gått ut.',
};
function friendlyError(code?: string, message?: string) {
  const messages: Record<string, string> = {
    INVALID_EMAIL_OR_PASSWORD: 'E-post eller passord er feil.',
    EMAIL_NOT_VERIFIED:
      'Stadfest e-postadressa før du loggar inn. Du kan be om ei ny lenkje nedanfor.',
    USER_ALREADY_EXISTS: 'Kontoen finst frå før. Prøv å logge inn.',
    PASSWORD_TOO_SHORT: 'Passordet må ha minst 10 teikn.',
    INVALID_TOKEN: 'Lenkja er ugyldig eller har gått ut. Be om ei ny lenkje.',
    TOKEN_EXPIRED: 'Lenkja har gått ut. Be om ei ny.',
    TOO_MANY_REQUESTS: 'For mange forsøk. Vent litt og prøv igjen.',
  };
  return messages[code || ''] || message || 'Førespurnaden kunne ikkje fullførast. Prøv igjen.';
}
export function AuthForm({
  mode,
  ready,
  localEmail,
  token,
  nextPath,
  queryError,
}: {
  mode: Mode;
  ready: boolean;
  localEmail: boolean;
  token?: string;
  nextPath?: string;
  queryError?: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [failed, setFailed] = useState(false);
  const next =
    nextPath?.startsWith('/') && !nextPath.startsWith('//') && !nextPath.includes('\\')
      ? nextPath
      : '/profil';
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setFeedback('');
    setFailed(false);
    const data = new FormData(event.currentTarget);
    const email = String(data.get('email') || '');
    const password = String(data.get('password') || '');
    try {
      const result =
        mode === 'login'
          ? await authClient.signIn.email({ email, password, callbackURL: next })
          : mode === 'register'
            ? await authClient.signUp.email({
                email,
                password,
                name: String(data.get('name')),
                callbackURL: '/profil',
              })
            : mode === 'forgot'
              ? await authClient.requestPasswordReset({ email, redirectTo: '/nytt-passord' })
              : mode === 'verify'
                ? await authClient.sendVerificationEmail({ email, callbackURL: '/profil' })
                : await authClient.resetPassword({ newPassword: password, token: token || '' });
      if (result.error) throw new Error(friendlyError(result.error.code, result.error.message));
      if (mode === 'login') {
        router.push(next);
        router.refresh();
        return;
      }
      if (mode === 'reset') {
        setFeedback('Passordet er oppdatert. Du kan logge inn med det nye passordet.');
        return;
      }
      setFeedback(
        localEmail
          ? 'Lokal testmodus: eventuell e-post er lagra i .local/mail. Ingen e-post er send.'
          : mode === 'register'
            ? 'Registreringa er teken imot. Sjå etter ei stadfestingslenkje i innboksen. Har du allereie ein konto, kan du logge inn eller be om ei ny lenkje.'
            : 'Dersom adressa høyrer til ein relevant konto, blir ei lenkje send. Sjå også i søppelpost.',
      );
    } catch (error) {
      setFeedback((error as Error).message);
      setFailed(true);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="auth-form">
      <h1>{titles[mode]}</h1>
      <p>{descriptions[mode]}</p>
      {!ready && (
        <div className="form-message" role="status" style={{ marginBottom: 20 }}>
          Kontofunksjonane ventar på database- og e-postoppsett. Du kan framleis utforske
          oppskrifter og ingrediensar.
        </div>
      )}
      {queryError && (
        <div className="form-message error" role="alert" style={{ marginBottom: 20 }}>
          Lenkja er ugyldig eller har gått ut. Be om ei ny stadfestingslenkje.
        </div>
      )}
      {localEmail && ready && (
        <p className="form-message">
          Lokal e-posttesting er på. Meldingar blir lagra som filer på serveren.
        </p>
      )}
      <form onSubmit={submit} className="form-stack">
        {mode === 'register' && (
          <label>
            Namnet ditt
            <input
              name="name"
              autoComplete="name"
              placeholder="Kva heiter du?"
              minLength={2}
              maxLength={80}
              required
              disabled={!ready}
            />
          </label>
        )}
        {mode !== 'reset' && (
          <label>
            E-postadresse
            <input
              name="email"
              type="email"
              autoComplete="email"
              placeholder="namn@eksempel.no"
              maxLength={254}
              required
              disabled={!ready}
            />
          </label>
        )}
        {['register', 'login', 'reset'].includes(mode) && (
          <label>
            Passord
            <input
              name="password"
              type="password"
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              placeholder={mode === 'login' ? 'Passordet ditt' : 'Minst 10 teikn'}
              minLength={mode === 'login' ? 1 : 10}
              maxLength={128}
              required
              disabled={!ready}
            />
          </label>
        )}
        {feedback && (
          <div
            role={failed ? 'alert' : 'status'}
            className={`form-message ${failed ? 'error' : 'success'}`}
          >
            {feedback}
          </div>
        )}
        <button className="button" disabled={!ready || busy || (mode === 'reset' && !token)}>
          {busy
            ? 'Eit augeblikk …'
            : mode === 'login'
              ? 'Logg inn'
              : mode === 'register'
                ? 'Opprett konto'
                : mode === 'reset'
                  ? 'Lagre nytt passord'
                  : 'Be om ny lenkje'}
          <ArrowRight size={17} />
        </button>
      </form>
      <div className="auth-links">
        {mode === 'login' ? (
          <>
            <Link href="/registrer">Opprett ein konto</Link>
            <Link href="/gløymt-passord">Gløymt passord?</Link>
            <Link href="/stadfest-epost">Ny stadfestingslenkje</Link>
          </>
        ) : (
          <Link href="/logg-inn">Tilbake til innlogging</Link>
        )}
      </div>
      <p className="source-note" style={{ marginTop: 28 }}>
        Vi tek vare på kontoen og det du lagrar. <Link href="/personvern">Les om personvern.</Link>
      </p>
    </div>
  );
}
