import { Document, Schema, Types, model } from 'mongoose'

interface IMessage {
  createdBy: Types.ObjectId
  content: string
  createdAt?: Date
  updatedAt?: Date
}

export interface IChat extends Document {
  createdBy: Types.ObjectId
  participants: Types.ObjectId[]
  messages: IMessage[]
  group?: string
  groupImage?: string
  roomId: string
  createdAt?: Date
  updatedAt?: Date
}

const messageSchema = new Schema<IMessage>(
  {
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true, trim: true },
  },
  {
    timestamps: true,
    _id: false,
  },
)

const chatSchema = new Schema<IChat>(
  {
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    participants: [{ type: Schema.Types.ObjectId, ref: 'User', required: true }],
    messages: [messageSchema],
    group: { type: String, trim: true },
    groupImage: { type: String },
    roomId: { type: String, required: true, unique: true, trim: true },
  },
  {
    timestamps: true,
    strictQuery: false,
  },
)

const ChatModel = model<IChat>('Chat', chatSchema)

export default ChatModel