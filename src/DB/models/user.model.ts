import { Schema, model, Document } from 'mongoose'
import mongoose from 'mongoose'
import { GenderEnum, ProviderEnum, RoleEnum } from '../../common/enum/user.enum'
import { generateHash } from '../../common/utils/security/hash'
export interface IUser extends Document {
  id: string
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
  confirmed?: boolean
  creadnatials?: Date
  friends?: string[]
  deletedAt?: Date | null
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
    friends: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    deletedAt: { type: Date, default: null },
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

userSchema.pre(["findOne", "find"], function () {
  const { paranoid, ...rest } = this.getQuery();
  if (paranoid === true) {
    this.setQuery(rest);
  } else this.setQuery({ deletedAt: null, ...rest });
});

userSchema.pre("findOneAndDelete", async function () {
  const user = await this.model.findOne(this.getQuery()).lean();
  if (!user?._id) return;
  const Post = mongoose.models.posts;
  const Comment = mongoose.models.comments;
  if (Post) await Post.deleteMany({ createdBy: user._id });
  if (Comment) await Comment.deleteMany({ createdBy: user._id });
});

const UserModel = model<IUser>('User', userSchema)

export default UserModel
