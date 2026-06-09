import { NextFunction, Request, Response } from 'express'
import { Types } from 'mongoose'
import type { Server, Socket } from 'socket.io'
import ChatRepository from '../../DB/repositories/chat.repository'
import UserRepository from '../../DB/repositories/user.repository'
import redisService from '../../common/utils/redis.service'
import { appError, SuccessResponse } from '../../common/utils/global-error-handler'

type SendMessageData = {
  sendTo?: unknown
  content?: unknown
}

class ChatService {
  private readonly _userRepo = new UserRepository()
  private readonly _chatRepo = new ChatRepository()

  constructor() {}

  getChats = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      SuccessResponse({
        res,
        data: { message: 'Chat module is ready' },
      })
    } catch (error) {
      next(error)
    }
  }

  getChat = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userId } = req.params

      if (!req.user?._id) {
        throw new appError('Unauthorized', 401)
      }

      if (typeof userId !== 'string' || !Types.ObjectId.isValid(userId)) {
        throw new appError('Invalid user id', 400)
      }

      const user = await this._userRepo.findById(userId)
      if (!user) {
        throw new appError('User not found', 404)
      }

      const chat = await this._chatRepo.findOne({
        filter: {
          participants: {
            $all: [req.user._id, new Types.ObjectId(userId)],
          },
          group: { $exists: false },
        },
      })

      if (!chat) {
        throw new appError('chat not found', 400)
      }

      SuccessResponse({ res, statusCode: 200, data: { message: 'Done', chat } })
    } catch (error) {
      next(error)
    }
  }

  sendMessage = async (data: SendMessageData, socket: Socket, io: Server) => {
    try {
      const { sendTo, content } = data
      const createdBy = socket.data.user?._id || socket.data.user?.sub

      if (typeof createdBy !== 'string' || !Types.ObjectId.isValid(createdBy)) {
        throw new appError('Unauthorized', 401)
      }

      if (typeof sendTo !== 'string' || !Types.ObjectId.isValid(sendTo)) {
        throw new appError('Invalid receiver id', 400)
      }

      if (typeof content !== 'string' || !content.trim()) {
        throw new appError('Message content is required', 400)
      }

      const user = await this._userRepo.findOne({ filter: { _id: sendTo } })
      if (!user) {
        throw new appError('user not exist', 404)
      }

      const createdByObjectId = new Types.ObjectId(createdBy)
      const sendToObjectId = new Types.ObjectId(sendTo)
      const roomId = [createdBy, sendTo].sort().join('_')

      const updatedChat = await this._chatRepo.findOneAndUpdate({
        filter: {
          participants: {
            $all: [sendToObjectId, createdByObjectId],
          },
          group: { $exists: false },
        },
        update: {
          $push: {
            messages: {
              content: content.trim(),
              createdBy: createdByObjectId,
            },
          },
        },
        options: {
          new: true,
        },
      })

      const chat = updatedChat || await this._chatRepo.create({
        createdBy: createdByObjectId,
        participants: [createdByObjectId, sendToObjectId],
        messages: [
          {
            content: content.trim(),
            createdBy: createdByObjectId,
          },
        ],
        roomId,
      })

      const receiverSockets = await redisService.getSockets(sendTo)
      io.to([...receiverSockets, socket.id]).emit('receiveMessage', {
        message: 'Done',
        data: chat,
      })
    } catch (error) {
      socket.emit('socketError', {
        message: error instanceof Error ? error.message : 'Failed to send message',
      })
    }
  }
}

export default new ChatService()