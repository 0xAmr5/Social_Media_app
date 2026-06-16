import { Types } from 'mongoose'
import { createClient, RedisArgument, RedisClientType } from 'redis'
import {
  REDIS_HOST,
  REDIS_PASSWORD,
  REDIS_PORT,
  REDIS_URL,
  REDIS_USERNAME,
} from '../../config/config.service'
import { emailEnum } from '../enum/email.enum'
import cacheKeyEnum from '../enum/cacheKey.enum'

class RedisService {
  private readonly client: RedisClientType
  private isConnected = false

  constructor() {
    const socketOptions = REDIS_HOST && REDIS_PORT ? { host: REDIS_HOST, port: REDIS_PORT } : undefined
    const credentialOptions = {
      ...(REDIS_USERNAME ? { username: REDIS_USERNAME } : {}),
      ...(REDIS_PASSWORD ? { password: REDIS_PASSWORD } : {}),
      ...(socketOptions ? { socket: socketOptions } : {}),
    }

    this.client = REDIS_URL
      ? createClient({ url: REDIS_URL })
      : createClient(credentialOptions)
    this.handleEvent()
  }

  async connect() {
    if (this.isConnected) return
    if (!REDIS_URL && (!REDIS_HOST || !REDIS_PORT)) return

    await this.client.connect()
    this.isConnected = true
    console.log('Connected to Redis successfully!')
  }

  handleEvent() {
    this.client.on('error', error => {
      console.log('Connected to Redis Failed!', error)
    })
  }

  revoked_key = ({ userId, jti }: { userId: Types.ObjectId, jti: string }) => {
    return `revoke_token::${userId}::${jti}`
  }

  get_key = (userId: Types.ObjectId) => {
    return `revoke_token::${userId}`
  }

  otp_key = ({ email, subject = emailEnum.confirmEmail }: {
    email: string,
    subject?: emailEnum
  }) => {
    return `otp::${email}::${subject}`
  }

  fcm_key = (userId: Types.ObjectId | string) => {
    return `user:FCM:${userId}`
  }

  socketKey = (userId: Types.ObjectId | string) => {
    return `user:Socket:${userId}`
  }

  setValue = async ({ key, value, ttl }: { key: RedisArgument, value: string, ttl?: number }) => {
    try {
      if (!this.isConnected) return null
      if (ttl) {
        return await this.client.set(key, value, { EX: ttl })
      }
      return await this.client.set(key, value)
    } catch (error) {
      console.error('fail to set operation', error)
      return null
    }
  }

  update = async ({ key, value, ttl }: { key: RedisArgument, value: string, ttl: number }) => {
    try {
      if (!this.isConnected) return 0
      const isExists = await this.client.exists(key)
      if (!isExists) return 0
      return await this.client.set(key, value, { EX: ttl })
    } catch (error) {
      console.error('fail to update operation', error)
      return null
    }
  }

  getValue = async (key: RedisArgument) => {
    try {
      if (!this.isConnected) return null
      return await this.client.get(key)
    } catch (error) {
      console.error('fail to get value', error)
      return null
    }
  }

  isExist = async (key: RedisArgument) => {
    try {
      if (!this.isConnected) return 0
      return await this.client.exists(key)
    } catch (error) {
      console.error('fail to check existence', error)
      return 0
    }
  }

  deleteKey = async (key: RedisArgument) => {
    try {
      if (!this.isConnected) return 0
      return await this.client.del(key)
    } catch (error) {
      console.error('fail to delete key', error)
      return 0
    }
  }

  addFCM = async (userId: Types.ObjectId | string, fcmToken: string) => {
    try {
      if (!this.isConnected) return 0
      return await this.client.sAdd(this.fcm_key(userId), fcmToken)
    } catch (error) {
      console.error('fail to add fcm token', error)
      return 0
    }
  }

  removeFCM = async (userId: Types.ObjectId | string, fcmToken: string) => {
    try {
      if (!this.isConnected) return 0
      return await this.client.sRem(this.fcm_key(userId), fcmToken)
    } catch (error) {
      console.error('fail to remove fcm token', error)
      return 0
    }
  }

  getFCMS = async (userId: Types.ObjectId | string) => {
    try {
      if (!this.isConnected) return []
      return await this.client.sMembers(this.fcm_key(userId))
    } catch (error) {
      console.error('fail to get fcm tokens', error)
      return []
    }
  }

  hasFCMS = async (userId: Types.ObjectId | string) => {
    try {
      if (!this.isConnected) return 0
      return await this.client.sCard(this.fcm_key(userId))
    } catch (error) {
      console.error('fail to count fcm tokens', error)
      return 0
    }
  }

  removeFCMUser = async (userId: Types.ObjectId | string) => {
    try {
      if (!this.isConnected) return 0
      return await this.client.del(this.fcm_key(userId))
    } catch (error) {
      console.error('fail to remove user fcm tokens', error)
      return 0
    }
  }

  addSocket = async ({ userId, socketId }: { userId: Types.ObjectId | string, socketId: string }) => {
    try {
      if (!this.isConnected) return 0
      return await this.client.sAdd(this.socketKey(userId), socketId)
    } catch (error) {
      console.error('fail to add socket id', error)
      return 0
    }
  }

  removeSocket = async ({ userId, socketId }: { userId: Types.ObjectId | string, socketId: string }) => {
    try {
      if (!this.isConnected) return 0
      return await this.client.sRem(this.socketKey(userId), socketId)
    } catch (error) {
      console.error('fail to remove socket id', error)
      return 0
    }
  }

  getSockets = async (userId: Types.ObjectId | string) => {
    try {
      if (!this.isConnected) return []
      return await this.client.sMembers(this.socketKey(userId))
    } catch (error) {
      console.error('fail to get socket ids', error)
      return []
    }
  }

  hasSockets = async (userId: Types.ObjectId | string) => {
    try {
      if (!this.isConnected) return 0
      return await this.client.sCard(this.socketKey(userId))
    } catch (error) {
      console.error('fail to count socket ids', error)
      return 0
    }
  }

  removeSocketUser = async (userId: Types.ObjectId | string) => {
    try {
      if (!this.isConnected) return 0
      return await this.client.del(this.socketKey(userId))
    } catch (error) {
      console.error('fail to remove user socket ids', error)
      return 0
    }
  }

  // Additional methods for compatibility with service/redis.service
  cacheKey = ({ filter, subject }: { filter: string, subject: string }) => {
    return `${subject}::${filter}`
  }

  setKey = async ({ key, value, ttl = 60 }: { key: RedisArgument, value: any, ttl?: number }) => {
    try {
      const serializedValue = typeof value === 'string' ? value : JSON.stringify(value, null, 2)
      if (ttl) {
        return await this.client.set(key, serializedValue, { EX: ttl })
      }
      return await this.client.set(key, serializedValue)
    } catch (error) {
      console.error('fail to set key', error)
      return null
    }
  }

  getKey = async ({ key }: { key: string }) => {
    try {
      const value = await this.client.get(key)
      if (!value) return null
      try {
        return JSON.parse(value)
      } catch {
        return value
      }
    } catch (error) {
      console.error('fail to get key', error)
      return null
    }
  }

  keyExists = async ({ key }: { key: RedisArgument }) => {
    return await this.client.exists(key)
  }

  getAllKeys = async (pattern: RedisArgument) => {
    try {
      return await this.client.keys(pattern)
    } catch (error) {
      console.error('fail to get all keys', error)
      return []
    }
  }

  getKeyTtl = async (key: RedisArgument) => {
    try {
      return await this.client.ttl(key)
    } catch (error) {
      console.error('fail to get key ttl', error)
      return -1
    }
  }

  incrKey = async (key: RedisArgument) => {
    try {
      return await this.client.incr(key)
    } catch (error) {
      console.error('fail to increment key', error)
      return 0
    }
  }

  addSet = async ({ filter, subject }: { filter: string, subject: string }, members: any) => {
    return await this.client.sAdd(this.cacheKey({ filter, subject }), members)
  }

  getSet = async ({ filter, subject }: { filter: string, subject: string }) => {
    return await this.client.sMembers(this.cacheKey({ filter, subject }))
  }

  deleteSet = async ({ filter, subject }: { filter: string, subject: string }, members: any) => {
    return await this.client.sRem(this.cacheKey({ filter, subject }), members)
  }

  existsSet = async ({ filter, subject }: { filter: string, subject: string }) => {
    return await this.client.sCard(this.cacheKey({ filter, subject }))
  }
}

const redisService = new RedisService()

export default redisService