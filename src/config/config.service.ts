import dotenv from 'dotenv'
import path from 'path'

dotenv.config({
  path: path.resolve(process.cwd(), `.env.${process.env.NODE_ENV || 'development'}`),
})

export const MONGO_URI = process.env.MONGO_URI ?? ''
export const PORT = Number(process.env.PORT ?? 3000)
export const EMAIL = process.env.EMAIL ?? ''
export const EMAIL_PASSWORD = process.env.EMAIL_PASSWORD ?? ''
export const EMAIL_FROM_NAME = process.env.EMAIL_FROM_NAME ?? 'Social App'
export const JWT_SECRET = process.env.JWT_SECRET ?? 'social_media_secret_key'
export const JWT_EXPIRES_IN = '1d'
