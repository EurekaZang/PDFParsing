import { ChangeEvent, DragEvent, useMemo, useRef, useState } from 'react';

import { exportExcel, parsePdfFiles } from '../api';
import type { ParseResult } from '../types';
import { ResultTable } from './ResultTable';

interface UploadPageProps {
  token: string;
}

function formatSize(bytes: number): string {
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(0)} KB`;
  }
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

export function UploadPage({ token }: UploadPageProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [results, setResults] = useState<ParseResult[]>([]);
  const [error, setError] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const summary = useMemo(() => {
    const parsed = results.filter((result) => result.status === 'parsed').length;
    const warning = results.filter((result) => result.status === 'warning').length;
    const failed = results.filter((result) => result.status === 'failed').length;
    const lineItems = results.reduce((total, result) => total + result.line_items.length, 0);
    return { parsed, warning, failed, lineItems };
  }, [results]);

  function setPdfFiles(next: File[]) {
    const pdfs = next.filter(
      (file) => file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
    );
    setFiles(pdfs);
    setError(pdfs.length || !next.length ? '' : '请选择 PDF 文件');
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    setPdfFiles(Array.from(event.target.files ?? []));
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);
    setPdfFiles(Array.from(event.dataTransfer.files ?? []));
  }

  function removeFile(name: string, size: number) {
    setFiles((current) => current.filter((file) => !(file.name === name && file.size === size)));
  }

  function clearAll() {
    setFiles([]);
    setResults([]);
    setError('');
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  }

  async function handleParse() {
    setError('');
    setIsParsing(true);

    try {
      const response = await parsePdfFiles(files, token);
      setResults(response.results);
    } catch (err) {
      setError(err instanceof Error ? err.message : '解析失败');
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
      setError(err instanceof Error ? err.message : '导出 Excel 失败');
    } finally {
      setIsExporting(false);
    }
  }

  const hasResults = results.length > 0;

  return (
    <section className="work-card" aria-label="PDF 采购单解析">
      <div className="work-body">
        <div
          className={`drop-zone${isDragging ? ' dragging' : ''}${files.length ? ' has-files' : ''}`}
          data-tour="upload"
          onDragEnter={(event) => {
            event.preventDefault();
            setIsDragging(true);
          }}
          onDragOver={(event) => {
            event.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={(event) => {
            event.preventDefault();
            if (event.currentTarget === event.target) {
              setIsDragging(false);
            }
          }}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              inputRef.current?.click();
            }
          }}
        >
          <input
            ref={inputRef}
            type="file"
            accept="application/pdf,.pdf"
            multiple
            onChange={handleFileChange}
            onClick={(event) => event.stopPropagation()}
          />
          <div className="drop-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M12 16V6m0 0l-3.5 3.5M12 6l3.5 3.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M5 16.5V18a2 2 0 002 2h10a2 2 0 002-2v-1.5" strokeLinecap="round" />
            </svg>
          </div>
          <div className="drop-copy">
            <strong>{files.length ? '继续添加或替换 PDF' : '拖入 PDF，或点击选择'}</strong>
            <span>支持批量上传 JABIL 采购单</span>
          </div>
        </div>

        {files.length > 0 && (
          <div className="file-strip" data-tour="file-list">
            <div className="file-strip-head">
              <span>
                已选 <strong>{files.length}</strong> 个文件
              </span>
              <button className="text-btn" type="button" onClick={clearAll}>
                清空
              </button>
            </div>
            <ul className="file-chips" aria-label="已选文件">
              {files.map((file) => (
                <li key={`${file.name}-${file.size}`}>
                  <span className="chip-name" title={file.name}>
                    {file.name}
                  </span>
                  <span className="chip-size">{formatSize(file.size)}</span>
                  <button
                    className="chip-remove"
                    type="button"
                    aria-label={`移除 ${file.name}`}
                    onClick={() => removeFile(file.name, file.size)}
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="action-bar" data-tour="actions">
          <button type="button" disabled={!files.length || isParsing} onClick={handleParse} data-tour="parse">
            {isParsing ? '解析中…' : '解析 PDF'}
          </button>
          <button
            className="secondary"
            type="button"
            disabled={!hasResults || isExporting}
            onClick={handleExport}
            data-tour="export"
          >
            {isExporting ? '导出中…' : '下载 Excel'}
          </button>
        </div>

        {error && <div className="error-banner">{error}</div>}

        {hasResults && (
          <div className="status-bar" aria-label="解析摘要">
            <span className="stat ok">
              <em>{summary.parsed}</em> 成功
            </span>
            <span className="stat warn">
              <em>{summary.warning}</em> 警告
            </span>
            <span className="stat bad">
              <em>{summary.failed}</em> 失败
            </span>
            <span className="stat">
              <em>{summary.lineItems}</em> 行物料
            </span>
          </div>
        )}

        <div className="result-area" data-tour="preview">
          <ResultTable results={results} />
        </div>
      </div>
    </section>
  );
}
