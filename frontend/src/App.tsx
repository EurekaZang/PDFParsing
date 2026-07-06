import { useState } from 'react';

import './App.css';
import { clearToken, getToken } from './auth';
import { LoginPage } from './components/LoginPage';

export default function App() {
  const [token, setTokenState] = useState<string | null>(() => getToken());

  if (!token) {
    return <LoginPage onLogin={setTokenState} />;
  }

  return (
    <main className="shell">
      <header className="topbar">
        <div>
          <h1>PDF PO Extractor</h1>
          <p>Upload JABIL purchase-order PDFs and export a fixed Excel workbook.</p>
        </div>
        <button
          className="secondary"
          type="button"
          onClick={() => {
            clearToken();
            setTokenState(null);
          }}
        >
          Sign out
        </button>
      </header>
      <section className="panel">
        <h2>Upload interface will be added in Task 8</h2>
        <p>The login flow is connected. Continue with the upload and preview task.</p>
      </section>
    </main>
  );
}
