import type { Server, Socket } from 'socket.io'
import chatEvent from './chat.event'

class ChatGateway {
  registerEvents = async (socket: Socket, io: Server) => {
    chatEvent.hi(socket)
    chatEvent.sendMessage(socket, io)
  }
}

const chatGateway = new ChatGateway()

export default chatGateway