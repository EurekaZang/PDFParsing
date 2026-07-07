import { useEffect, useState } from 'react';

import './App.css';
import { clearToken, getToken } from './auth';
import { LoginPage } from './components/LoginPage';
import { hasCompletedTour, OnboardingTour, type TourStep } from './components/OnboardingTour';
import { UploadPage } from './components/UploadPage';

const TOUR_STEPS: TourStep[] = [
  {
    target: 'topbar',
    title: '欢迎来到 PDF 采购单工作台',
    body: '这里用于把 JABIL 采购单 PDF 转成固定格式 Excel。右上角可以重新打开本引导，也可以退出登录。',
  },
  {
    target: 'upload',
    title: '第一步：选择 PDF 文件',
    body: '点击这张上传卡片，选择一个或多个采购单 PDF。支持批量选择，适合一次处理多份订单。',
  },
  {
    target: 'parse',
    title: '第二步：开始解析',
    body: '选中文件后，点击 Parse PDFs。系统会读取 PDF 中的 PO 编号、日期、收货地址和物料行。',
  },
  {
    target: 'file-list',
    title: '确认待处理文件',
    body: '这里会列出本次选择的文件名和大小。解析前可以用它确认没有选错文件。',
  },
  {
    target: 'preview',
    title: '第三步：查看解析预览',
    body: '解析完成后，每个物料行会显示在这里。如果某个字段有风险，警告也会一起出现在表格中。',
  },
  {
    target: 'export',
    title: '第四步：下载 Excel',
    body: '确认预览结果后，点击 Download Excel 下载固定格式工作簿。没有解析结果时按钮会保持不可用。',
  },
];

export default function App() {
  const [token, setTokenState] = useState<string | null>(() => getToken());
  const [isTourOpen, setIsTourOpen] = useState(false);

  useEffect(() => {
    if (token && !hasCompletedTour()) {
      const timer = window.setTimeout(() => setIsTourOpen(true), 500);
      return () => window.clearTimeout(timer);
    }
  }, [token]);

  if (!token) {
    return <LoginPage onLogin={setTokenState} />;
  }

  return (
    <main className="shell">
      <header className="topbar" data-tour="topbar">
        <div className="brand-lockup">
          <span className="brand-mark">PO</span>
          <div>
            <p className="eyebrow">PDF purchase order workspace</p>
            <h1>PDF PO Extractor</h1>
          </div>
        </div>
        <div className="topbar-actions">
          <button className="secondary" type="button" onClick={() => setIsTourOpen(true)}>
            使用引导
          </button>
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
        </div>
      </header>
      <UploadPage token={token} />
      <OnboardingTour isOpen={isTourOpen} steps={TOUR_STEPS} onClose={() => setIsTourOpen(false)} />
    </main>
  );
}
