import { randomBytes, scrypt as nodeScrypt, timingSafeEqual } from 'node:crypto'
import { promisify } from 'node:util'

type BcryptModule = {
  hash(value: string, saltRounds: number): Promise<string>
  compare(value: string, hashedValue: string): Promise<boolean>
}

const SALT_ROUNDS = 10
const KEY_LENGTH = 64
const scrypt = promisify(nodeScrypt)

const loadBcrypt = (): BcryptModule | null => {
  try {
    return require('bcrypt') as BcryptModule
  } catch {
    return null
  }
}

export const generateHash = async (value: string): Promise<string> => {
  const bcrypt = loadBcrypt()
  if (bcrypt) {
    return bcrypt.hash(value, SALT_ROUNDS)
  }

  const salt = randomBytes(16).toString('hex')
  const derivedKey = (await scrypt(value, salt, KEY_LENGTH)) as Buffer
  return `${salt}:${derivedKey.toString('hex')}`
}

export const compareHash = async (value: string, hashedValue: string): Promise<boolean> => {
  const bcrypt = loadBcrypt()
  if (bcrypt && hashedValue.startsWith('$2')) {
    return bcrypt.compare(value, hashedValue)
  }

  const [salt, storedKey] = hashedValue.split(':')
  if (!salt || !storedKey) {
    return false
  }

  const derivedKey = (await scrypt(value, salt, KEY_LENGTH)) as Buffer
  const storedBuffer = Buffer.from(storedKey, 'hex')

  if (storedBuffer.length !== derivedKey.length) {
    return false
  }

  return timingSafeEqual(storedBuffer, derivedKey)
}
