import { FormEvent, useState } from 'react';

import { login } from '../api';
import { setToken } from '../auth';

interface LoginPageProps {
  onLogin: (token: string) => void;
}

export function LoginPage({ onLogin }: LoginPageProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const response = await login(username, password);
      setToken(response.access_token);
      onLogin(response.access_token);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-hero" aria-label="PDF PO Extractor sign in">
        <div className="auth-copy">
          <span className="brand-mark large">PO</span>
          <p className="eyebrow">JABIL purchase order extraction</p>
          <h1>Turn PO PDFs into clean Excel rows.</h1>
          <p>
            Upload purchase-order PDFs, review every material line, and export the fixed workbook your team expects.
          </p>
        </div>

        <form className="auth-card" onSubmit={handleSubmit}>
          <div>
            <p className="eyebrow">Secure workspace</p>
            <h2>Sign in</h2>
          </div>
          <label>
            Username
            <input value={username} onChange={(event) => setUsername(event.target.value)} autoComplete="username" />
          </label>
          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
            />
          </label>
          {error && <div className="error-banner">{error}</div>}
          <button type="submit" disabled={isSubmitting || !username || !password}>
            {isSubmitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </section>
    </main>
  );
}
