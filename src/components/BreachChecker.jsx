import React, { useState } from 'react'
import { checkPwnedPassword } from '../utils/crypto'

export default function BreachChecker({ password, setPassword, breachResult, setBreachResult }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleCheck = async (e) => {
    if (e) e.preventDefault()
    if (!password) {
      setError('검사할 비밀번호를 먼저 입력해 주세요.')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const result = await checkPwnedPassword(password)
      setBreachResult(result)
    } catch (err) {
      setError(err.message || '유출 확인 중 네트워크 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card">
      <div className="card-header">
        <div className="card-title-group">
          <span className="badge badge-warning">Have I Been Pwned API</span>
          <h2>비밀번호 유출 확인 (k-익명성)</h2>
        </div>
        <p className="card-subtitle">
          비밀번호를 서버로 직접 보내지 않고, <strong>SHA-1 해시의 앞 5글자만</strong> 전송해 유출 여부를 조회합니다.
        </p>
      </div>

      <form onSubmit={handleCheck} className="breach-form">
        <div className="input-group-wrapper">
          <label htmlFor="breach-input" className="input-label">
            유출 점검 대상 비밀번호
          </label>
          <div className="breach-input-row">
            <input
              id="breach-input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="확인할 비밀번호 (예: password, 123456 등)"
              className="password-input"
              autoComplete="off"
            />
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading || !password}
            >
              {loading ? '조회 중...' : '🔍 유출 조회'}
            </button>
          </div>
        </div>
      </form>

      {error && (
        <div className="alert-error">
          <span>❌ {error}</span>
        </div>
      )}

      {/* 조회 결과 카드 */}
      {breachResult && !loading && (
        <div className={`breach-result-card ${breachResult.breached ? 'result-danger' : 'result-safe'}`}>
          <div className="result-icon">
            {breachResult.breached ? '🚨' : '🛡️'}
          </div>
          <div className="result-details">
            <h3 className="result-title">
              {breachResult.breached
                ? `위험! 과거 침해 사고로 ${breachResult.count.toLocaleString()}회 유출된 비밀번호입니다.`
                : '안전합니다! 알려진 데이터 유출 사고에서 발견되지 않았습니다.'}
            </h3>
            <p className="result-desc">
              {breachResult.breached
                ? '이 비밀번호는 이미 해커들의 사전 공격(Dictionary Attack) 및 자격 증명 스터핑(Credential Stuffing) DB에 등록되어 있습니다. 다른 서비스에서 사용 중이라면 즉시 변경하세요.'
                : 'Have I Been Pwned의 수억 개 유출 비밀번호 데이터베이스와 대조한 결과, 동일한 해시가 발견되지 않았습니다.'}
            </p>

            <div className="result-meta">
              <span>전송된 해시 접두사: <code>{breachResult.prefix}</code> (앞 5자리만 전송)</span>
              <span>서버가 반환한 후보군: <strong>{breachResult.totalRangeHashes.toLocaleString()}개</strong>의 접미사 해시</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
