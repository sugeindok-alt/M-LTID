'use client';
import { useState, useSyncExternalStore, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight } from 'lucide-react';
import { authClient } from '@/lib/auth-client';
import { authErrorMessage, emailRequestFeedback } from '@/lib/auth-feedback';
type Mode = 'login' | 'register' | 'forgot' | 'reset' | 'verify' | 'confirm';
const subscribe = () => () => {};
const titles: Record<Mode, string> = {
  login: 'Velkomen tilbake.',
  register: 'Din eigen oppskriftsbok.',
  forgot: 'Gløymt passordet?',
  reset: 'Ein ny start.',
  verify: 'Stadfest e-postadressa.',
  confirm: 'Stadfest e-postadressa.',
};
const descriptions: Record<Mode, string> = {
  login: 'Logg inn og finn tilbake til det du likar.',
  register: 'Samle favorittar og gjer handleturen litt enklare.',
  forgot: 'Vi hjelper deg med å få tilgang til kontoen igjen.',
  reset: 'Vel eit nytt, sterkt passord til kontoen din.',
  verify: 'Be om ei ny lenkje dersom den førre har gått ut.',
  confirm: 'Trykk nedanfor for å stadfeste e-postadressa di.',
};
export function AuthForm({
  mode,
  ready,
  localEmail,
  firebase = false,
  token,
  nextPath,
  queryError,
}: {
  mode: Mode;
  ready: boolean;
  localEmail: boolean;
  firebase?: boolean;
  token?: string;
  nextPath?: string;
  queryError?: string;
}) {
  const router = useRouter();
  const hydrated = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
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
        mode === 'confirm'
          ? await authClient.$fetch('/verify-email', { method: 'POST', body: { token } })
          : mode === 'verify' && firebase
            ? await authClient.$fetch('/send-verification-email', {
                method: 'POST',
                body: { email, password },
              })
            : mode === 'login'
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
      if (result.error) {
        setFeedback(
          authErrorMessage(
            'code' in result.error ? String(result.error.code) : undefined,
            result.error.status,
          ),
        );
        setFailed(true);
        return;
      }
      if (mode === 'login') {
        router.push(next);
        router.refresh();
        return;
      }
      if (mode === 'reset') {
        setFeedback('Passordet er oppdatert. Du kan logge inn med det nye passordet.');
        return;
      }
      if (mode === 'confirm') {
        setFeedback('E-postadressa er stadfesta. Du kan logge inn no.');
        return;
      }
      setFeedback(
        localEmail
          ? 'Lokal testmodus: eventuell e-post er lagra i .local/mail. Ingen e-post er send.'
          : emailRequestFeedback,
      );
    } catch {
      setFeedback('Vi fekk ikkje kontakt med tenesta. Kontroller tilkoplinga og prøv igjen.');
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
          Lenkja er ugyldig, brukt eller har gått ut. Be om ei ny lenkje.
        </div>
      )}
      {localEmail && ready && (
        <p className="form-message">
          Lokal e-posttesting er på. Meldingar blir lagra som filer på serveren.
        </p>
      )}
      <form method="post" onSubmit={submit} className="form-stack">
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
        {!['reset', 'confirm'].includes(mode) && (
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
        {(['register', 'login', 'reset'].includes(mode) || (firebase && mode === 'verify')) && (
          <label>
            Passord
            <input
              name="password"
              type="password"
              autoComplete={
                mode === 'login' || mode === 'verify' ? 'current-password' : 'new-password'
              }
              placeholder={
                mode === 'login' || mode === 'verify' ? 'Passordet ditt' : 'Minst 10 teikn'
              }
              minLength={mode === 'login' || mode === 'verify' ? 1 : 10}
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
        <button
          className="button"
          disabled={!ready || !hydrated || busy || (['reset', 'confirm'].includes(mode) && !token)}
        >
          {busy
            ? 'Eit augeblikk …'
            : mode === 'login'
              ? 'Logg inn'
              : mode === 'register'
                ? 'Opprett konto'
                : mode === 'reset'
                  ? 'Lagre nytt passord'
                  : mode === 'confirm'
                    ? 'Stadfest e-post'
                    : 'Be om ny lenkje'}
          <ArrowRight size={17} />
        </button>
      </form>
      <div className="auth-links">
        {mode === 'login' ? (
          <>
            <Link href="/registrer">Opprett ein konto</Link>
            <Link href="/gloymt-passord">Gløymt passord?</Link>
            <Link href="/stadfest-epost">Ny stadfestingslenkje</Link>
          </>
        ) : (
          <>
            <Link href="/logg-inn">Tilbake til innlogging</Link>
            {mode === 'reset' && <Link href="/gloymt-passord">Ny passordlenkje</Link>}
            {mode === 'register' && <Link href="/stadfest-epost">Ny stadfestingslenkje</Link>}
          </>
        )}
      </div>
      <p className="source-note" style={{ marginTop: 28 }}>
        Vi tek vare på kontoen og det du lagrar. <Link href="/personvern">Les om personvern.</Link>
      </p>
    </div>
  );
}
