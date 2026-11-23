import { useState } from 'react';
import { encryptNote, decryptNote } from '../utils/crypto';

export default function EncryptionVault() {
  const [activeSubTab, setActiveSubTab] = useState('encrypt');

  // 암호화 상태
  const [plainText, setPlainText] = useState('');
  const [encryptPassword, setEncryptPassword] = useState('');
  const [showEncryptPass, setShowEncryptPass] = useState(false);
  const [cipherResult, setCipherResult] = useState('');
  const [isEncrypting, setIsEncrypting] = useState(false);
  const [encryptError, setEncryptError] = useState('');
  const [copiedCipher, setCopiedCipher] = useState(false);

  // 복호화 상태
  const [cipherInput, setCipherInput] = useState('');
  const [decryptPassword, setDecryptPassword] = useState('');
  const [showDecryptPass, setShowDecryptPass] = useState(false);
  const [decryptedResult, setDecryptedResult] = useState('');
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [decryptError, setDecryptError] = useState('');

  // 암호화 실행
  const handleEncrypt = async (e) => {
    e.preventDefault();
    if (!plainText.trim()) {
      setEncryptError('암호화할 메모 내용을 입력하세요.');
      return;
    }
    if (!encryptPassword) {
      setEncryptError('마스터 비밀번호를 입력하세요.');
      return;
    }

    setIsEncrypting(true);
    setEncryptError('');
    setCipherResult('');
    try {
      const encryptedBase64 = await encryptNote(plainText, encryptPassword);
      setCipherResult(encryptedBase64);
    } catch (err) {
      setEncryptError(err.message || '암호화 중 오류가 발생했습니다.');
    } finally {
      setIsEncrypting(false);
    }
  };

  // 복호화 실행
  const handleDecrypt = async (e) => {
    e.preventDefault();
    if (!cipherInput.trim()) {
      setDecryptError('암호화된 Base64 데이터를 입력하세요.');
      return;
    }
    if (!decryptPassword) {
      setDecryptError('마스터 비밀번호를 입력하세요.');
      return;
    }

    setIsDecrypting(true);
    setDecryptError('');
    setDecryptedResult('');
    try {
      const text = await decryptNote(cipherInput, decryptPassword);
      setDecryptedResult(text);
    } catch (err) {
      setDecryptError(err.message || '복호화 실패: 비밀번호를 확인하세요.');
    } finally {
      setIsDecrypting(false);
    }
  };

  // 클립보드 복사
  const handleCopyCipher = async () => {
    if (!cipherResult) return;
    try {
      await navigator.clipboard.writeText(cipherResult);
      setCopiedCipher(true);
      setTimeout(() => setCopiedCipher(false), 2000);
    } catch {
      setCopiedCipher(true);
      setTimeout(() => setCopiedCipher(false), 2000);
    }
  };

  // 암호화 결과를 복호화 입력창으로 바로 보내기 (편의 기능)
  const handleTransferToDecrypt = () => {
    setCipherInput(cipherResult);
    setDecryptPassword(encryptPassword);
    setActiveSubTab('decrypt');
    setDecryptError('');
    setDecryptedResult('');
  };

  return (
    <div className="card vault-card">
      <div className="card-header">
        <div className="card-title-group">
          <span className="card-icon">🔐</span>
          <div>
            <h2 className="card-title">AES-GCM 암호화 메모 금고</h2>
            <p className="card-subtitle">
              PBKDF2(10만 회) + AES-GCM(256-bit) 기반 Zero-Knowledge 클라이언트 암호화
            </p>
          </div>
        </div>
      </div>

      {/* 보안 원리 안내 배너 */}
      <div className="vault-info-banner">
        <span className="info-icon">💡</span>
        <p className="info-text">
          비밀번호를 분실하면 <strong>세상 그 누구도(서버, 개발자 포함) 데이터를 복구할 수 없습니다.</strong>{' '}
          암호화 시 매번 새로운 16바이트 Salt와 12바이트 IV가 생성되어, 같은 평문이라도 완전히 다른 암호문이 생성됩니다.
        </p>
      </div>

      {/* 서브 탭 스위처 */}
      <div className="vault-subtabs">
        <button
          type="button"
          className={`subtab-button ${activeSubTab === 'encrypt' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('encrypt')}
        >
          📝 메모 암호화하기
        </button>
        <button
          type="button"
          className={`subtab-button ${activeSubTab === 'decrypt' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('decrypt')}
        >
          🔓 메모 복호화하기
        </button>
      </div>

      {/* [1] 암호화 모드 */}
      {activeSubTab === 'encrypt' && (
        <form onSubmit={handleEncrypt} className="vault-form">
          <div className="input-group">
            <label className="field-label" htmlFor="vault-plain">
              비밀 메모 입력 (평문)
            </label>
            <textarea
              id="vault-plain"
              className="text-input textarea-input"
              rows="4"
              placeholder="보호하고 싶은 비밀 메모, 계정 정보 등을 입력하세요..."
              value={plainText}
              onChange={(e) => setPlainText(e.target.value)}
            />
          </div>

          <div className="input-group">
            <label className="field-label" htmlFor="vault-pass">
              마스터 암호화 비밀번호
            </label>
            <div className="password-input-wrapper">
              <input
                id="vault-pass"
                type={showEncryptPass ? 'text' : 'password'}
                className="text-input"
                placeholder="복호화에 사용할 강력한 비밀번호"
                value={encryptPassword}
                onChange={(e) => setEncryptPassword(e.target.value)}
                autoComplete="off"
              />
              <button
                type="button"
                className="icon-button toggle-btn"
                onClick={() => setShowEncryptPass(!showEncryptPass)}
                aria-label={showEncryptPass ? '비밀번호 숨기기' : '비밀번호 보기'}
              >
                {showEncryptPass ? '🙈' : '👁️'}
              </button>
            </div>
            <span className="field-hint">
              이 비밀번호로부터 PBKDF2(SHA-256, 100,000회 반복)로 AES-256 키를 파생합니다.
            </span>
          </div>

          {encryptError && (
            <div className="alert-box danger-box">
              <span className="alert-icon">⚠️</span>
              <p className="alert-text">{encryptError}</p>
            </div>
          )}

          <button
            type="submit"
            className="action-button primary-btn full-btn"
            disabled={isEncrypting || !plainText || !encryptPassword}
          >
            {isEncrypting ? '암호화 연산 중...' : '🔒 안전하게 메모 암호화'}
          </button>

          {cipherResult && (
            <div className="result-container">
              <div className="result-label-group">
                <span className="result-heading">암호화 결과 (Base64)</span>
                <span className="result-structure-badge">
                  Salt(16B) + IV(12B) + AES-GCM Ciphertext
                </span>
              </div>
              <div className="cipher-output-box">
                <code className="cipher-code">{cipherResult}</code>
              </div>
              <div className="cipher-actions">
                <button
                  type="button"
                  className={`action-button ${copiedCipher ? 'success-btn' : 'secondary-btn'}`}
                  onClick={handleCopyCipher}
                >
                  {copiedCipher ? '✓ 복사됨!' : '📋 암호문 복사'}
                </button>
                <button
                  type="button"
                  className="action-button primary-btn"
                  onClick={handleTransferToDecrypt}
                >
                  ➡️ 바로 복호화 탭에서 테스트하기
                </button>
              </div>
            </div>
          )}
        </form>
      )}

      {/* [2] 복호화 모드 */}
      {activeSubTab === 'decrypt' && (
        <form onSubmit={handleDecrypt} className="vault-form">
          <div className="input-group">
            <label className="field-label" htmlFor="vault-cipher-input">
              암호화된 Base64 데이터 입력
            </label>
            <textarea
              id="vault-cipher-input"
              className="text-input textarea-input"
              rows="4"
              placeholder="암호화 탭에서 생성된 Base64 문자열을 붙여넣으세요..."
              value={cipherInput}
              onChange={(e) => setCipherInput(e.target.value)}
            />
          </div>

          <div className="input-group">
            <label className="field-label" htmlFor="vault-decrypt-pass">
              마스터 비밀번호 입력
            </label>
            <div className="password-input-wrapper">
              <input
                id="vault-decrypt-pass"
                type={showDecryptPass ? 'text' : 'password'}
                className="text-input"
                placeholder="암호화할 때 사용했던 마스터 비밀번호"
                value={decryptPassword}
                onChange={(e) => setDecryptPassword(e.target.value)}
                autoComplete="off"
              />
              <button
                type="button"
                className="icon-button toggle-btn"
                onClick={() => setShowDecryptPass(!showDecryptPass)}
                aria-label={showDecryptPass ? '비밀번호 숨기기' : '비밀번호 보기'}
              >
                {showDecryptPass ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          {decryptError && (
            <div className="alert-box danger-box">
              <span className="alert-icon">🚫</span>
              <p className="alert-text">{decryptError}</p>
            </div>
          )}

          <button
            type="submit"
            className="action-button glow-btn full-btn"
            disabled={isDecrypting || !cipherInput || !decryptPassword}
          >
            {isDecrypting ? '복호화 및 인증 검증 중...' : '🔓 복호화 실행'}
          </button>

          {decryptedResult && (
            <div className="result-container success-result">
              <div className="result-label-group">
                <span className="result-heading">✅ 복호화 성공 (원문 복원)</span>
                <span className="result-structure-badge verified-badge">
                  AES-GCM 태그 인증 통과
                </span>
              </div>
              <div className="decrypted-box">
                <p className="decrypted-text">{decryptedResult}</p>
              </div>
            </div>
          )}
        </form>
      )}
    </div>
  );
}
