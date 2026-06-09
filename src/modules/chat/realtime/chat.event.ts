import type { Server, Socket } from 'socket.io'
import chatService from '../chat.service'

class ChatEvent {
  hi = (socket: Socket) => {
    socket.on('hi', () => {
      socket.emit('hi', { message: 'Hello from server!' })
    })
  }

  sendMessage = (socket: Socket, io: Server) => {
    socket.on('sendMessage', (data: unknown) => {
      chatService.sendMessage(data as any, socket, io)
    })
  }
}

const chatEvent = new ChatEvent()

export default chatEvent
