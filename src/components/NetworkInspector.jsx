import React, { useState } from 'react'

export default function NetworkInspector({ breachResult, password }) {
  const [copiedUrl, setCopiedUrl] = useState(false)

  const handleCopyUrl = async (url) => {
    try {
      await navigator.clipboard.writeText(url)
      setCopiedUrl(true)
      setTimeout(() => setCopiedUrl(false), 2000)
    } catch {
      setCopiedUrl(true)
      setTimeout(() => setCopiedUrl(false), 2000)
    }
  }

  return (
    <div className="card inspector-card">
      <div className="card-header">
        <div className="card-title-group">
          <span className="badge badge-info">보안 원리 시각화</span>
          <h2>최소 전송 원칙 & k-익명성(k-Anonymity) 검증</h2>
        </div>
        <p className="card-subtitle">
          브라우저 개발자 도구(<code>F12</code>) → <strong>Network</strong> 탭에서 실제로 무엇이 오가는지 확인하고, 비밀번호가 보호되는 원리를 관찰하세요.
        </p>
      </div>

      {breachResult ? (
        <div className="inspector-content">
          <div className="step-list">
            {/* 1단계 */}
            <div className="step-item">
              <div className="step-num">1</div>
              <div className="step-body">
                <div className="step-header">
                  <strong>브라우저 내부 비밀번호 (Web Crypto API)</strong>
                  <span className="step-tag local-only">브라우저 내부에만 존재 (외부 전송 0%)</span>
                </div>
                <div className="code-display">
                  {password ? '•'.repeat(Math.min(password.length, 24)) : '(입력 없음)'}
                  <span className="code-note">※ 평문 비밀번호는 어떤 서버로도 절대 전송되지 않습니다.</span>
                </div>
              </div>
            </div>

            {/* 2단계 */}
            <div className="step-item">
              <div className="step-num">2</div>
              <div className="step-body">
                <div className="step-header">
                  <strong>SHA-1 전체 해시 계산 (40자리 16진수)</strong>
                  <span className="step-tag local-only">브라우저 메모리</span>
                </div>
                <div className="hash-breakdown">
                  <span className="hash-prefix" title="외부로 전송되는 5글자">
                    {breachResult.prefix}
                  </span>
                  <span className="hash-divider">|</span>
                  <span className="hash-suffix" title="외부로 전송되지 않는 35글자">
                    {breachResult.suffix}
                  </span>
                </div>
                <div className="hash-legend">
                  <span className="legend-item"><span className="dot dot-sent" /> 앞 5글자 (서버 전송용 접두사)</span>
                  <span className="legend-item"><span className="dot dot-kept" /> 뒤 35글자 (브라우저에 보관, 절대 전송 안 함)</span>
                </div>
              </div>
            </div>

            {/* 3단계 */}
            <div className="step-item highlight-step">
              <div className="step-num">3</div>
              <div className="step-body">
                <div className="step-header">
                  <strong>실제 네트워크 전송 요청 (F12 Network 탭 확인용)</strong>
                  <span className="step-tag sent-tag">최소 전송 원칙</span>
                </div>
                <div className="url-container">
                  <div className="url-box">
                    <span className="http-method">GET</span>
                    <span className="http-url">{breachResult.requestUrl}</span>
                  </div>
                  <button
                    type="button"
                    className="btn btn-copy-small"
                    onClick={() => handleCopyUrl(breachResult.requestUrl)}
                  >
                    {copiedUrl ? '✓ 복사됨' : '📋 주소 복사'}
                  </button>
                </div>
                <p className="url-explanation">
                  💡 <strong>README.md 작성용:</strong> Network 탭에 찍힌 실제 요청 주소는 정확히 <code>{breachResult.requestUrl}</code> 입니다.
                  뒤에 붙은 <code>{breachResult.prefix}</code> 5글자 외에는 비밀번호 원문이나 전체 해시가 단 1바이트도 포함되지 않습니다.
                </p>
              </div>
            </div>

            {/* 4단계 */}
            <div className="step-item">
              <div className="step-num">4</div>
              <div className="step-body">
                <div className="step-header">
                  <strong>서버 응답과 브라우저 로컬 대조</strong>
                  <span className="step-tag response-tag">k-익명성 수렴</span>
                </div>
                <p className="step-desc">
                  HIBP 서버는 <code>{breachResult.prefix}</code>로 시작하는 수백 개의 해시 목록(뒤 35글자)을 반환했습니다.
                  브라우저는 이 목록에서 내 해시 뒤 35글자(<code>{breachResult.suffix}</code>)가 존재하는지 <strong>로컬에서 직접 대조</strong>했습니다.
                </p>
                <div className="compare-summary">
                  대조 결과: <strong>{breachResult.breached ? `일치 항목 발견 (${breachResult.count.toLocaleString()}회 유출)` : '일치 항목 없음 (0회)'}</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="inspector-placeholder">
          <div className="placeholder-icon">🌐</div>
          <p>
            위의 <strong>"비밀번호 유출 확인"</strong>에서 조회를 실행하시면,
            이 패널에서 브라우저가 생성한 SHA-1 해시 분할 과정과 실제로 서버로 나간 최소 전송 URL(5글자)을 실시간으로 분해해 보여드립니다.
          </p>
        </div>
      )}

      {/* 사이버보안 통찰 안내 */}
      <div className="security-insight-box">
        <h4>🛡️ 사이버보안과 통찰: k-익명성은 완전한 익명일까요?</h4>
        <p>
          k-익명성(k-anonymity)은 비밀번호 원문과 전체 해시를 숨겨주지만, <strong>완전한 무정보 상태는 아닙니다.</strong>
        </p>
        <ul>
          <li><strong>서버가 알 수 있는 것:</strong> 요청자의 IP 주소, 요청 시각, 앞 5글자 해시(약 16^5 = 1,048,576개 버킷 중 하나).</li>
          <li><strong>서버가 알 수 없는 것:</strong> 요청자가 찾고 있던 정확한 비밀번호 및 전체 해시(약 수백~수천 개 후보 중 어느 것인지 모름).</li>
          <li><strong>확장 방어 (Add-Padding 헤더):</strong> 이번 앱은 <code>Add-Padding: true</code> 헤더를 적용하여 응답 데이터 길이를 균일하게 만들어 네트워크 트래픽 크기 기반 추론 공격까지 완화했습니다.</li>
        </ul>
      </div>
    </div>
  )
}
