export default function Header({ activeTab, setActiveTab }) {
  return (
    <header className="app-header">
      <div className="header-top">
        <div className="brand">
          <div className="brand-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>
          <div>
            <h1 className="brand-title">비밀번호 보안 점검 및 암호화 대시보드</h1>
            <p className="brand-subtitle">
              클라이언트 중심 Web Crypto & k-익명성 기반 프라이버시 보호 시스템
            </p>
          </div>
        </div>

        <div className="security-badges">
          <span className="badge badge-shield">
            <span className="badge-dot"></span> CSPRNG 전용
          </span>
          <span className="badge badge-network">
            <span className="badge-dot"></span> 최소 전송 (k-익명성)
          </span>
          <span className="badge badge-volatile">
            <span className="badge-dot"></span> 휘발성 메모리 (No-Storage)
          </span>
        </div>
      </div>

      <nav className="tab-navigation" aria-label="메인 탭 메뉴">
        <button
          type="button"
          className={`tab-button ${activeTab === 'checker' ? 'active' : ''}`}
          onClick={() => setActiveTab('checker')}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          </svg>
          <span>비밀번호 점검 및 생성</span>
        </button>

        <button
          type="button"
          className={`tab-button ${activeTab === 'vault' ? 'active' : ''}`}
          onClick={() => setActiveTab('vault')}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 9.9-1" />
          </svg>
          <span>AES-GCM 암호화 금고</span>
          <span className="tab-badge">확장</span>
        </button>
      </nav>
    </header>
  );
}
