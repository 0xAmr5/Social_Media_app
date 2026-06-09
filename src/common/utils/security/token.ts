import jwt from 'jsonwebtoken'
import { randomUUID } from 'node:crypto'
import { JWT_SECRET } from '../../../config/config.service'

export const signToken = (payload: Record<string, unknown>) => {
  return jwt.sign(
    {
      ...payload,
      id: payload.sub,
      jti: randomUUID(),
    },
    JWT_SECRET,
    { expiresIn: '10m' },
  )
}

export const verifyToken = (token: string) => {
  return jwt.verify(token, JWT_SECRET)
}
