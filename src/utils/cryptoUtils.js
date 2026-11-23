/**
 * 암호학적 유틸리티 모듈 (Web Crypto API 기반)
 * 
 * [보안 원칙]
 * - Math.random() 금지 -> crypto.getRandomValues()만 사용 (CSPRNG)
 * - console.log 출력 금지
 * - localStorage / sessionStorage 사용 금지
 * - SHA-1 해시 대문자 변환 (.toUpperCase())
 * - k-익명성: SHA-1 해시 앞 5글자만 전송
 * - Add-Padding 대응: 유출 횟수 0인 가짜 레코드 필터링
 */

/**
 * 0 이상 max 미만의 균일한 난수 정수 반환 (Modulo Bias 방지 Rejection Sampling)
 * @param {number} max 
 * @returns {number}
 */
export function getSecureRandomInt(max) {
  if (max <= 0) return 0;
  const range = 0x100000000; // 2^32
  const limit = range - (range % max);
  const arr = new Uint32Array(1);
  let rand;
  do {
    crypto.getRandomValues(arr);
    rand = arr[0];
  } while (rand >= limit);
  return rand % max;
}

/**
 * 문자열의 SHA-1 해시를 대문자 40자리 16진수로 반환
 * @param {string} text 
 * @returns {Promise<string>}
 */
export async function sha1Hex(text) {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-1', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase();
}

/**
 * CSPRNG 기반 안전한 비밀번호 생성
 * @param {number} length 
 * @param {Object} options 
 * @param {boolean} options.hasUpper 
 * @param {boolean} options.hasLower 
 * @param {boolean} options.hasNumber 
 * @param {boolean} options.hasSpecial 
 * @returns {string}
 */
export function generateSecurePassword(length, { hasUpper, hasLower, hasNumber, hasSpecial }) {
  const UPPER = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const LOWER = 'abcdefghijklmnopqrstuvwxyz';
  const NUMBER = '0123456789';
  const SPECIAL = '!@#$%^&*()_+-=[]{}|;:,.<>?';

  const requiredPools = [];
  let fullPool = '';

  if (hasUpper) {
    requiredPools.push(UPPER);
    fullPool += UPPER;
  }
  if (hasLower) {
    requiredPools.push(LOWER);
    fullPool += LOWER;
  }
  if (hasNumber) {
    requiredPools.push(NUMBER);
    fullPool += NUMBER;
  }
  if (hasSpecial) {
    requiredPools.push(SPECIAL);
    fullPool += SPECIAL;
  }

  // 아무것도 선택되지 않았을 경우 기본 소문자+숫자
  if (fullPool.length === 0) {
    fullPool = LOWER + NUMBER;
    requiredPools.push(LOWER, NUMBER);
  }

  const resultChars = [];

  // 1. 선택된 종류가 최소 1개 이상 반드시 포함되도록 CSPRNG로 추출
  for (const pool of requiredPools) {
    const idx = getSecureRandomInt(pool.length);
    resultChars.push(pool[idx]);
  }

  // 2. 남은 길이만큼 전체 풀에서 CSPRNG로 무작위 추출
  while (resultChars.length < length) {
    const idx = getSecureRandomInt(fullPool.length);
    resultChars.push(fullPool[idx]);
  }

  // 3. Fisher-Yates CSPRNG 셔플로 첫 글자들의 순서 섞기
  for (let i = resultChars.length - 1; i > 0; i--) {
    const j = getSecureRandomInt(i + 1);
    const temp = resultChars[i];
    resultChars[i] = resultChars[j];
    resultChars[j] = temp;
  }

  return resultChars.join('');
}

/**
 * 비밀번호 강도 실시간 평가
 * @param {string} password 
 * @returns {Object}
 */
export function evaluatePasswordStrength(password) {
  if (!password || password.length === 0) {
    return {
      score: 0,
      label: '매우 약함',
      color: '#ef4444',
      percent: 0,
      checklist: {
        length: false,
        lengthScore: 0,
        hasUpper: false,
        hasLower: false,
        hasNumber: false,
        hasSpecial: false,
      },
      warnings: [],
      isCompromisedPattern: false,
    };
  }

  const len = password.length;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);

  // 1) 길이 평가
  let lengthScore = 0; // 0: <8, 1: 8~11, 2: 12~15, 3: 16+
  if (len < 8) {
    lengthScore = 0;
  } else if (len <= 11) {
    lengthScore = 1;
  } else if (len <= 15) {
    lengthScore = 2;
  } else {
    lengthScore = 3;
  }

  // 2) 문자 조합 수 (0~4)
  const typesCount = (hasUpper ? 1 : 0) + (hasLower ? 1 : 0) + (hasNumber ? 1 : 0) + (hasSpecial ? 1 : 0);

  // 3) 취약 패턴 감점 검사
  const warnings = [];
  let isCompromisedPattern = false;

  const weakKeywords = ['1234', 'qwer', 'asdf', 'password', 'admin'];
  const lowerPwd = password.toLowerCase();
  for (const kw of weakKeywords) {
    if (lowerPwd.includes(kw)) {
      warnings.push(`취약 키보드/사전 패턴 '${kw}'이(가) 포함되어 있습니다.`);
      isCompromisedPattern = true;
      break;
    }
  }

  // 동일 문자 3회 이상 연속 반복 (예: aaa, 111, @@@)
  const repeatRegex = /(.)\1{2,}/;
  if (repeatRegex.test(password)) {
    warnings.push("동일 문자가 3회 이상 연속 반복되었습니다. (예: 'aaa', '111')");
    isCompromisedPattern = true;
  }

  // 4) 종합 강도 계산 (4단계: '매우 약함', '약함', '보통', '강함')
  let label = '매우 약함';
  let color = '#ef4444'; // Red
  let percent = 25;
  let score = 1;

  if (len < 8) {
    label = '매우 약함';
    color = '#ef4444';
    percent = 25;
    score = 1;
    warnings.push('비밀번호 길이가 최소 권장 길이(8자) 미만입니다.');
  } else if (isCompromisedPattern) {
    // 취약 패턴 포함 시 강도를 '약함' 이하로 강제 하향
    label = '약함';
    color = '#f59e0b';
    percent = 40;
    score = 2;
  } else {
    // 정상 기준
    if (lengthScore >= 3 && typesCount >= 3) {
      label = '강함';
      color = '#10b981'; // Green
      percent = 100;
      score = 4;
    } else if (lengthScore >= 2 && typesCount >= 4) {
      label = '강함';
      color = '#10b981';
      percent = 100;
      score = 4;
    } else if (lengthScore >= 2 && typesCount >= 2) {
      label = '보통';
      color = '#3b82f6'; // Blue
      percent = 70;
      score = 3;
    } else if (lengthScore >= 1 && typesCount >= 3) {
      label = '보통';
      color = '#3b82f6';
      percent = 70;
      score = 3;
    } else {
      label = '약함';
      color = '#f59e0b'; // Amber
      percent = 45;
      score = 2;
    }
  }

  return {
    score,
    label,
    color,
    percent,
    checklist: {
      length: len >= 8,
      lengthScore,
      hasUpper,
      hasLower,
      hasNumber,
      hasSpecial,
    },
    warnings,
    isCompromisedPattern,
  };
}

/**
 * Have I Been Pwned k-익명성 유출 여부 검사
 * @param {string} password 
 * @returns {Promise<{ pwned: boolean, count: number, prefix: string, suffix: string, requestedUrl: string, totalReturned: number, paddingFiltered: number }>}
 */
export async function checkPwnedPassword(password) {
  if (!password) {
    throw new Error('비밀번호를 입력해 주세요.');
  }

  // 1. 브라우저에서 비밀번호의 SHA-1 해시 계산 (대문자 40자리)
  const fullHash = await sha1Hex(password);
  const prefix = fullHash.substring(0, 5);
  const suffix = fullHash.substring(5);

  const requestedUrl = `https://api.pwnedpasswords.com/range/${prefix}`;

  // 2. 앞 5글자만 range API로 전송 (Add-Padding 헤더 필수)
  const response = await fetch(requestedUrl, {
    method: 'GET',
    headers: {
      'Add-Padding': 'true',
    },
  });

  if (!response.ok) {
    throw new Error(`HIBP 서버 응답 오류 (상태 코드: ${response.status})`);
  }

  const responseText = await response.text();
  const lines = responseText.split(/\r?\n/);

  let pwned = false;
  let count = 0;
  let totalReturned = 0;
  let paddingFiltered = 0;

  // 3. 브라우저 내부에서 뒤 35자리 해시 대조 (대문자 일치)
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    totalReturned++;

    const [lineSuffix, countStr] = trimmed.split(':');
    if (!lineSuffix || !countStr) continue;

    const leakCount = parseInt(countStr, 10);

    // Add-Padding: true에 의해 삽입된 유출 횟수 0인 가짜 레코드 제외
    if (leakCount === 0) {
      paddingFiltered++;
      continue;
    }

    if (lineSuffix.trim().toUpperCase() === suffix) {
      pwned = true;
      count = leakCount;
      // 일치 항목을 찾았더라도 패딩 집계를 위해 계속 파싱하거나 여기서 종료 가능
      // 여기서는 계속 파싱하여 전체 카운트 통계 유지
    }
  }

  return {
    pwned,
    count,
    prefix,
    suffix,
    requestedUrl,
    totalReturned,
    paddingFiltered,
  };
}

/**
 * Uint8Array를 Base64 문자열로 변환
 * @param {Uint8Array} bytes 
 * @returns {string}
 */
export function uint8ArrayToBase64(bytes) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Base64 문자열을 Uint8Array로 변환
 * @param {string} base64 
 * @returns {Uint8Array}
 */
export function base64ToUint8Array(base64) {
  const binary = atob(base64.trim());
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * 마스터 비밀번호로 PBKDF2 키 유도 (AES-GCM 256비트)
 * @param {string} masterPassword 
 * @param {Uint8Array} salt 
 * @returns {Promise<CryptoKey>}
 */
async function deriveAesKey(masterPassword, salt) {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(masterPassword),
    'PBKDF2',
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * AES-GCM 암호화
 * @param {string} masterPassword 
 * @param {string} plaintext 
 * @returns {Promise<{ saltBase64: string, ivBase64: string, ciphertextBase64: string }>}
 */
export async function encryptSecretNote(masterPassword, plaintext) {
  if (!masterPassword) throw new Error('마스터 비밀번호를 입력해 주세요.');
  if (!plaintext) throw new Error('암호화할 비밀 메모를 입력해 주세요.');

  // 1. Salt (16 바이트) 및 IV (12 바이트) CSPRNG 생성
  const salt = new Uint8Array(16);
  crypto.getRandomValues(salt);

  const iv = new Uint8Array(12);
  crypto.getRandomValues(iv);

  // 2. PBKDF2 키 유도
  const derivedKey = await deriveAesKey(masterPassword, salt);

  // 3. AES-GCM 256 암호화
  const encoder = new TextEncoder();
  const plaintextBytes = encoder.encode(plaintext);
  const ciphertextBuffer = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv,
    },
    derivedKey,
    plaintextBytes
  );

  return {
    saltBase64: uint8ArrayToBase64(salt),
    ivBase64: uint8ArrayToBase64(iv),
    ciphertextBase64: uint8ArrayToBase64(new Uint8Array(ciphertextBuffer)),
  };
}

/**
 * AES-GCM 복호화
 * @param {string} masterPassword 
 * @param {string} saltBase64 
 * @param {string} ivBase64 
 * @param {string} ciphertextBase64 
 * @returns {Promise<string>}
 */
export async function decryptSecretNote(masterPassword, saltBase64, ivBase64, ciphertextBase64) {
  if (!masterPassword) throw new Error('마스터 비밀번호를 입력해 주세요.');
  if (!saltBase64 || !ivBase64 || !ciphertextBase64) {
    throw new Error('Salt, IV, 암호문(Base64)을 모두 입력해 주세요.');
  }

  let salt, iv, ciphertext;
  try {
    salt = base64ToUint8Array(saltBase64);
    iv = base64ToUint8Array(ivBase64);
    ciphertext = base64ToUint8Array(ciphertextBase64);
  } catch {
    throw new Error('Base64 형식이 올바르지 않습니다. 복사된 값을 확인해 주세요.');
  }

  let derivedKey;
  try {
    derivedKey = await deriveAesKey(masterPassword, salt);
  } catch {
    throw new Error('키 유도 중 오류가 발생했습니다.');
  }

  try {
    const decryptedBuffer = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: iv,
      },
      derivedKey,
      ciphertext
    );

    const decoder = new TextDecoder();
    return decoder.decode(decryptedBuffer);
  } catch {
    // OperationError 또는 인증 태그 불일치
    throw new Error('비밀번호가 일치하지 않아 복호화할 수 없습니다. 키를 분실하면 누구도 복구할 수 없습니다.');
  }
}
