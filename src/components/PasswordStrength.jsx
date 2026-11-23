import React, { useState } from 'react'
import { evaluatePasswordStrength } from '../utils/strength'

export default function PasswordStrength({ password, setPassword, onCheckBreach }) {
  const [showPassword, setShowPassword] = useState(false)
  const strength = evaluatePasswordStrength(password)

  const progressPercent = password ? Math.min(100, Math.max(15, (strength.score + 1) * 20)) : 0

  return (
    <div className="card">
      <div className="card-header">
        <div className="card-title-group">
          <span className="badge badge-accent">실시간 진단</span>
          <h2>비밀번호 강도 및 엔트로피 분석</h2>
        </div>
        <p className="card-subtitle">
          입력하신 비밀번호는 브라우저 외부로 전송되지 않고 메모리 상에서만 즉시 평가됩니다.
        </p>
      </div>

      <div className="input-group-wrapper">
        <label htmlFor="pwd-input" className="input-label">
          점검할 비밀번호
        </label>
        <div className="password-input-container">
          <input
            id="pwd-input"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="비밀번호를 입력하세요..."
            className="password-input"
            autoComplete="off"
            spellCheck="false"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="btn-toggle-show"
            title={showPassword ? '비밀번호 숨기기' : '비밀번호 보기'}
            aria-label={showPassword ? '비밀번호 숨기기' : '비밀번호 보기'}
          >
            {showPassword ? '🙈 숨김' : '👁️ 표시'}
          </button>
        </div>
      </div>

      {password ? (
        <div className="strength-metrics">
          {/* 강도 바 */}
          <div className="metric-row">
            <div className="metric-label-group">
              <span className="metric-title">보안 등급</span>
              <span className="metric-value" style={{ color: strength.color, fontWeight: 'bold' }}>
                {strength.label}
              </span>
            </div>
            <div className="progress-track">
              <div
                className="progress-fill"
                style={{
                  width: `${progressPercent}%`,
                  backgroundColor: strength.color,
                }}
              />
            </div>
          </div>

          {/* 엔트로피 & 예상 크랙 시간 */}
          <div className="metrics-grid">
            <div className="metric-box">
              <span className="metric-box-title">정보 엔트로피</span>
              <span className="metric-box-val" style={{ color: strength.color }}>
                {strength.entropy} <small>bits</small>
              </span>
              <span className="metric-box-desc">
                {strength.entropy >= 60 ? '우수한 복잡도' : '추측에 취약함'}
              </span>
            </div>
            <div className="metric-box">
              <span className="metric-box-title">초당 100억 회 대입 시</span>
              <span className="metric-box-val">{strength.crackTime}</span>
              <span className="metric-box-desc">브루트포스(무차별 대입) 예상 시간</span>
            </div>
          </div>

          {/* 조건 체크리스트 */}
          <div className="checklist-container">
            <span className="checklist-title">복잡도 구성 요소</span>
            <div className="checklist-items">
              <span className={`pill ${strength.checks.length ? 'pill-success' : 'pill-default'}`}>
                {strength.checks.length ? '✓ 8자 이상' : '✕ 8자 미만'}
              </span>
              <span className={`pill ${strength.checks.hasLower ? 'pill-success' : 'pill-default'}`}>
                {strength.checks.hasLower ? '✓ 소문자 (a-z)' : '✕ 소문자 누락'}
              </span>
              <span className={`pill ${strength.checks.hasUpper ? 'pill-success' : 'pill-default'}`}>
                {strength.checks.hasUpper ? '✓ 대문자 (A-Z)' : '✕ 대문자 누락'}
              </span>
              <span className={`pill ${strength.checks.hasNumber ? 'pill-success' : 'pill-default'}`}>
                {strength.checks.hasNumber ? '✓ 숫자 (0-9)' : '✕ 숫자 누락'}
              </span>
              <span className={`pill ${strength.checks.hasSymbol ? 'pill-success' : 'pill-default'}`}>
                {strength.checks.hasSymbol ? '✓ 특수문자 (!@#)' : '✕ 특수문자 누락'}
              </span>
            </div>
          </div>

          {/* 취약 패턴 경고 */}
          {strength.warnings.length > 0 && (
            <div className="alert-warning">
              <strong>⚠️ 주의가 필요한 패턴 감지:</strong>
              <ul>
                {strength.warnings.map((warn, i) => (
                  <li key={i}>{warn}</li>
                ))}
              </ul>
            </div>
          )}

          {/* 개선 팁 */}
          {strength.suggestions.length > 0 && (
            <div className="suggestions-box">
              <span className="suggestions-title">💡 안전성 강화 팁:</span>
              <ul>
                {strength.suggestions.map((sug, i) => (
                  <li key={i}>{sug}</li>
                ))}
              </ul>
            </div>
          )}

          {/* 빠른 유출 검사 액션 */}
          <div className="action-row">
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => onCheckBreach(password)}
            >
              🔍 이 비밀번호 유출 여부 검사하기 (k-익명성)
            </button>
          </div>
        </div>
      ) : (
        <div className="empty-guide">
          <p>비밀번호를 입력하시면 실시간 보안 강도, 엔트로피(bits), 해킹 예상 소요 시간을 분석해 드립니다.</p>
        </div>
      )}
    </div>
  )
}
