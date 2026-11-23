import assert from 'node:assert/strict'
import { webcrypto } from 'node:crypto'
import test from 'node:test'
import {
  checkPasswordBreach,
  generatePassword,
  getPasswordStrength,
} from './passwordUtils.js'

test('generator includes each selected character type at the requested length', () => {
  const password = generatePassword(
    24,
    ['uppercase', 'lowercase', 'numbers', 'symbols'],
    webcrypto,
  )

  assert.equal(password.length, 24)
  assert.match(password, /[A-Z]/)
  assert.match(password, /[a-z]/)
  assert.match(password, /\d/)
  assert.match(password, /[^A-Za-z0-9]/)
})

test('generator rejects empty character selections and impossible lengths', () => {
  assert.throws(() => generatePassword(12, [], webcrypto), /하나 이상/)
  assert.throws(
    () => generatePassword(2, ['uppercase', 'lowercase', 'numbers'], webcrypto),
    /길이는/,
  )
})

test('strength scoring limits common and sequential passwords', () => {
  assert.equal(getPasswordStrength('password123').label, '약함')
  assert.equal(getPasswordStrength('qwer!234').label, '약함')
  assert.equal(getPasswordStrength('A7!bK9#qW2@xP5$m').label, '강함')
})

test('breach check sends only the five-character prefix and compares suffix case-insensitively', async () => {
  let requestUrl = ''
  let requestHeaders
  const result = await checkPasswordBreach(
    'password',
    async (url, options) => {
      requestUrl = url
      requestHeaders = options.headers
      return {
        ok: true,
        status: 200,
        text: async () => '1e4c9b93f3f0682250b6cf8331b7ee68fd8:52256179\r\n',
      }
    },
    webcrypto,
  )

  assert.equal(requestUrl, 'https://api.pwnedpasswords.com/range/5BAA6')
  assert.deepEqual(requestHeaders, { 'Add-Padding': 'true' })
  assert.deepEqual(result, { count: 52256179, prefix: '5BAA6' })
})

test('breach check surfaces API errors instead of reporting a clean password', async () => {
  await assert.rejects(
    checkPasswordBreach(
      'example',
      async () => ({ ok: false, status: 503 }),
      webcrypto,
    ),
    /서버 오류 \(503\)/,
  )
})
