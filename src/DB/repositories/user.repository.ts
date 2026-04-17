import { Model } from 'mongoose'
import UserModel, { IUser } from '../models/user.model'
import BaseRepository from './base.repository'
import { appError } from '../../common/utils/global-error-handler'

class userRepository extends BaseRepository<IUser> {
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
}

export default userRepository
