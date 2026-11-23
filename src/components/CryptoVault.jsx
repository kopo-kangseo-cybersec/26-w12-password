import { useState } from 'react';
import { encryptSecretNote, decryptSecretNote } from '../utils/cryptoUtils';

export default function CryptoVault() {
  // 암호화 입력 상태
  const [encMasterPassword, setEncMasterPassword] = useState('');
  const [showEncPassword, setShowEncPassword] = useState(false);
  const [secretNote, setSecretNote] = useState('');
  const [isEncrypting, setIsEncrypting] = useState(false);
  const [encryptError, setEncryptError] = useState('');

  // 암호화 결과 상태
  const [encryptionResult, setEncryptionResult] = useState(null);
  const [copiedField, setCopiedField] = useState('');

  // 복호화 입력 상태
  const [decSalt, setDecSalt] = useState('');
  const [decIv, setDecIv] = useState('');
  const [decCiphertext, setDecCiphertext] = useState('');
  const [decMasterPassword, setDecMasterPassword] = useState('');
  const [showDecPassword, setShowDecPassword] = useState(false);
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [decryptedText, setDecryptedText] = useState('');
  const [decryptError, setDecryptError] = useState('');

  // 암호화 실행
  const handleEncrypt = async (e) => {
    e.preventDefault();
    setEncryptError('');
    if (!encMasterPassword) {
      setEncryptError('마스터 비밀번호를 입력해 주세요.');
      return;
    }
    if (!secretNote) {
      setEncryptError('암호화할 비밀 메모를 입력해 주세요.');
      return;
    }

    setIsEncrypting(true);
    try {
      const result = await encryptSecretNote(encMasterPassword, secretNote);
      setEncryptionResult(result);
    } catch (err) {
      setEncryptError(err.message || '암호화 처리 중 오류가 발생했습니다.');
    } finally {
      setIsEncrypting(false);
    }
  };

  // 복호화 실행
  const handleDecrypt = async (e) => {
    e.preventDefault();
    setDecryptError('');
    setDecryptedText('');

    if (!decMasterPassword) {
      setDecryptError('복호화에 사용할 마스터 비밀번호를 입력해 주세요.');
      return;
    }
    if (!decSalt || !decIv || !decCiphertext) {
      setDecryptError('Salt, IV, 암호문(Base64)을 모두 입력해 주세요.');
      return;
    }

    setIsDecrypting(true);
    try {
      const plain = await decryptSecretNote(decMasterPassword, decSalt, decIv, decCiphertext);
      setDecryptedText(plain);
    } catch (err) {
      setDecryptError(err.message);
    } finally {
      setIsDecrypting(false);
    }
  };

  // 클립보드 복사
  const handleCopyText = async (text, fieldName) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(fieldName);
      setTimeout(() => setCopiedField(''), 2000);
    } catch {
      // fallback
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopiedField(fieldName);
      setTimeout(() => setCopiedField(''), 2000);
    }
  };

  // 암호화 결과를 복호화 폼으로 자동 채우기
  const handleTransferToDecrypt = () => {
    if (!encryptionResult) return;
    setDecSalt(encryptionResult.saltBase64);
    setDecIv(encryptionResult.ivBase64);
    setDecCiphertext(encryptionResult.ciphertextBase64);
    setDecMasterPassword(encMasterPassword);
    setDecryptError('');
    setDecryptedText('');
  };

  return (
    <div className="vault-container">
      {/* 안내 배너 */}
      <div className="vault-intro-banner">
        <div className="banner-icon">🔐</div>
        <div className="banner-text">
          <h2 className="banner-title">Zero-Knowledge 클라이언트 사이드 암호화 금고</h2>
          <p className="banner-desc">
            비밀번호 원문을 어디에도 저장하지 않고, <code>PBKDF2</code>(100,000회 반복)와 CSPRNG Salt로 암호화 키를
            즉석 파생해 <code>AES-GCM-256</code>으로 암호화합니다. 마스터 키가 단 1글자만 틀려도 수학적으로 복구가
            불가능합니다.
          </p>
        </div>
      </div>

      <div className="vault-grid">
        {/* 암호화 섹션 */}
        <div className="card vault-card">
          <div className="card-header">
            <div className="card-title-group">
              <span className="card-badge badge-encrypt">ENCRYPT</span>
              <h3 className="card-title">데이터 암호화</h3>
            </div>
            <span className="card-hint">AES-GCM-256 + PBKDF2</span>
          </div>

          <form onSubmit={handleEncrypt} className="vault-form">
            <div className="input-group">
              <label className="input-label" htmlFor="enc-password">
                마스터 비밀번호
              </label>
              <div className="password-input-wrapper">
                <input
                  id="enc-password"
                  type={showEncPassword ? 'text' : 'password'}
                  className="text-input"
                  value={encMasterPassword}
                  onChange={(e) => setEncMasterPassword(e.target.value)}
                  placeholder="암호화 키를 파생할 비밀번호"
                  autoComplete="off"
                />
                <button
                  type="button"
                  className="icon-action-btn toggle-eye-btn"
                  onClick={() => setShowEncPassword(!showEncPassword)}
                  aria-label={showEncPassword ? '비밀번호 숨기기' : '비밀번호 보기'}
                >
                  {showEncPassword ? '👁️' : '🔒'}
                </button>
              </div>
            </div>

            <div className="input-group">
              <label className="input-label" htmlFor="enc-note">
                비밀 메모 (보호할 평문)
              </label>
              <textarea
                id="enc-note"
                className="text-input textarea-input"
                rows={4}
                value={secretNote}
                onChange={(e) => setSecretNote(e.target.value)}
                placeholder="외부에 노출되면 안 되는 보안 메모, 개인 키, 계정 정보를 입력하세요"
              />
            </div>

            {encryptError && (
              <div className="alert-banner alert-error" role="alert">
                <span>⚠️ {encryptError}</span>
              </div>
            )}

            <button
              type="submit"
              className="action-btn btn-primary btn-block"
              disabled={isEncrypting || !encMasterPassword || !secretNote}
            >
              {isEncrypting ? (
                <>
                  <span className="spinner" aria-hidden="true"></span>
                  <span>PBKDF2 10만 회 연산 및 암호화 중...</span>
                </>
              ) : (
                <>
                  <span>🔒 AES-GCM 암호화 실행</span>
                </>
              )}
            </button>
          </form>

          {/* 암호화 결과 표시 */}
          {encryptionResult && (
            <div className="result-container">
              <div className="result-header">
                <span className="result-title">암호화 결과 (Base64)</span>
                <button
                  type="button"
                  className="action-btn btn-accent btn-sm"
                  onClick={handleTransferToDecrypt}
                  title="아래 복호화 영역으로 값 전달"
                >
                  👇 복호화 폼에 자동 입력
                </button>
              </div>

              <div className="result-field">
                <div className="field-top">
                  <span className="field-name">Salt (16 바이트 무작위 솔트)</span>
                  <button
                    type="button"
                    className="copy-btn-link"
                    onClick={() => handleCopyText(encryptionResult.saltBase64, 'salt')}
                  >
                    {copiedField === 'salt' ? '✓ 복사됨' : '복사'}
                  </button>
                </div>
                <code className="code-display">{encryptionResult.saltBase64}</code>
              </div>

              <div className="result-field">
                <div className="field-top">
                  <span className="field-name">IV (12 바이트 무작위 초기화 벡터)</span>
                  <button
                    type="button"
                    className="copy-btn-link"
                    onClick={() => handleCopyText(encryptionResult.ivBase64, 'iv')}
                  >
                    {copiedField === 'iv' ? '✓ 복사됨' : '복사'}
                  </button>
                </div>
                <code className="code-display">{encryptionResult.ivBase64}</code>
              </div>

              <div className="result-field">
                <div className="field-top">
                  <span className="field-name">Ciphertext (암호문 + 인증 태그)</span>
                  <button
                    type="button"
                    className="copy-btn-link"
                    onClick={() => handleCopyText(encryptionResult.ciphertextBase64, 'cipher')}
                  >
                    {copiedField === 'cipher' ? '✓ 복사됨' : '복사'}
                  </button>
                </div>
                <code className="code-display break-all">{encryptionResult.ciphertextBase64}</code>
              </div>
            </div>
          )}
        </div>

        {/* 복호화 섹션 */}
        <div className="card vault-card">
          <div className="card-header">
            <div className="card-title-group">
              <span className="card-badge badge-decrypt">DECRYPT</span>
              <h3 className="card-title">데이터 복호화</h3>
            </div>
            <span className="card-hint">무결성 검증 (GCM Auth Tag)</span>
          </div>

          <form onSubmit={handleDecrypt} className="vault-form">
            <div className="input-group">
              <label className="input-label" htmlFor="dec-salt">
                Salt (Base64)
              </label>
              <input
                id="dec-salt"
                type="text"
                className="text-input"
                value={decSalt}
                onChange={(e) => setDecSalt(e.target.value)}
                placeholder="16바이트 Salt Base64"
                autoComplete="off"
              />
            </div>

            <div className="input-group">
              <label className="input-label" htmlFor="dec-iv">
                IV (Base64)
              </label>
              <input
                id="dec-iv"
                type="text"
                className="text-input"
                value={decIv}
                onChange={(e) => setDecIv(e.target.value)}
                placeholder="12바이트 IV Base64"
                autoComplete="off"
              />
            </div>

            <div className="input-group">
              <label className="input-label" htmlFor="dec-ciphertext">
                Ciphertext (Base64 암호문)
              </label>
              <textarea
                id="dec-ciphertext"
                className="text-input textarea-input"
                rows={3}
                value={decCiphertext}
                onChange={(e) => setDecCiphertext(e.target.value)}
                placeholder="암호화된 Base64 문자열"
              />
            </div>

            <div className="input-group">
              <label className="input-label" htmlFor="dec-password">
                마스터 비밀번호
              </label>
              <div className="password-input-wrapper">
                <input
                  id="dec-password"
                  type={showDecPassword ? 'text' : 'password'}
                  className="text-input"
                  value={decMasterPassword}
                  onChange={(e) => setDecMasterPassword(e.target.value)}
                  placeholder="암호화할 때 사용했던 마스터 비밀번호"
                  autoComplete="off"
                />
                <button
                  type="button"
                  className="icon-action-btn toggle-eye-btn"
                  onClick={() => setShowDecPassword(!showDecPassword)}
                  aria-label={showDecPassword ? '비밀번호 숨기기' : '비밀번호 보기'}
                >
                  {showDecPassword ? '👁️' : '🔒'}
                </button>
              </div>
            </div>

            {decryptError && (
              <div className="alert-banner alert-danger" role="alert">
                <div className="alert-title">🚨 복호화 실패 (OperationError)</div>
                <div className="alert-body">{decryptError}</div>
              </div>
            )}

            <button
              type="submit"
              className="action-btn btn-secondary btn-block"
              disabled={isDecrypting || !decMasterPassword || !decSalt || !decIv || !decCiphertext}
            >
              {isDecrypting ? (
                <>
                  <span className="spinner" aria-hidden="true"></span>
                  <span>복호화 검증 중...</span>
                </>
              ) : (
                <>
                  <span>🔓 원문 복호화 실행</span>
                </>
              )}
            </button>
          </form>

          {/* 복호화 성공 결과 */}
          {decryptedText && (
            <div className="decrypted-result-box">
              <div className="decrypted-header">
                <span className="badge badge-safe">✓ 인증 태그 일치 & 복원 성공</span>
                <button
                  type="button"
                  className="copy-btn-link"
                  onClick={() => handleCopyText(decryptedText, 'plain')}
                >
                  {copiedField === 'plain' ? '✓ 복사됨' : '복사'}
                </button>
              </div>
              <div className="decrypted-content">
                <pre>{decryptedText}</pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
