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
      <section className="hero-panel">
        <div>
          <p className="eyebrow">One clean workbook from every PO</p>
          <h2>Upload PDFs. Review the rows. Export Excel.</h2>
          <p>
            Built for JABIL purchase orders: batch upload, parse status, warnings, and material lines in one focused workspace.
          </p>
        </div>
      </section>

      <section className="panel upload-panel" data-tour="upload">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Step 1</p>
            <h2>Choose purchase-order PDFs</h2>
          </div>
          <span className="file-count">{files.length} selected</span>
        </div>

        <label className="drop-zone">
          <input type="file" accept="application/pdf,.pdf" multiple onChange={handleFileChange} />
          <span className="drop-icon">⌁</span>
          <strong>{files.length ? 'Add or replace PDF files' : 'Select PDF files'}</strong>
          <span>Batch upload supported. Parsed rows will appear in the preview below.</span>
        </label>

        {files.length > 0 && (
          <ul className="file-list" aria-label="Selected files" data-tour="file-list">
            {files.map((file) => (
              <li key={`${file.name}-${file.size}`}>
                <span>{file.name}</span>
                <small>{(file.size / 1024 / 1024).toFixed(2)} MB</small>
              </li>
            ))}
          </ul>
        )}

        <div className="actions">
          <button type="button" disabled={!files.length || isParsing} onClick={handleParse} data-tour="parse">
            {isParsing ? 'Parsing…' : `Parse ${files.length || ''} PDF${files.length === 1 ? '' : 's'}`}
          </button>
          <button className="secondary" type="button" disabled={!results.length || isExporting} onClick={handleExport} data-tour="export">
            {isExporting ? 'Exporting…' : 'Download Excel'}
          </button>
        </div>
        {error && <div className="error-banner">{error}</div>}
      </section>

      {results.length > 0 && (
        <section className="summary-grid" aria-label="Parse summary">
          <div><span>Parsed</span><strong>{summary.parsed}</strong></div>
          <div><span>Warnings</span><strong>{summary.warning}</strong></div>
          <div><span>Failed</span><strong>{summary.failed}</strong></div>
          <div><span>Line items</span><strong>{summary.lineItems}</strong></div>
        </section>
      )}

      <section className="panel preview-panel" data-tour="preview">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Step 2</p>
            <h2>Preview extracted rows</h2>
          </div>
          {results.length > 0 && <span className="file-count">{results.length} files parsed</span>}
        </div>
        <ResultTable results={results} />
      </section>
    </div>
  );
}
