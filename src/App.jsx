import { useState, useEffect } from 'react'
import './App.css'
import StrengthChecker from './components/StrengthChecker'
import Generator from './components/Generator'
import LeakChecker from './components/LeakChecker'

function App() {
  // 처음엔 컴퓨터 설정(라이트/다크)을 따라감
  const [theme, setTheme] = useState(
    window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  )

  // theme이 바뀔 때마다 <html data-theme="..."> 값 바꾸기
  useEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])

  function toggleTheme() {
    setTheme(theme === 'light' ? 'dark' : 'light')
  }

  return (
    <main className="container">
      <div className="header">
        <h1>비밀번호 점검소</h1>
        <button className="secondary" onClick={toggleTheme}>
          {theme === 'light' ? '다크 모드' : '라이트 모드'}
        </button>
      </div>
      <p className="subtitle">강도 검사 · 안전한 생성 · 유출 확인을 한곳에서</p>
      <StrengthChecker />
      <Generator />
      <LeakChecker />
    </main>
  )
}

export default App