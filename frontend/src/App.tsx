import { useEffect, useState } from 'react';

import './App.css';
import { clearToken, getToken } from './auth';
import { LoginPage } from './components/LoginPage';
import { hasCompletedTour, OnboardingTour, type TourStep } from './components/OnboardingTour';
import { UploadPage } from './components/UploadPage';

const TOUR_STEPS: TourStep[] = [
  {
    target: 'upload',
    title: '选择 PDF',
    body: '拖入或点击选择一份或多份 JABIL 采购单 PDF。',
  },
  {
    target: 'parse',
    title: '解析',
    body: '点击「解析 PDF」，系统会提取 PO 编号、日期、收货地址和物料行。',
  },
  {
    target: 'export',
    title: '导出',
    body: '确认预览无误后，点击「下载 Excel」导出固定格式工作簿。',
  },
];

export default function App() {
  const [token, setTokenState] = useState<string | null>(() => getToken());
  const [isTourOpen, setIsTourOpen] = useState(false);

  useEffect(() => {
    if (token && !hasCompletedTour()) {
      const timer = window.setTimeout(() => setIsTourOpen(true), 400);
      return () => window.clearTimeout(timer);
    }
  }, [token]);

  if (!token) {
    return <LoginPage onLogin={setTokenState} />;
  }

  return (
    <main className="shell">
      <section className="app-card">
        <header className="card-header" data-tour="topbar">
          <div className="brand-lockup">
            <span className="brand-mark">PO</span>
            <div>
              <h1>PDF 采购单解析</h1>
              <p>上传 · 解析 · 下载 Excel</p>
            </div>
          </div>
          <div className="topbar-actions">
            <button className="secondary" type="button" onClick={() => setIsTourOpen(true)}>
              引导
            </button>
            <button
              className="secondary"
              type="button"
              onClick={() => {
                clearToken();
                setTokenState(null);
              }}
            >
              退出
            </button>
          </div>
        </header>
        <UploadPage token={token} />
      </section>
      <OnboardingTour isOpen={isTourOpen} steps={TOUR_STEPS} onClose={() => setIsTourOpen(false)} />
    </main>
  );
}
