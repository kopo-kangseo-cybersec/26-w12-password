import { useState } from 'react';
import Header from './components/Header';
import PasswordInspector from './components/PasswordInspector';
import PasswordGenerator from './components/PasswordGenerator';
import CryptoVault from './components/CryptoVault';
import './App.css';

function App() {
  // 상단 탭 상태 ('checker' | 'vault')
  const [activeTab, setActiveTab] = useState('checker');

  // 검사기에 전달될 비밀번호 상태 (휘발성 React State)
  const [inspectedPassword, setInspectedPassword] = useState('');

  // 생성기에서 생성된 비밀번호를 검사기에 즉시 적용하는 핸들러
  const handleApplyToInspector = (newPassword) => {
    setInspectedPassword(newPassword);
    // 점검 탭으로 자동 전환 (만약 다른 탭에 있더라도)
    setActiveTab('checker');
  };

  return (
    <div className="app-container">
      <Header activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="main-content">
        {activeTab === 'checker' ? (
          <div className="checker-grid">
            {/* 탭 1 좌측: 강도 및 유출 검사기 */}
            <PasswordInspector
              password={inspectedPassword}
              onPasswordChange={setInspectedPassword}
            />

            {/* 탭 1 우측: 안전 비밀번호 생성기 */}
            <PasswordGenerator
              onApplyToInspector={handleApplyToInspector}
            />
          </div>
        ) : (
          /* 탭 2: AES-GCM 암호화 금고 */
          <CryptoVault />
        )}
      </main>

      <footer className="app-footer">
        <div className="footer-content">
          <div className="footer-item">
            <span className="footer-dot"></span>
            <span>암호학적 난수: <code>crypto.getRandomValues()</code></span>
          </div>
          <div className="footer-item">
            <span className="footer-dot"></span>
            <span>k-익명성 통신: <code>prefix 5자리 + Add-Padding</code></span>
          </div>
          <div className="footer-item">
            <span className="footer-dot"></span>
            <span>무저장 원칙: 브라우저 메모리 전용 (Zero Storage)</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
