import express, { NextFunction, Request, Response } from 'express'
import cors from 'cors'
import helmet from 'helmet'
import { rateLimit } from 'express-rate-limit'
import { connectRedis } from './common/utils/redis.service'
import { appError,   globalErrorHandler } from './common/utils/global-error-handler'  
import { PORT } from './config/config.service'  
import connectDb from './DB/ConnectionDB'
import authRouter from './modules/auth/auth.controller'

const app = express()

const bootstrap = async () => {
  await connectDb()
connectRedis().catch(err => console.log("Redis skipped")); // من غير await
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (_req: Request, _res: Response, next: NextFunction) => {
      next(new appError('Too many requests from this IP, please try again after 15 minutes', 429))
    },
  })

  app.use(helmet())
  app.use(cors())
  app.use(limiter)
  app.use(express.json())
  app.use('/auth', authRouter)

  app.get('/', (_req: Request, res: Response) => {
    res.json({ message: 'Welcome to the Social Media App' })
  })

app.use((req: Request, res: Response, next: NextFunction) => {
    next(new appError(`URL ${req.originalUrl} not found 🔴`, 404));
});

  app.use(globalErrorHandler)

  app.listen(PORT, () => {
    console.log(`🚀 Server is firing on port ${PORT}`)
    console.log(`🌐 Test it here: http://localhost:${PORT}`)
  })
}

console.log("Current Port from Config:", PORT);
export default bootstrap
