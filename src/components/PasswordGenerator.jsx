import React, { useState } from 'react'
import { generateSecurePassword } from '../utils/crypto'

export default function PasswordGenerator({ onApplyPassword }) {
  const [length, setLength] = useState(16)
  const [options, setOptions] = useState({
    uppercase: true,
    lowercase: true,
    numbers: true,
    symbols: true,
    excludeAmbiguous: true,
  })
  const [generatedPassword, setGeneratedPassword] = useState('')
  const [copied, setCopied] = useState(false)

  const handleGenerate = () => {
    const pwd = generateSecurePassword({
      length,
      ...options,
    })
    setGeneratedPassword(pwd)
    setCopied(false)
  }

  const handleCopy = async () => {
    if (!generatedPassword) return
    try {
      await navigator.clipboard.writeText(generatedPassword)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // 클립보드 접근 불가 환경 폴백
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const toggleOption = (key) => {
    setOptions((prev) => {
      const next = { ...prev, [key]: !prev[key] }
      // 최소 1개 옵션은 켜져 있도록 보장
      if (!next.uppercase && !next.lowercase && !next.numbers && !next.symbols) {
        return prev
      }
      return next
    })
  }

  return (
    <div className="card">
      <div className="card-header">
        <div className="card-title-group">
          <span className="badge badge-success">CSPRNG 난수</span>
          <h2>안전한 비밀번호 생성기</h2>
        </div>
        <p className="card-subtitle">
          <code>window.crypto.getRandomValues()</code>를 사용해 암호학적으로 안전한 무작위 비밀번호를 생성합니다. (<code>Math.random()</code> 배제)
        </p>
      </div>

      {/* 생성된 결과 출력 영역 */}
      <div className="generator-result-box">
        <div className="generator-display">
          {generatedPassword ? (
            <span className="generated-text">{generatedPassword}</span>
          ) : (
            <span className="generated-placeholder">생성 버튼을 누르면 안전한 비밀번호가 나타납니다.</span>
          )}
        </div>
        <div className="generator-actions">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleCopy}
            disabled={!generatedPassword}
          >
            {copied ? '✓ 복사됨!' : '📋 복사'}
          </button>
          <button
            type="button"
            className="btn btn-outline"
            onClick={() => onApplyPassword(generatedPassword)}
            disabled={!generatedPassword}
          >
            🛡️ 이 암호 검사하기
          </button>
        </div>
      </div>

      {/* 생성 옵션 컨트롤 */}
      <div className="generator-controls">
        <div className="control-row">
          <div className="slider-label-group">
            <span className="control-label">비밀번호 길이</span>
            <span className="slider-val-badge">{length}자</span>
          </div>
          <input
            type="range"
            min="8"
            max="64"
            value={length}
            onChange={(e) => setLength(parseInt(e.target.value, 10))}
            className="range-slider"
          />
        </div>

        <div className="options-grid">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={options.uppercase}
              onChange={() => toggleOption('uppercase')}
            />
            <span>대문자 (A-Z)</span>
          </label>
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={options.lowercase}
              onChange={() => toggleOption('lowercase')}
            />
            <span>소문자 (a-z)</span>
          </label>
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={options.numbers}
              onChange={() => toggleOption('numbers')}
            />
            <span>숫자 (0-9)</span>
          </label>
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={options.symbols}
              onChange={() => toggleOption('symbols')}
            />
            <span>특수문자 (!@#$%^&*)</span>
          </label>
          <label className="checkbox-label col-span-2">
            <input
              type="checkbox"
              checked={options.excludeAmbiguous}
              onChange={() => toggleOption('excludeAmbiguous')}
            />
            <span>혼동하기 쉬운 문자 제외 (l, 1, I, O, 0 등)</span>
          </label>
        </div>

        <button type="button" className="btn btn-accent btn-large" onClick={handleGenerate}>
          ⚡ 새 비밀번호 생성 (CSPRNG)
        </button>
      </div>
    </div>
  )
}
