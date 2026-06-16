import type { Server as HttpServer } from 'node:http'
import { Server } from 'socket.io'
import redisService from '../common/utils/redis.service'
import { verifyToken } from '../common/utils/security/token'
import chatGateway from '../modules/chat/chat.gateway'

const decodedToken = async (token: string) => {
  const user = verifyToken(token)
  return { user }
}

class SocketGateway {
  initIo = async (httpServer: HttpServer) => {
    const io = new Server(httpServer, {
      cors: {
        origin: '*',
      },
    })

    io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth?.authorization || socket.handshake.auth?.token
        const accessToken = token?.startsWith('Bearer ') ? token.slice(7) : token
        const { user } = await decodedToken(accessToken)

        socket.data.user = user
        next()
      } catch (error: any) {
        next(error )
      }
    })

    io.on('connection', async socket => {
      const userId = socket.data.user.sub
      await redisService.addSocket({ userId, socketId: socket.id })
      await chatGateway.registerEvents(socket, io)

      console.log({ userSocketsIds: await redisService.getSockets(userId) })

      socket.on('disconnect', async () => {
        await redisService.removeSocket({ userId, socketId: socket.id })
        console.log({ userSocketsIdsAfterDisconnect: await redisService.getSockets(userId) })
      })
    })
  }
}

const socketGateway = new SocketGateway()

export default socketGateway