/**
 * Web Crypto API 기반 암호학적 유틸리티 모듈
 * - 무저장 원칙 및 최소 전송 원칙 준수
 * - Math.random() 사용 금지 -> crypto.getRandomValues() 사용
 */

/**
 * Uint8Array -> Base64 문자열 변환
 * @param {Uint8Array} bytes 
 * @returns {string}
 */
export function uint8ArrayToBase64(bytes) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

/**
 * Base64 문자열 -> Uint8Array 변환
 * @param {string} base64 
 * @returns {Uint8Array}
 */
export function base64ToUint8Array(base64) {
  const binary = window.atob(base64.trim());
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * 문자열의 SHA-1 해시를 계산하여 40자리 대문자 HEX 문자열 반환
 * @param {string} text 
 * @returns {Promise<string>} 40자리 대문자 SHA-1 해시
 */
export async function sha1(text) {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await window.crypto.subtle.digest('SHA-1', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
}

/**
 * Rejection Sampling 기반 균등 분포 무작위 정수 생성 (모듈로 편향 방지)
 * @param {number} max 상한값 (0 <= result < max)
 * @returns {number}
 */
export function getSecureRandomInt(max) {
  if (max <= 0) return 0;
  const limit = Math.floor(0x100000000 / max) * max;
  const array = new Uint32Array(1);
  while (true) {
    window.crypto.getRandomValues(array);
    if (array[0] < limit) {
      return array[0] % max;
    }
  }
}

/**
 * 암호학적으로 안전한 무작위 비밀번호 생성 (CSPRNG)
 * @param {Object} options
 * @param {number} options.length 비밀번호 길이 (8 ~ 32)
 * @param {boolean} options.uppercase 영문 대문자 포함
 * @param {boolean} options.lowercase 영문 소문자 포함
 * @param {boolean} options.numbers 숫자 포함
 * @param {boolean} options.symbols 특수문자 포함
 * @param {boolean} options.excludeAmbiguous 헷갈리는 문자(0, O, I, l, 1) 제외
 * @returns {string} 생성된 비밀번호
 */
export function generateSecurePassword(options = {}) {
  const {
    length = 16,
    uppercase = true,
    lowercase = true,
    numbers = true,
    symbols = true,
    excludeAmbiguous = false
  } = options;

  let upperChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let lowerChars = 'abcdefghijklmnopqrstuvwxyz';
  let numberChars = '0123456789';
  let symbolChars = '!@#$%^&*()_+-=[]{}|;:,.<>?';

  if (excludeAmbiguous) {
    const ambiguousRegex = /[0OIl1]/g;
    upperChars = upperChars.replace(ambiguousRegex, '');
    lowerChars = lowerChars.replace(ambiguousRegex, '');
    numberChars = numberChars.replace(ambiguousRegex, '');
    symbolChars = symbolChars.replace(ambiguousRegex, '');
  }

  const selectedSets = [];
  if (uppercase && upperChars.length > 0) selectedSets.push(upperChars);
  if (lowercase && lowerChars.length > 0) selectedSets.push(lowerChars);
  if (numbers && numberChars.length > 0) selectedSets.push(numberChars);
  if (symbols && symbolChars.length > 0) selectedSets.push(symbolChars);

  // 최소 1개 옵션 보장 (방어 로직)
  if (selectedSets.length === 0) {
    selectedSets.push(lowerChars || 'abcdefghijklmnopqrstuvwxyz');
  }

  const resultChars = [];

  // 1. 선택된 문자셋에서 각각 최소 1자 이상 의무 포함
  for (const set of selectedSets) {
    const idx = getSecureRandomInt(set.length);
    resultChars.push(set[idx]);
  }

  // 2. 전체 풀에서 나머지 길이만큼 채우기
  const fullPool = selectedSets.join('');
  const remainingCount = Math.max(0, length - resultChars.length);
  for (let i = 0; i < remainingCount; i++) {
    const idx = getSecureRandomInt(fullPool.length);
    resultChars.push(fullPool[idx]);
  }

  // 3. Fisher-Yates 알고리즘으로 암호학적 셔플 (순서 편향 방지)
  for (let i = resultChars.length - 1; i > 0; i--) {
    const j = getSecureRandomInt(i + 1);
    const temp = resultChars[i];
    resultChars[i] = resultChars[j];
    resultChars[j] = temp;
  }

  return resultChars.slice(0, length).join('');
}

/**
 * HIBP k-Anonymity API를 통한 비밀번호 유출 확인
 * - 비밀번호 원본 및 전체 해시 전송 금지
 * - SHA-1 앞 5글자(prefix)만 전송
 * - Add-Padding: true 헤더 적용 및 유출 횟수 0(더미 패딩) 필터링
 * @param {string} password 
 * @returns {Promise<{ isPwned: boolean, count: number, prefix: string }>}
 */
export async function checkPwnedPassword(password) {
  if (!password) {
    return { isPwned: false, count: 0, prefix: '' };
  }

  const fullHash = await sha1(password);
  const prefix = fullHash.slice(0, 5);
  const suffix = fullHash.slice(5); // 35글자 대문자

  const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
    method: 'GET',
    headers: {
      'Add-Padding': 'true'
    }
  });

  if (!response.ok) {
    throw new Error(`유출 확인 API 호출 실패 (상태 코드: ${response.status})`);
  }

  const text = await response.text();
  const lines = text.split('\n');

  let isPwned = false;
  let count = 0;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    const [entrySuffix, countStr] = line.split(':');
    const entryCount = parseInt(countStr, 10);

    // Add-Padding 가짜 항목(count: 0)은 반드시 제외
    if (isNaN(entryCount) || entryCount <= 0) {
      continue;
    }

    if (entrySuffix && entrySuffix.toUpperCase() === suffix) {
      isPwned = true;
      count = entryCount;
      break;
    }
  }

  return { isPwned, count, prefix };
}

/**
 * PBKDF2로 마스터 비밀번호에서 AES-GCM 256비트 암호화 키 파생
 * @param {string} masterPassword 
 * @param {Uint8Array} salt 
 * @param {Array<string>} keyUsages 
 * @returns {Promise<CryptoKey>}
 */
async function deriveAesKey(masterPassword, salt, keyUsages) {
  const encoder = new TextEncoder();
  const passBytes = encoder.encode(masterPassword);

  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    passBytes,
    'PBKDF2',
    false,
    ['deriveKey']
  );

  return window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    keyUsages
  );
}

/**
 * PBKDF2 + AES-GCM 메모 암호화
 * @param {string} plainText 
 * @param {string} masterPassword 
 * @returns {Promise<string>} Base64 인코딩된 [Salt(16B) + IV(12B) + 암호문(가변)]
 */
export async function encryptNote(plainText, masterPassword) {
  if (!plainText || !masterPassword) {
    throw new Error('평문 메모와 마스터 비밀번호를 모두 입력해야 합니다.');
  }

  const salt = window.crypto.getRandomValues(new Uint8Array(16));
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const aesKey = await deriveAesKey(masterPassword, salt, ['encrypt']);

  const encoder = new TextEncoder();
  const cipherBuffer = await window.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    aesKey,
    encoder.encode(plainText)
  );

  const cipherBytes = new Uint8Array(cipherBuffer);
  const combined = new Uint8Array(salt.length + iv.length + cipherBytes.length);
  combined.set(salt, 0);
  combined.set(iv, salt.length);
  combined.set(cipherBytes, salt.length + iv.length);

  return uint8ArrayToBase64(combined);
}

/**
 * PBKDF2 + AES-GCM 메모 복호화
 * @param {string} base64Payload 
 * @param {string} masterPassword 
 * @returns {Promise<string>} 복호화된 평문 문자열
 */
export async function decryptNote(base64Payload, masterPassword) {
  if (!base64Payload || !masterPassword) {
    throw new Error('암호화 데이터와 마스터 비밀번호를 모두 입력해야 합니다.');
  }

  let combined;
  try {
    combined = base64ToUint8Array(base64Payload);
  } catch {
    throw new Error('유효한 Base64 형식이 아닙니다.');
  }

  // Salt(16) + IV(12) + 최소 태그(16) = 최소 44바이트
  if (combined.byteLength < 44) {
    throw new Error('데이터 길이가 너무 짧거나 올바른 암호화 형식이 아닙니다.');
  }

  const salt = combined.slice(0, 16);
  const iv = combined.slice(16, 28);
  const cipherBytes = combined.slice(28);

  try {
    const aesKey = await deriveAesKey(masterPassword, salt, ['decrypt']);
    const plainBuffer = await window.crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      aesKey,
      cipherBytes
    );
    return new TextDecoder().decode(plainBuffer);
  } catch {
    // AES-GCM 인증 태그 불일치 또는 키 불일치 시
    throw new Error('비밀번호가 일치하지 않거나 데이터가 손상되었습니다. 복구할 수 없습니다.');
  }
}
