import { Router } from 'express'
import { authentication } from '../../common/middleware/auth.middleware'
import { Validation } from '../../common/middleware/validation'
import AuthService from './auth.service'
import * as authValidation from './auth.valivation'

const authRouter = Router()

authRouter.post('/signup', Validation(authValidation.signUpSchema), AuthService.signup)
authRouter.post('/signin', Validation(authValidation.signInSchema), AuthService.signin)
authRouter.patch('/confirm-email', AuthService.confirmEmail)
authRouter.patch('/update-password', authentication, AuthService.updatePassword)
authRouter.post('/logout', authentication, AuthService.logout)

export default authRouter
