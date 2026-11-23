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

  let level = '약함'
  if (score === 5) level = '강함'
  else if (score >= 3) level = '보통'

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
        <p className="level">
          강도: {level} ({score}/5)
        </p>
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