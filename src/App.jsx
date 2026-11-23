import { useState } from 'react'
import Header from './components/Header'
import PasswordChecker from './components/PasswordChecker'
import PasswordGenerator from './components/PasswordGenerator'
import CryptoVault from './components/CryptoVault'
import NetworkInspector from './components/NetworkInspector'
import './App.css'

export default function App() {
  const [activeTab, setActiveTab] = useState('checker')
  const [sharedPassword, setSharedPassword] = useState('')

  const handleUsePasswordInChecker = (pwd) => {
    setSharedPassword(pwd)
    setActiveTab('checker')
  }

  const handleSendToVault = (pwd) => {
    setSharedPassword(pwd)
    setActiveTab('vault')
  }

  return (
    <div className="app-layout">
      <Header />

      {/* 탭 네비게이션 */}
      <nav className="tab-navigation">
        <button
          type="button"
          className={`tab-btn ${activeTab === 'checker' ? 'active' : ''}`}
          onClick={() => setActiveTab('checker')}
        >
          🔍 비밀번호 점검 & 유출 확인
        </button>
        <button
          type="button"
          className={`tab-btn ${activeTab === 'generator' ? 'active' : ''}`}
          onClick={() => setActiveTab('generator')}
        >
          🎲 안전한 생성기 (CSPRNG)
        </button>
        <button
          type="button"
          className={`tab-btn ${activeTab === 'vault' ? 'active' : ''}`}
          onClick={() => setActiveTab('vault')}
        >
          🔐 영지식 금고 (AES-GCM)
        </button>
        <button
          type="button"
          className={`tab-btn ${activeTab === 'network' ? 'active' : ''}`}
          onClick={() => setActiveTab('network')}
        >
          📡 Network 검증 가이드
        </button>
      </nav>

      {/* 탭 본문 영역 */}
      <main className="tab-content">
        {activeTab === 'checker' && (
          <PasswordChecker
            initialPassword={sharedPassword}
            onSendToVault={handleSendToVault}
          />
        )}
        {activeTab === 'generator' && (
          <PasswordGenerator onUsePassword={handleUsePasswordInChecker} />
        )}
        {activeTab === 'vault' && (
          <CryptoVault defaultPassword={sharedPassword} />
        )}
        {activeTab === 'network' && <NetworkInspector />}
      </main>

      {/* 푸터 */}
      <footer className="app-footer">
        <p>
          한국폴리텍대학 강서캠퍼스 사이버보안과 <strong>12주차 비밀번호 보안 도구</strong> 실습 프로젝트
        </p>
        <p className="footer-sub">
          규칙 준수: React + JavaScript · Web Crypto API (`crypto.getRandomValues`, `crypto.subtle`) · k-익명성 최소 전송 원칙
        </p>
      </footer>
    </div>
  )
}
