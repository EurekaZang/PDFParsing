import { ChangeEvent, useMemo, useState } from 'react';

import { exportExcel, parsePdfFiles } from '../api';
import type { ParseResult } from '../types';
import { ResultTable } from './ResultTable';

interface UploadPageProps {
  token: string;
}

export function UploadPage({ token }: UploadPageProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [results, setResults] = useState<ParseResult[]>([]);
  const [error, setError] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const summary = useMemo(() => {
    const parsed = results.filter((result) => result.status === 'parsed').length;
    const warning = results.filter((result) => result.status === 'warning').length;
    const failed = results.filter((result) => result.status === 'failed').length;
    const lineItems = results.reduce((total, result) => total + result.line_items.length, 0);
    return { parsed, warning, failed, lineItems };
  }, [results]);

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    setFiles(Array.from(event.target.files ?? []));
    setError('');
  }

  async function handleParse() {
    setError('');
    setIsParsing(true);

    try {
      const response = await parsePdfFiles(files, token);
      setResults(response.results);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse files');
    } finally {
      setIsParsing(false);
    }
  }

  async function handleExport() {
    setError('');
    setIsExporting(true);

    try {
      const blob = await exportExcel(results, token);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'purchase_orders.xlsx';
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to export Excel');
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <div className="workspace">
      <section className="panel upload-panel">
        <div>
          <h2>Upload PDFs</h2>
          <p>Select one or more JABIL purchase-order PDFs. Parsed rows will appear below.</p>
        </div>
        <input type="file" accept="application/pdf,.pdf" multiple onChange={handleFileChange} />
        <div className="actions">
          <button type="button" disabled={!files.length || isParsing} onClick={handleParse}>
            {isParsing ? 'Parsing…' : `Parse ${files.length || ''} PDF${files.length === 1 ? '' : 's'}`}
          </button>
          <button className="secondary" type="button" disabled={!results.length || isExporting} onClick={handleExport}>
            {isExporting ? 'Exporting…' : 'Download Excel'}
          </button>
        </div>
        {files.length > 0 && (
          <ul className="file-list">
            {files.map((file) => (
              <li key={`${file.name}-${file.size}`}>{file.name}</li>
            ))}
          </ul>
        )}
        {error && <div className="error-banner">{error}</div>}
      </section>

      {results.length > 0 && (
        <section className="summary-grid">
          <div><strong>{summary.parsed}</strong><span>Parsed</span></div>
          <div><strong>{summary.warning}</strong><span>Warnings</span></div>
          <div><strong>{summary.failed}</strong><span>Failed</span></div>
          <div><strong>{summary.lineItems}</strong><span>Line Items</span></div>
        </section>
      )}

      <section className="panel">
        <h2>Preview</h2>
        <ResultTable results={results} />
      </section>
    </div>
  );
}
