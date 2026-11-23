import { useState, useEffect } from 'react';
import StrengthAndBreach from './components/StrengthAndBreach';
import PasswordGenerator from './components/PasswordGenerator';
import EncryptionVault from './components/EncryptionVault';
import './App.css';

export default function App() {
  const [activeTab, setActiveTab] = useState('checker'); // 'checker' | 'vault'
  const [targetPassword, setTargetPassword] = useState('');
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('cp_theme') || 'dark';
  });

  // 테마 변경 시 documentElement 및 로컬스토리지 동기화 (민감정보 아님)
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('cp_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  // 생성기에서 비밀번호를 강도 검사기로 전달
  const handleApplyGeneratedPassword = (pwd) => {
    setTargetPassword(pwd);
    setActiveTab('checker');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="app-container" data-theme={theme}>
      {/* 최상단 헤더 */}
      <header className="app-header">
        <div className="header-top">
          <div className="logo-badge">
            <span className="logo-icon">🛡️</span>
            <div>
              <h1 className="logo-title">CyberPass Guard</h1>
              <span className="logo-sub">26-w12-password · Web Crypto & k-Anonymity</span>
            </div>
          </div>
          <div className="header-controls">
            <button
              type="button"
              className="theme-toggle-btn"
              onClick={toggleTheme}
              title={theme === 'dark' ? '화이트모드로 전환' : '다크모드로 전환'}
              aria-label="화면 모드 전환"
            >
              <span className="theme-icon">{theme === 'dark' ? '☀️' : '🌙'}</span>
              <span className="theme-label">{theme === 'dark' ? '화이트모드' : '다크모드'}</span>
            </button>
            <div className="header-status-badge">
              <span className="status-dot" />
              <span>Zero-Knowledge 연산</span>
            </div>
          </div>
        </div>

        {/* 상단 보안 보증 배너 */}
        <div className="security-guarantee-banner" role="status">
          <span className="guarantee-icon">🔒</span>
          <p className="guarantee-text">
            <strong>사이버보안 원칙 준수:</strong> 모든 강도 분석과 해시 계산은 브라우저 내부에서만 처리되며,
            유출 확인 시 SHA-1 해시의 <strong>앞 5글자(Prefix)만 전송</strong>됩니다. 원본 비밀번호는 절대 저장되거나 외부로 유출되지 않습니다.
          </p>
        </div>

        {/* 탭 내비게이션 */}
        <nav className="tab-nav" aria-label="메인 탭 내비게이션">
          <button
            type="button"
            className={`tab-btn ${activeTab === 'checker' ? 'active' : ''}`}
            onClick={() => setActiveTab('checker')}
          >
            <span className="tab-icon">🛡️</span>
            <span className="tab-label">비밀번호 보안 점검 & 생성</span>
          </button>
          <button
            type="button"
            className={`tab-btn ${activeTab === 'vault' ? 'active' : ''}`}
            onClick={() => setActiveTab('vault')}
          >
            <span className="tab-icon">🔐</span>
            <span className="tab-label">AES-GCM 암호화 금고</span>
            <span className="tab-chip">체험 탭</span>
          </button>
        </nav>
      </header>

      {/* 메인 콘텐츠 영역 */}
      <main className="app-main">
        {activeTab === 'checker' ? (
          <div className="dashboard-grid">
            <StrengthAndBreach
              password={targetPassword}
              setPassword={setTargetPassword}
            />
            <PasswordGenerator
              onApplyPassword={handleApplyGeneratedPassword}
            />
          </div>
        ) : (
          <div className="vault-view-wrapper">
            <EncryptionVault />
          </div>
        )}
      </main>

      {/* 하단 푸터 */}
      <footer className="app-footer">
        <div className="footer-content">
          <div className="footer-principles">
            <span className="principle-item">🛡️ 비밀번호 무저장 원칙 (No Storage)</span>
            <span className="principle-item">⚡ 암호학적 난수 CSPRNG (crypto.getRandomValues)</span>
            <span className="principle-item">🌐 최소 전송 원칙 (k-Anonymity HIBP API)</span>
          </div>
          <p className="footer-copy">
            한국폴리텍대학 강서캠퍼스 사이버보안과 12주차 실습 프로젝트 · <code>26-w12-password</code>
          </p>
        </div>
      </footer>
    </div>
  );
}
