import crypto from 'crypto'

const ENCRYPTION_KEY = crypto
  .createHash('sha256')
  .update(process.env.ENCRYPTION_KEY || 'social-media-app-secret-key')
  .digest()

const IV_LENGTH = 16

export const encrypt = (value: string): string => {
  const iv = crypto.randomBytes(IV_LENGTH)
  const cipher = crypto.createCipheriv('aes-256-cbc', ENCRYPTION_KEY, iv)
  const encryptedValue = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()])

  return `${iv.toString('hex')}:${encryptedValue.toString('hex')}`
}

export const decrypt = (value: string): string => {
  const [ivHex, encryptedHex] = value.split(':')

  if (!ivHex || !encryptedHex) {
    throw new Error('Invalid encrypted value')
  }

  const decipher = crypto.createDecipheriv(
    'aes-256-cbc',
    ENCRYPTION_KEY,
    Buffer.from(ivHex, 'hex'),
  )

  const decryptedValue = Buffer.concat([
    decipher.update(Buffer.from(encryptedHex, 'hex')),
    decipher.final(),
  ])

  return decryptedValue.toString('utf8')
}
