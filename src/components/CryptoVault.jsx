import { useState, useId } from 'react'
import { encryptWithPassword, decryptWithPassword } from '../utils/crypto'

export default function CryptoVault({ defaultPassword = '' }) {
  const [masterPassword, setMasterPassword] = useState(defaultPassword)
  const [plainText, setPlainText] = useState('사이버보안과 12주차 기밀 메모: 암호화 성공!')
  const [encryptedPackage, setEncryptedPackage] = useState('')
  const [decryptPassword, setDecryptPassword] = useState('')
  const [decryptedText, setDecryptedText] = useState('')
  const [statusMsg, setStatusMsg] = useState(null)
  const [isEncrypting, setIsEncrypting] = useState(false)
  const [isDecrypting, setIsDecrypting] = useState(false)

  const masterPassId = useId()
  const plainTextId = useId()
  const decryptPassId = useId()

  const handleEncrypt = async () => {
    if (!masterPassword || !plainText) {
      setStatusMsg({ type: 'error', text: '마스터 비밀번호와 원문 메모를 모두 입력하세요.' })
      return
    }
    setIsEncrypting(true)
    setStatusMsg(null)
    try {
      const payload = await encryptWithPassword(masterPassword, plainText)
      setEncryptedPackage(payload)
      setDecryptPassword('')
      setDecryptedText('')
      setStatusMsg({ type: 'success', text: 'AES-256-GCM 및 PBKDF2(100,000회) 암호화 완료!' })
    } catch (err) {
      setStatusMsg({ type: 'error', text: `암호화 실패: ${err.message}` })
    } finally {
      setIsEncrypting(false)
    }
  }

  const handleDecrypt = async () => {
    if (!decryptPassword || !encryptedPackage) {
      setStatusMsg({ type: 'error', text: '복호화할 비밀번호를 입력하세요.' })
      return
    }
    setIsDecrypting(true)
    setStatusMsg(null)
    try {
      const result = await decryptWithPassword(decryptPassword, encryptedPackage)
      setDecryptedText(result)
      setStatusMsg({ type: 'success', text: '비밀번호 일치! 안전하게 복호화되었습니다.' })
    } catch {
      setStatusMsg({
        type: 'error',
        text: '복호화 실패: 비밀번호가 일치하지 않거나 암호문이 위·변조되었습니다. (인증 태그 불일치)',
      })
      setDecryptedText('')
    } finally {
      setIsDecrypting(false)
    }
  }

  return (
    <div className="card">
      <div className="card-header">
        <div>
          <span className="badge badge-accent">확장 기능 (Bonus)</span>
          <h2 className="card-title">🔐 영지식(Zero-Knowledge) AES-GCM 암호화 금고</h2>
          <p className="card-desc">
            비밀번호를 기반으로 <strong>PBKDF2(SHA-256, 100,000회)</strong>를 거쳐 256비트 암호화 키를 파생하고,{' '}
            <strong>AES-GCM</strong>으로 인증 암호화(AEAD)를 수행합니다. 올바른 비밀번호가 없으면 수학적으로 복구가 불가능합니다.
          </p>
        </div>
      </div>

      <div className="vault-grid">
        {/* 암호화 패널 */}
        <div className="vault-panel">
          <h3 className="vault-subtitle">1. 비밀 메모 암호화</h3>
          <div className="form-group">
            <label htmlFor={masterPassId} className="form-label">
              마스터 비밀번호
            </label>
            <input
              id={masterPassId}
              type="password"
              className="input-field"
              value={masterPassword}
              onChange={(e) => setMasterPassword(e.target.value)}
              placeholder="암호화에 사용할 비밀번호"
            />
          </div>

          <div className="form-group">
            <label htmlFor={plainTextId} className="form-label">
              보호할 원문 메모
            </label>
            <textarea
              id={plainTextId}
              rows={3}
              className="input-field textarea-field"
              value={plainText}
              onChange={(e) => setPlainText(e.target.value)}
              placeholder="보호할 비밀 정보를 입력하세요"
            />
          </div>

          <button
            type="button"
            className="btn btn-primary"
            onClick={handleEncrypt}
            disabled={isEncrypting || !masterPassword || !plainText}
          >
            {isEncrypting ? '암호화 연산 중...' : '🔒 AES-256-GCM 암호화'}
          </button>
        </div>

        {/* 복호화 패널 */}
        <div className="vault-panel">
          <h3 className="vault-subtitle">2. 안전한 복호화 시험</h3>
          <div className="form-group">
            <label htmlFor={decryptPassId} className="form-label">
              복호화 시도 비밀번호
            </label>
            <input
              id={decryptPassId}
              type="password"
              className="input-field"
              value={decryptPassword}
              onChange={(e) => setDecryptPassword(e.target.value)}
              placeholder="암호화 시 사용한 비밀번호를 입력"
              disabled={!encryptedPackage}
            />
          </div>

          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleDecrypt}
            disabled={isDecrypting || !encryptedPackage || !decryptPassword}
          >
            {isDecrypting ? '복호화 시도 중...' : '🔓 복호화 시도'}
          </button>

          {decryptedText && (
            <div className="decrypted-box">
              <span className="decrypted-label">복호화된 원문 내용:</span>
              <div className="decrypted-content">{decryptedText}</div>
            </div>
          )}
        </div>
      </div>

      {/* 상태 메시지 */}
      {statusMsg && (
        <div className={`alert ${statusMsg.type === 'success' ? 'alert-success' : 'alert-danger'}`}>
          {statusMsg.text}
        </div>
      )}

      {/* 생성된 암호문 표시 */}
      {encryptedPackage && (
        <div className="encrypted-package-box">
          <div className="box-title">📦 생성된 암호문 패키지 (Base64: Salt 16B + IV 12B + Ciphertext)</div>
          <pre className="code-block">{encryptedPackage}</pre>
          <div className="security-notice">
            💡 <strong>영지식 보안 원리:</strong> 서버나 제3자가 이 데이터를 가로채더라도, 마스터 비밀번호가 없다면 슈퍼컴퓨터로도 원문을 열람할 수 없습니다.
          </div>
        </div>
      )}
    </div>
  )
}
