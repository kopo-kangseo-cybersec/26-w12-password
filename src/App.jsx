import './App.css'
import StrengthChecker from './components/StrengthChecker'
import Generator from './components/Generator'
import LeakChecker from './components/LeakChecker'

function App() {
  return (
    <main className="container">
      <h1>비밀번호 점검소</h1>
      <p className="subtitle">강도 검사 · 안전한 생성 · 유출 확인을 한곳에서</p>
      <StrengthChecker />
      <Generator />
      <LeakChecker />
    </main>
  )
}

export default App