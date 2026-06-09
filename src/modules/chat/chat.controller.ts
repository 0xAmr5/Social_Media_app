import { Router } from 'express'
import { authentication } from '../../common/middleware/auth.middleware'
import chatService from './chat.service'

const router = Router()

router.get('/', authentication, chatService.getChats)
router.get('/:userId', authentication, chatService.getChat)

export default router