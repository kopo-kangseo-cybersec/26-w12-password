export default function Header() {
  return (
    <header className="app-header">
      <div className="header-badge-row">
        <span className="badge badge-primary">🛡️ Cyber Security Lab 12주차</span>
        <span className="badge badge-success">k-익명성 & CSPRNG 검증</span>
      </div>
      <h1 className="header-title">비밀번호 보안 점검 & 생성 도구</h1>
      <p className="header-subtitle">
        단 한 글자의 비밀번호도 외부 서버로 전송하지 않는 <strong>최소 전송 원칙(k-Anonymity)</strong>과{' '}
        <strong>Web Crypto API</strong> 기반의 안전한 보안 워크스페이스
      </p>
    </header>
  )
}
