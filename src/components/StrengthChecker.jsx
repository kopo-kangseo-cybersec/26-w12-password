import { useState } from 'react'

function StrengthChecker() {
  const [password, setPassword] = useState('')

  // 검사할 조건 5가지
  const checks = [
    { label: '12자 이상', ok: password.length >= 12 },
    { label: '소문자 포함', ok: /[a-z]/.test(password) },
    { label: '대문자 포함', ok: /[A-Z]/.test(password) },
    { label: '숫자 포함', ok: /[0-9]/.test(password) },
    { label: '특수문자 포함', ok: /[^a-zA-Z0-9]/.test(password) },
  ]

  // 통과한 조건 개수 = 점수
  const score = checks.filter((c) => c.ok).length

  // 점수에 따라 등급과 색 정하기
  let level = '약함'
  let color = '#e53935' // 빨강
  if (score === 5) {
    level = '강함'
    color = '#43a047' // 초록
  } else if (score >= 3) {
    level = '보통'
    color = '#fb8c00' // 주황
  }

  return (
    <section className="card">
      <h2>비밀번호 강도 검사</h2>
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="검사할 비밀번호 입력"
      />

      {password && (
        <>
          {/* 강도 막대: 점수만큼 차오름 */}
          <div
            style={{
              height: '10px',
              background: '#eee',
              borderRadius: '5px',
              marginTop: '12px',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${(score / 5) * 100}%`,
                height: '100%',
                background: color,
                transition: 'width 0.3s',
              }}
            />
          </div>

          <p className="level" style={{ color: color }}>
            강도: {level} ({score}/5)
          </p>
        </>
      )}

      <ul>
        {checks.map((c) => (
          <li key={c.label}>
            {c.ok ? '✔' : '✘'} {c.label}
          </li>
        ))}
      </ul>

      <p className="note">입력한 비밀번호는 서버로 보내지 않고 브라우저 안에서만 검사합니다.</p>
    </section>
  )
}

export default StrengthChecker