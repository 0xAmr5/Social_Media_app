import { Schema, model, Document } from 'mongoose'
import { GenderEnum, ProviderEnum, RoleEnum } from '../../common/enum/user.enum'
import { generateHash } from '../../common/utils/security/hash'
export interface IUser extends Document {
  userName: string
  email: string
  password: string
  age?: number
  phone?: string
  address?: string
  gender?: GenderEnum
  role?: RoleEnum
  provider?: ProviderEnum
  isConfirmed?: boolean
  createdAt?: Date
  updatedAt?: Date
}

const userSchema = new Schema<IUser>(
  {
    userName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true, select: false },
    age: { type: Number },
    phone: { type: String },
    address: { type: String },
    gender: { type: String, enum: Object.values(GenderEnum) },
    role: { type: String, enum: Object.values(RoleEnum), default: RoleEnum.User },
    provider: { type: String, enum: Object.values(ProviderEnum), default: ProviderEnum.Local },
    isConfirmed: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    strictQuery: false,
  },
)

userSchema.pre<IUser>('save', async function () {
  if (!this.isModified('password')) return
  this.password = await generateHash(this.password)
})

const UserModel = model<IUser>('User', userSchema)

export default UserModel