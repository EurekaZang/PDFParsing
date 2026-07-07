import { useState } from 'react';

import './App.css';
import { clearToken, getToken } from './auth';
import { LoginPage } from './components/LoginPage';
import { UploadPage } from './components/UploadPage';

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
      <UploadPage token={token} />
    </main>
  );
}
