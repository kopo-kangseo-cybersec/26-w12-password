import { useState } from 'react'

function LeakChecker() {
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [sentPrefix, setSentPrefix] = useState('')
  const [loading, setLoading] = useState(false)

  async function checkLeak() {
    setLoading(true)
    setMessage('')

    try {
      // 1. 비밀번호 → SHA-1 해시 (브라우저 안에서 계산)
      const data = new TextEncoder().encode(password)
      const hashBuffer = await crypto.subtle.digest('SHA-1', data)
      const hashArray = Array.from(new Uint8Array(hashBuffer))
      const hash = hashArray
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('')
        .toUpperCase()

      // 2. 앞 5글자 / 나머지 35글자로 나누기
      const prefix = hash.slice(0, 5)
      const suffix = hash.slice(5)
      setSentPrefix(prefix)

      // 3. 서버에는 앞 5글자만 보내기
      const res = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`)
      if (!res.ok) throw new Error('요청 실패')
      const text = await res.text()

      // 4. 받은 목록에서 내 해시 뒷부분 찾기 (대조는 브라우저 안에서)
      let count = 0
      const lines = text.split('\n')
      for (const line of lines) {
        const [lineSuffix, lineCount] = line.split(':')
        if (lineSuffix === suffix) {
          count = Number(lineCount)
          break
        }
      }

      if (count > 0) {
        setMessage(`유출됨! 이 비밀번호는 ${count.toLocaleString()}번 유출된 기록이 있습니다.`)
      } else {
        setMessage('유출 기록이 없습니다.')
      }
    } catch {
      setMessage('확인 중 오류가 발생했습니다. 인터넷 연결을 확인해 주세요.')
    }

    setLoading(false)
  }

  return (
    <section className="card">
      <h2>유출 여부 확인</h2>
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="확인할 비밀번호 입력"
      />

      <p>
        <button onClick={checkLeak} disabled={password === '' || loading}>
          {loading ? '확인 중...' : '유출 확인'}
        </button>
      </p>

      {message && <p className="level">{message}</p>}
      {sentPrefix && <p className="note">서버로 보낸 값: {sentPrefix} (SHA-1 해시 앞 5글자)</p>}

      <p className="note">
        비밀번호 자체는 보내지 않습니다. 해시 앞 5글자만 보내고, 받은 목록과의 대조는 브라우저 안에서
        합니다. (k-익명성)
      </p>
    </section>
  )
}

export default LeakChecker