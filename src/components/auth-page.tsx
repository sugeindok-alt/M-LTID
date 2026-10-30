import { AuthForm } from './auth-form';
import { authConfigured } from '@/lib/auth';
export function AuthPage(props: {
  mode: 'login' | 'register' | 'forgot' | 'reset' | 'verify' | 'confirm';
  token?: string;
  nextPath?: string;
  queryError?: string;
}) {
  return (
    <div className="auth-shell">
      <div className="auth-story">
        <p className="eyebrow">DITT EIGE LILLE MATUNIVERS</p>
        <span className="auth-art" aria-hidden="true">
          M.
        </span>
        <h2>
          Gode måltid.
          <br />
          <em>Verdt å ta vare på.</em>
        </h2>
        <p>
          Ei oppskriftsbok som alltid er med deg. Frå den første ideen til den siste vara på
          handlelista.
        </p>
      </div>
      <AuthForm
        {...props}
        ready={authConfigured()}
        firebase={process.env.AUTH_PROVIDER === 'firebase'}
        localEmail={
          process.env.AUTH_PROVIDER !== 'firebase' &&
          process.env.EMAIL_TRANSPORT === 'file' &&
          process.env.NODE_ENV !== 'production'
        }
      />
    </div>
  );
}
