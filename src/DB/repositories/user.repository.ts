import { Model } from 'mongoose'
import UserModel, { IUser } from '../models/user.model'
import BaseRepository from './base.repository'
import { appError } from '../../common/utils/global-error-handler'

type PaginateOptions = {
  page?: number
  limit?: number
  search?: Record<string, unknown>
}

class userRepository extends BaseRepository<IUser> {
  findAll(arg0: { filter: { _id: { $in: any }; friends: { $in: any[] } } }) {
    throw new Error('Method not implemented.')
  }
  constructor(protected readonly model: Model<IUser>=UserModel) {
    super(model)
  }


  async isEmailExists(email: string): Promise<boolean> {
    const existing = await UserModel.findOne({ email: email }).lean()
    if (existing) {
      throw new appError('User with this email already exists', 400)
    }
    return false
  }

  async paginate({ page = 1, limit = 10, search = {} }: PaginateOptions) {
    const skip = (page - 1) * limit
    const [data, total] = await Promise.all([
      this.model.find(search).skip(skip).limit(limit).exec(),
      this.model.countDocuments(search),
    ])

    return {
      data,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    }
  }
}

export default userRepository
