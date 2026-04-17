import { NextFunction, Request, Response } from 'express'
import jwt, { JwtPayload } from 'jsonwebtoken'
import { RoleEnum } from '../enum/user.enum'
import { JWT_SECRET } from '../../config/config.service'
import userModel from '../../DB/models/user.model'
import { appError } from '../utils/global-error-handler'

type AuthPayload = JwtPayload & {
  id?: string
}

export const authentication = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { authorization } = req.headers
    if (!authorization?.startsWith('Bearer ')) {
      return next(new appError('Invalid token or not provided', 401))
    }

    const token = authorization.split(' ')[1]
    if (!token) {
      return next(new appError('Invalid token or not provided', 401))
    }

    const decoded = jwt.verify(token, JWT_SECRET) as AuthPayload
    if (!decoded.id) {
      return next(new appError('Invalid payload', 401))
    }

    const user = await userModel.findById(decoded.id)
    if (!user) {
      return next(new appError('User no longer exists', 401))
    }

    req.user = user
    next()
  } catch {
    next(new appError('Authentication failed', 401))
  }
}

export const authorization = (roles: RoleEnum[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !req.user.role || !roles.includes(req.user.role)) {
      return next(new appError('You are not authorized to access this route', 403))
    }

    next()
  }
}
