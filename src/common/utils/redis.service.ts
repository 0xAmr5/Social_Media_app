import { createClient } from 'redis'

const redisClient = createClient({
  url: 'redis://127.0.0.1:6379',
})

redisClient.on('error', () => {
  // Redis is optional in the current setup.
})

export const connectRedis = async () => {
  if (redisClient.isOpen) {
    return
  }

  try {
    await redisClient.connect()
    console.log('Redis connected successfully')
  } catch {
    console.log('Redis connection skipped')
  }
}

export default redisClient
