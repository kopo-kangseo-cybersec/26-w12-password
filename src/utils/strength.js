/**
 * 비밀번호 강도 검사 및 취약 패턴 분석 모듈
 * 100% 브라우저 로컬 연산 (외부 전송 없음)
 */

const COMMON_WEAK_PATTERNS = [
  '1234',
  'qwer',
  'password',
  'admin',
  'abcd',
  'asdf',
  'qwerty',
  '1111',
  '0000',
  'pass',
  '123456',
  '12345678',
  'iloveyou',
  'welcome'
];

/**
 * 비밀번호 강도 분석
 * @param {string} password 
 * @returns {Object} 강도 분석 결과 객체
 */
export function evaluatePasswordStrength(password) {
  if (!password || password.length === 0) {
    return {
      score: 0,
      percent: 0,
      label: '입력 대기',
      color: '#6b7280',
      checks: {
        minLength: false,
        hasUpper: false,
        hasLower: false,
        hasNumber: false,
        hasSymbol: false
      },
      warnings: [],
      suggestions: ['비밀번호를 입력하여 보안 강도를 확인하세요.']
    };
  }

  const length = password.length;
  const hasLower = /[a-z]/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSymbol = /[^a-zA-Z0-9]/.test(password);

  const checks = {
    minLength: length >= 8,
    hasUpper,
    hasLower,
    hasNumber,
    hasSymbol
  };

  const warnings = [];
  const suggestions = [];

  // 1. 길이 점수
  let rawScore = 0;
  if (length < 8) {
    warnings.push(`길이가 ${length}자로 너무 짧습니다. (최소 8자 권장)`);
  } else if (length >= 8 && length < 12) {
    rawScore += 1;
    suggestions.push('12자 이상으로 늘리면 무차별 대입 공격에 훨씬 안전해집니다.');
  } else if (length >= 12 && length < 16) {
    rawScore += 2;
  } else {
    rawScore += 3; // 16자 이상
  }

  // 2. 문자 조합 다양성 점수
  const varietyCount = [hasLower, hasUpper, hasNumber, hasSymbol].filter(Boolean).length;
  if (varietyCount >= 4) {
    rawScore += 2;
  } else if (varietyCount === 3) {
    rawScore += 1;
  }

  // 개선 제안 추가
  if (!hasUpper) suggestions.push('영문 대문자(A-Z)를 포함해 보세요.');
  if (!hasLower) suggestions.push('영문 소문자(a-z)를 포함해 보세요.');
  if (!hasNumber) suggestions.push('숫자(0-9)를 포함해 보세요.');
  if (!hasSymbol) suggestions.push('특수문자(!@#$%^&* 등)를 포함해 보세요.');

  // 3. 취약 패턴 감점
  const lowerPassword = password.toLowerCase();
  for (const pattern of COMMON_WEAK_PATTERNS) {
    if (lowerPassword.includes(pattern)) {
      warnings.push(`널리 알려진 취약 문자열("${pattern}")이 포함되어 있습니다.`);
      rawScore -= 2;
      break;
    }
  }

  // 4. 동일 문자 3회 이상 연속 반복 감지 (예: aaa, 111)
  const repeatRegex = /(.)\1{2,}/;
  const repeatMatch = password.match(repeatRegex);
  if (repeatMatch) {
    warnings.push(`동일한 문자("${repeatMatch[1]}")가 3회 이상 연속 반복됩니다.`);
    rawScore -= 1;
  }

  // 5. 단순 숫자나 알파벳으로만 구성된 경우 감점
  if (varietyCount <= 1 && length >= 8) {
    warnings.push('단일 종류의 문자로만 구성되어 쉽게 유추될 수 있습니다.');
    rawScore -= 1;
  }

  // 최종 점수 매핑 (0 ~ 4)
  let score = 0;
  if (length < 8) {
    score = rawScore >= 1 ? 1 : 0;
  } else {
    if (rawScore <= 0) score = 0;
    else if (rawScore <= 1) score = 1;
    else if (rawScore <= 2) score = 2;
    else if (rawScore <= 3) score = 3;
    else score = 4;
  }

  // 점수별 메타데이터
  const levelMetadata = [
    { label: '매우 약함', color: '#ef4444', percent: 20 },
    { label: '약함', color: '#f97316', percent: 40 },
    { label: '보통', color: '#eab308', percent: 60 },
    { label: '안전', color: '#10b981', percent: 80 },
    { label: '매우 안전', color: '#06b6d4', percent: 100 }
  ];

  const meta = levelMetadata[score];

  if (score === 4 && suggestions.length === 0) {
    suggestions.push('강력하고 안전한 비밀번호입니다!');
  }

  return {
    score,
    percent: meta.percent,
    label: meta.label,
    color: meta.color,
    checks,
    warnings,
    suggestions
  };
}
