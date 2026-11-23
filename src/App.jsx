import React, { useState, useEffect } from 'react'
import PasswordStrength from './components/PasswordStrength'
import PasswordGenerator from './components/PasswordGenerator'
import BreachChecker from './components/BreachChecker'
import NetworkInspector from './components/NetworkInspector'
import { checkPwnedPassword } from './utils/crypto'
import './App.css'

export default function App() {
  const [password, setPassword] = useState('')
  const [activeTab, setActiveTab] = useState('audit') // 'audit' | 'generator' | 'breach' | 'inspector'
  const [breachResult, setBreachResult] = useState(null)
  const [notification, setNotification] = useState(null)
  const [theme, setTheme] = useState('dark') // 'dark' | 'light'

  // 테마 변경 시 HTML 속성 업데이트
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))
  }

  const showNotification = (msg) => {
    setNotification(msg)
    setTimeout(() => setNotification(null), 3000)
  }

  // 생성기에서 비밀번호를 받아 검사 탭으로 이동
  const handleApplyPassword = (pwd) => {
    setPassword(pwd)
    setActiveTab('audit')
    setBreachResult(null)
    showNotification('생성된 안전한 비밀번호가 진단기에 적용되었습니다.')
  }

  // 강도 검사기에서 빠른 유출 조회 실행
  const handleQuickBreachCheck = async (pwd) => {
    try {
      showNotification('Have I Been Pwned API로 k-익명성 유출 조회를 시작합니다...')
      const result = await checkPwnedPassword(pwd)
      setBreachResult(result)
      setActiveTab('breach')
    } catch (err) {
      alert(`유출 확인 오류: ${err.message}`)
    }
  }

  return (
    <div className="app-container">
      {/* 토스트 알림 */}
      {notification && (
        <div className="toast-notification">
          <span>{notification}</span>
        </div>
      )}

      {/* 헤더 */}
      <header className="app-header">
        <div className="header-brand">
          <div className="brand-logo">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              <circle cx="12" cy="11" r="3"/>
              <path d="M12 14v3"/>
            </svg>
          </div>
          <div>
            <h1 className="brand-title">CyberPass</h1>
            <p className="brand-tagline">차세대 비밀번호 보안 점검 & k-익명성 감사 도구</p>
          </div>
        </div>

        <div className="header-actions">
          <button
            type="button"
            className="theme-toggle-btn"
            onClick={toggleTheme}
            title={theme === 'dark' ? '라이트 모드로 전환' : '다크 모드로 전환'}
            aria-label="테마 전환"
          >
            {theme === 'dark' ? '☀️ 라이트 모드' : '🌙 다크 모드'}
          </button>

          <div className="header-status">
            <span className="status-badge">
              <span className="status-dot pulse-dot" />
              최소 전송 원칙 준수 (k-Anonymity)
            </span>
            <span className="status-badge subtle">
              CSPRNG 안전 난수
            </span>
          </div>
        </div>
      </header>

      {/* 탭 네비게이션 */}
      <nav className="tab-nav">
        <button
          type="button"
          className={`tab-btn ${activeTab === 'audit' ? 'active' : ''}`}
          onClick={() => setActiveTab('audit')}
        >
          📊 강도 & 엔트로피 진단
        </button>
        <button
          type="button"
          className={`tab-btn ${activeTab === 'generator' ? 'active' : ''}`}
          onClick={() => setActiveTab('generator')}
        >
          ⚡ CSPRNG 암호 생성기
        </button>
        <button
          type="button"
          className={`tab-btn ${activeTab === 'breach' ? 'active' : ''}`}
          onClick={() => setActiveTab('breach')}
        >
          🔍 유출 확인 (k-익명성)
        </button>
        <button
          type="button"
          className={`tab-btn ${activeTab === 'inspector' ? 'active' : ''}`}
          onClick={() => setActiveTab('inspector')}
        >
          🌐 네트워크 전송 감사
        </button>
        <button
          type="button"
          className={`tab-btn ${activeTab === 'all' ? 'active' : ''}`}
          onClick={() => setActiveTab('all')}
        >
          📑 대시보드 종합 뷰
        </button>
      </nav>

      {/* 메인 콘텐츠 영역 */}
      <main className="main-content">
        {activeTab === 'audit' && (
          <div className="tab-pane">
            <PasswordStrength
              password={password}
              setPassword={setPassword}
              onCheckBreach={handleQuickBreachCheck}
            />
          </div>
        )}

        {activeTab === 'generator' && (
          <div className="tab-pane">
            <PasswordGenerator onApplyPassword={handleApplyPassword} />
          </div>
        )}

        {activeTab === 'breach' && (
          <div className="tab-pane">
            <BreachChecker
              password={password}
              setPassword={setPassword}
              breachResult={breachResult}
              setBreachResult={setBreachResult}
            />
            {breachResult && (
              <div style={{ marginTop: '1.5rem' }}>
                <NetworkInspector breachResult={breachResult} password={password} />
              </div>
            )}
          </div>
        )}

        {activeTab === 'inspector' && (
          <div className="tab-pane">
            <NetworkInspector breachResult={breachResult} password={password} />
          </div>
        )}

        {activeTab === 'all' && (
          <div className="dashboard-grid">
            <div className="dashboard-col">
              <PasswordStrength
                password={password}
                setPassword={setPassword}
                onCheckBreach={handleQuickBreachCheck}
              />
              <PasswordGenerator onApplyPassword={handleApplyPassword} />
            </div>
            <div className="dashboard-col">
              <BreachChecker
                password={password}
                setPassword={setPassword}
                breachResult={breachResult}
                setBreachResult={setBreachResult}
              />
              <NetworkInspector breachResult={breachResult} password={password} />
            </div>
          </div>
        )}
      </main>

      {/* 푸터 */}
      <footer className="app-footer">
        <div className="footer-content">
          <p>
            <strong>CyberPass</strong> — 한국폴리텍대학 강서캠퍼스 사이버보안과 12주차 실습 결과물
          </p>
          <p className="footer-principles">
            🔒 <strong>보안 원칙:</strong> Web Crypto API 사용 | Math.random() 사용 안 함 | 비밀번호 평문 전송 0% | SHA-1 앞 5자리만 HIBP range API 전송
          </p>
        </div>
      </footer>
    </div>
  )
}
