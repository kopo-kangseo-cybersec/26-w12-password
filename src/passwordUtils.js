const CHARACTER_SETS = {
  uppercase: 'ABCDEFGHJKLMNPQRSTUVWXYZ',
  lowercase: 'abcdefghijkmnopqrstuvwxyz',
  numbers: '23456789',
  symbols: '!@#$%^&*()-_=+[]{}?',
}

const COMMON_PASSWORDS = new Set([
  'password',
  'password123',
  'qwerty',
  'qwerty123',
  'letmein',
  'admin',
  'iloveyou',
  'welcome',
  'abc123',
])

function randomIndex(max, cryptoProvider = window.crypto) {
  const range = 256 - (256 % max)
  const value = new Uint8Array(1)

  do {
    cryptoProvider.getRandomValues(value)
  } while (value[0] >= range)

  return value[0] % max
}

export function getPasswordStrength(password) {
  if (!password) return { score: 0, label: '입력 대기', color: 'neutral' }

  const lower = password.toLowerCase()
  const hasSequence = /(?:0123|1234|2345|abcd|qwer|asdf|zxcv)/i.test(password)
  const isRepeated = /^(.)\1+$/.test(password)
  const common = COMMON_PASSWORDS.has(lower)
  let score = 0

  if (password.length >= 8) score += 1
  if (password.length >= 12) score += 1
  if (password.length >= 16) score += 1
  if (/[a-z]/.test(password)) score += 1
  if (/[A-Z]/.test(password)) score += 1
  if (/\d/.test(password)) score += 1
  if (/[^A-Za-z0-9]/.test(password)) score += 1
  if (hasSequence || isRepeated || common) score = Math.min(score, 2)

  if (score <= 2) return { score, label: '약함', color: 'weak' }
  if (score <= 4) return { score, label: '보통', color: 'medium' }
  return { score, label: '강함', color: 'strong' }
}

export function generatePassword(length, enabledSets, cryptoProvider = window.crypto) {
  const selectedSets = enabledSets
    .map((key) => CHARACTER_SETS[key])
    .filter(Boolean)

  if (selectedSets.length === 0) {
    throw new Error('문자 종류를 하나 이상 선택해 주세요.')
  }
  if (!Number.isInteger(length) || length < selectedSets.length || length > 64) {
    throw new Error('길이는 선택한 문자 종류 수 이상, 64 이하로 설정해 주세요.')
  }

  const allCharacters = selectedSets.join('')
  const passwordCharacters = selectedSets.map(
    (set) => set[randomIndex(set.length, cryptoProvider)],
  )

  while (passwordCharacters.length < length) {
    passwordCharacters.push(
      allCharacters[randomIndex(allCharacters.length, cryptoProvider)],
    )
  }

  for (let index = passwordCharacters.length - 1; index > 0; index -= 1) {
    const swapIndex = randomIndex(index + 1, cryptoProvider)
    ;[passwordCharacters[index], passwordCharacters[swapIndex]] = [
      passwordCharacters[swapIndex],
      passwordCharacters[index],
    ]
  }

  return passwordCharacters.join('')
}

export async function checkPasswordBreach(
  password,
  fetcher = fetch,
  cryptoProvider = window.crypto,
) {
  const bytes = new TextEncoder().encode(password)
  const digest = await cryptoProvider.subtle.digest('SHA-1', bytes)
  const hash = Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase()
  const prefix = hash.slice(0, 5)
  const suffix = hash.slice(5)

  const response = await fetcher(
    `https://api.pwnedpasswords.com/range/${prefix}`,
    {
      headers: { 'Add-Padding': 'true' },
    },
  )

  if (!response.ok) {
    throw new Error(`유출 확인 서버 오류 (${response.status}). 잠시 후 다시 시도해 주세요.`)
  }

  const matchingLine = (await response.text())
    .split(/\r?\n/)
    .map((line) => line.trim().split(':'))
    .find(([candidate]) => candidate?.toUpperCase() === suffix)

  const count = matchingLine ? Number(matchingLine[1]) : 0
  if (!Number.isFinite(count)) {
    throw new Error('유출 확인 응답을 읽을 수 없습니다. 잠시 후 다시 시도해 주세요.')
  }

  return { count, prefix }
}
