import type { ParseBatchResponse, ParseResult, TokenResponse } from './types';

async function parseJsonError(response: Response): Promise<string> {
  try {
    const body = await response.json();
    return typeof body.detail === 'string' ? body.detail : 'Request failed';
  } catch {
    return 'Request failed';
  }
}

export async function login(username: string, password: string): Promise<TokenResponse> {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });

  if (!response.ok) {
    throw new Error(await parseJsonError(response));
  }

  return response.json() as Promise<TokenResponse>;
}

export async function parsePdfFiles(files: File[], token: string): Promise<ParseBatchResponse> {
  const formData = new FormData();
  files.forEach((file) => formData.append('files', file));

  const response = await fetch('/api/files/parse', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData
  });

  if (!response.ok) {
    throw new Error(await parseJsonError(response));
  }

  return response.json() as Promise<ParseBatchResponse>;
}

export async function exportExcel(results: ParseResult[], token: string): Promise<Blob> {
  const response = await fetch('/api/excel/export', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ results })
  });

  if (!response.ok) {
    throw new Error(await parseJsonError(response));
  }

  return response.blob();
}
