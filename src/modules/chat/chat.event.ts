import { Server, Socket } from 'socket.io'
import chatServices from './chat.service.js'

class chatEvent {
  private readonly _chatServices = chatServices
  constructor() {}

  sendMessageToFriend = (socket: Socket, io: Server) => {
    socket.on(
      'sendMessage',
      async () => await this._chatServices.sendMessageToFriend(socket.data, socket, io),
    )
    
  }
  joinRoom = (socket: Socket, io: Server) => {
    socket.on(
      'join room',
      async () => await this._chatServices.joinRoom(socket.data, socket, io),
    )
    
  }
  sendMessageToGroup = (socket: Socket, io: Server) => {
    socket.on(
      'sendMessageToGroup',
      async () => await this._chatServices.sendGroupMessage(socket.data, socket, io),
    )
    
  }
}

export default new chatEvent()