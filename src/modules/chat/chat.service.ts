import { NextFunction, Request, Response } from 'express'
import { Types } from 'mongoose'
import type { Server, Socket } from 'socket.io'
import ChatRepository from '../../DB/repositories/chat.repository'
import UserRepository from '../../DB/repositories/user.repository'
import redisService from '../../common/service/redis.service'
import s3services from '../../common/service/s3Services'
import { ErrorConflict } from '../../common/utils/global-error-handler'

class chatServices {
  private readonly _chatRepo = new ChatRepository()
  private readonly _userRepo = new UserRepository()
  private readonly _redisServices = redisService
  private readonly _s3services = new s3services()

  constructor() {}

  //rest apis
  getChat = async (req: Request, res: Response, next: NextFunction) => {
    const { user } = req
    const { userId } = req.params
    let { page, limit }: { page: number; limit: number } =
      req.query as unknown as {
        page: number
        limit: number
      }
    page = Number(page) < 0 || !page ? (page = 1) : page
    limit = Number(limit) < 0 || !limit ? (limit = 5) : limit

    const chat = await this._chatRepo.findOne({
      filter: {
        participants: { $all: [user?.id, userId] },
        group: { $exists: false },
      },
      projection: {
        messages: { $slice: [-(page * limit), limit] },
      },
      options: {
        populate: [
          {
            path: 'participants',
          },
        ],
      },
    })

    if (!chat) {
      ErrorConflict('failed to find chat between the users')
    }

    res.status(200).json({ success: true, data: { chat } })
  }

  getGrpupChat = async (req: Request, res: Response, next: NextFunction) => {
    const { user } = req
    const { roomId } = req.params
    let { page, limit }: { page: number; limit: number } =
      req.query as unknown as {
        page: number
        limit: number
      }
    page = Number(page) < 0 || !page ? (page = 1) : page
    limit = Number(limit) < 0 || !limit ? (limit = 5) : limit

    const chat = await this._chatRepo.findOne({
      filter: {
        roomId,
        participants: { $all: [user?.id] },
        group: { $exists: true },
      },
      projection: {
        messages: { $slice: [-(page * limit), limit] },
      },
      options: {
        populate: [
          {
            path: 'messages.createdBy',
          },
        ],
      },
    })

    if (!chat) {
      ErrorConflict('failed to find chat between the users')
    }

    res.status(200).json({ success: true, data: { chat } })
  }

  createChat = async (req: Request, res: Response, next: NextFunction) => {
    let { group, participants, groupImage } = req.body
    const createdBy = req?.user?.id as any
    const partiMap = participants.map((pr: string) => {
      return Types.ObjectId.createFromHexString(pr)
    })

    const users = await this._userRepo.findAll({
      filter: {
        _id: {
          $in: partiMap,
        },
        friends: {
          $in: [createdBy],
        },
      },
    })

    if (users?.length != partiMap.length) {
      ErrorConflict('there is some users not exists in the db')
    }

    let groupPath =
      group.replace(/\s+/g, '-') + Math.floor(Math.random() * 10000)
    partiMap.push(createdBy)
    if (groupImage) {
      groupImage = await this._s3services.uploadFile({
        file: groupImage,
        path: `chat/${groupPath}`,
      })
    }

    try {
      const chat = await this._chatRepo.create({
        group,
        groupImage,
        participants,
        createdBy,
        messages: [],
        roomId: groupPath,
      })
    } catch (err) {
      await this._s3services.deleteFile({ Key: groupPath })
      return res.status(500).json({ success: false, message: 'failed to create group' })
    }

    res.status(200).json({ success: true, data: 'chat created' })
  }

  //socket.io

  sendMessageToFriend = async (data: any, socket: Socket, io: Server) => {
    const { sendTo, content } = data
    const createdBy = socket.data.user?.id

    const user = await this._userRepo.findById(sendTo)
    if (!user) {
      return socket.emit('errorMessage', { message: 'unable to find the user' })
    }

    const chat = await this._chatRepo.findOneAndUpdate({
      filter: {
        participants: { $all: [sendTo, createdBy] },
        group: { $exists: false },
      },
      update: {
        $push: {
          messages: {
            createdBy,
            content,
          },
        },
      },
    })

    if (!chat) {
      await this._chatRepo.create({
        participants: [sendTo, createdBy],
        createdBy,
        messages: [
          {
            createdBy,
            content,
          },
        ],
      })
    }

    const createdBySockets = await this._redisServices.getSockets(createdBy)
    const sendToSockets = await this._redisServices.getSockets(sendTo)
    io.to(createdBySockets).emit('successMessage', { content })
    io.to(sendToSockets).emit('newMessage', { content, from: socket.data.user })
  }

  joinRoom = async (data: any, socket: Socket, io: Server) => {
    const { roomId, userId } = data
    const chat = await this._chatRepo.findOne({
      filter: {
        group: { $exists: true },
        participants: { $in: [userId] },
        roomId,
      },
    })

    if (!chat) return socket.emit('errorMessage', { message: 'group not found' })
    socket.join(roomId)
    socket.emit('successMessage', { message: 'joined room successfully', roomId })
  }

  sendGroupMessage = async (data: any, socket: Socket, io: Server) => {
    const { content, groupId, userId } = data

    const chat = await this._chatRepo.findOneAndUpdate({
      filter: {
        _id: groupId,
        participants: { $in: [userId] },
        group: { $exists: true },
      },
      update: {
        $push: {
          messages: {
            createdBy: userId,
            content,
          },
        },
      },
      options: {
        returnDocument: 'after',
      },
    })

    if (!chat) return socket.emit('errorMessage', { message: 'group not found' })
    socket.emit('successMessage', { content })
    socket.to(chat.roomId).emit('newMessage', { content, from: userId, groupId })
  }
}

export default new chatServices()