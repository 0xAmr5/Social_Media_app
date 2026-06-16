import type { NextFunction, Request, Response } from "express";
import { SECRET_ADMIN_ACCESS_TOKEN, SECRET_USER_ACCESS_TOKEN, TOKEN_ADMIN_PREFIX, TOKEN_USER_PREFIX } from "../../config/config.service";
import { ErrorConflict, Errorforbidden, ErrorUnAuthorizedRequest } from "../utils/global-error-handler";
import { accessTokenVerify } from "../utils/security/jsonWebTokens";
import jsonwebtoken from "jsonwebtoken";
import userRepo from "../../DB/repo/user.repo";
import { HydratedDocument } from "mongoose";
import { IUser } from "../../DB/models/user.model";
import cacheKeyEnum from "../enum/cacheKey.enum";
import redisServices from "../utils/redis.service";
import { appError } from "../utils/global-error-handler";
import redisService from "../utils/redis.service";
import { RoleEnum } from "../enum/user.enum";
import { JWT_SECRET } from "../../config/config.service";


  export async function authenticate(req : Request ,res:Response,next : NextFunction){
    let {authorization} : any = req.headers 

    if (!authorization) Errorforbidden('invalid token')
    let [prefix, token] : [string,string] = authorization.split(" ");
    if ( !prefix ){
      Errorforbidden('invalid token')
    }

    const secret : string = (function (){
      if ( prefix == TOKEN_USER_PREFIX){
        return SECRET_USER_ACCESS_TOKEN
      }
      else if (prefix == TOKEN_ADMIN_PREFIX){
        return SECRET_ADMIN_ACCESS_TOKEN
      }
        return Errorforbidden('invalid token')
    })()
    
    const verify: jsonwebtoken.JwtPayload = accessTokenVerify(
      {token , secret },
    ) as jsonwebtoken.JwtPayload;
    const user : HydratedDocument<IUser> | null = await userRepo.findById({
      id : verify.data.userId ,
    })
    if (!user) ErrorConflict('user does not exists')
    if (user!.creadnatials && user!.creadnatials.getTime() < (verify.iat as number)*1000) 
    ErrorUnAuthorizedRequest('token revoked please login again')

    const CachedRevokeToken = await redisServices.getKey({
      key : redisServices.cacheKey({filter : token , subject : cacheKeyEnum.revokeToken})
    })

    if (CachedRevokeToken) ErrorUnAuthorizedRequest('token revoked please login again')
      
    req.user = user as HydratedDocument<IUser>;
    req.token = token as string ;
    req.tokenDecoded = verify
    next();
  }

export const graphql_authorization = async (roles: RoleEnum[], role?: string) => {
  if (!role) {
    throw new appError('Unauthorized', 401)
  }

  if (!roles.includes(role as RoleEnum)) {
    throw new appError('Forbidden', 403)
  }
}



export const graphql_auth = async (authorization?: string) => {
  if (!authorization?.startsWith('Bearer ')) {
    throw new appError('Authorization token is required', 401)
  }

  const [prefix, token] = authorization.split(' ')
  if (!prefix || !token) {
    throw new appError('Invalid token format', 401)
  }

  const decoded = verifyToken(token, prefix)

  if (!decoded.data?.userId) {
    throw new appError('Invalid token payload', 401)
  }

  const revokedTokenKey = `revoked_token:${decoded.id}`
  const isRevoked = await redisService.isExist(revokedTokenKey)
  if (isRevoked) {
    throw new appError('Token has been revoked', 401)
  }

  const user = await userRepo.findById(decoded.data.userId)
  if (!user) {
    throw new appError('User not found', 404)
  }

  return { user, decoded }
}
function verifyToken(token: string, prefix: string) {
  const secret = (function () {
    if (prefix === TOKEN_USER_PREFIX) {
      return SECRET_USER_ACCESS_TOKEN
    }
    else if (prefix === TOKEN_ADMIN_PREFIX) {
      return SECRET_ADMIN_ACCESS_TOKEN
    }
    throw new appError('Invalid token prefix', 401)
  })()

  return accessTokenVerify({ token, secret }) as jsonwebtoken.JwtPayload
}
