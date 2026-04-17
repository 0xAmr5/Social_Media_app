import { NextFunction, Request, Response } from 'express'
import { HydratedDocument } from 'mongoose'
import jwt from 'jsonwebtoken'
import { GenderEnum } from '../../common/enum/user.enum.js'
import { JWT_EXPIRES_IN, JWT_SECRET } from '../../config/config.service'
import { appError } from '../../common/utils/global-error-handler'
import { compareHash, generateHash } from '../../common/utils/security/hash.js'
import UserModel, { IUser } from '../../DB/models/user.model'
import userRepository from '../../DB/repositories/user.repository.js'
import { SigninRequestBody, SignupRequestBody } from './auth.dto'
import { generateOtp, sendEmail } from '../../common/utils/email/send.email.js'
import { otpEmailTemplate } from '../../common/utils/email/email.template.js'
import { OAuth2Client } from 'google-auth-library';
class AuthService {
  private readonly _userModel = new userRepository()
  private readonly client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);



//login with gmail
    loginWithGmail = async (req: Request, res: Response, next: NextFunction) => {
        const { idToken } = req.body;
        
        const ticket = await this.client.verifyIdToken({ 
            idToken, 
            audience: process.env.GOOGLE_CLIENT_ID!,
        });
        
        const payload = ticket.getPayload();
        if (!payload) return next(new appError("Invalid Google Token 🔴", 400));  

        const { email, given_name, family_name } = payload;

        let user = await this._userModel.findOne({ filter: { email: email as string } });  
        if (!user) {
            user = await this._userModel.create({
                email,
                firstName: given_name as string,
                lastName: family_name as string,
                password: await generateHash(Math.random().toString()),
                confirmed: true,
                provider: 'google'
            } as Partial<IUser>);
        }

        const token = jwt.sign({ id: user._id, email: user.email }, JWT_SECRET);
        res.status(200).json({ message: "Google Login Success ✅", token });
    };


//signup

  signup = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { name, email, password }: SignupRequestBody = req.body

      await this._userModel.isEmailExists(email)

      const user: HydratedDocument<IUser> = await this._userModel.create({
        userName: name,
        email,
        password,
        phone: '',
        address: '',
        age: 0,
        gender: GenderEnum.Other,
      } as Partial<IUser>)

      const userObject = user.toObject()
      const { password: _password, ...safeUser } = userObject

      res.status(200).json({ message: 'Signup successful', user: safeUser })
    } catch (error) {
      next(error)
    }
  }


//signin

  signin = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password }: SigninRequestBody = req.body

      const user = await this._userModel.findOne({
        filter: { email },
        projection: '+password',
      })

      if (!user) {
        return next(new appError('Invalid email or password', 401))
      }

      if (!user.isConfirmed) {
        return next(new appError('Please confirm your email first', 403))
      }

      const isPasswordCorrect = await compareHash(password, user.password)
      if (!isPasswordCorrect) {
        return next(new appError('Invalid email or password', 401))
      }

      const token = jwt.sign(
        { id: user._id, email: user.email, role: user.role },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN },
      )

      res.status(200).json({
        message: 'Logged in successfully',
        token,
      })
    } catch (error) {
      next(error)
    }
  }

//confirm email

  confirmEmail = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, otp } = req.body as { email?: string; otp?: string }

      if (!email || !otp) {
        return next(new appError('Email and OTP are required', 400))
      }

      const user = await UserModel.findOne({ email }).exec()
      if (!user) {
        return next(new appError('User not found', 404))
      }

      if (user.isConfirmed) {
        return next(new appError('Email already confirmed', 400))
      }

      if (otp !== '123456') {
        return next(new appError('Invalid OTP', 400))
      }

      user.isConfirmed = true
      await user.save()

      res.status(200).json({ message: 'Email confirmed successfully' })
    } catch (error) {
      next(error)
    }
  }

//update password

  updatePassword = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { oldPassword, newPassword } = req.body as {
        oldPassword?: string
        newPassword?: string
      }

      if (!req.user?._id) {
        return next(new appError('Authentication required', 401))
      }

      if (!oldPassword || !newPassword) {
        return next(new appError('Old password and new password are required', 400))
      }

      const user = await UserModel.findById(req.user._id).select('+password').exec()
      if (!user) {
        return next(new appError('User not found', 404))
      }

      const isMatch = await compareHash(oldPassword, user.password)
      if (!isMatch) {
        return next(new appError('Old password is incorrect', 400))
      }

      user.password = await generateHash(newPassword)
      await user.save()

      res.status(200).json({ message: 'Password updated successfully' })
    } catch (error) {
      next(error)
    }
  }

  logout = async (_req: Request, res: Response, _next: NextFunction) => {
    res.status(200).json({ message: 'Logged out successfully' })
  }

  //forget password

  forgetPassword = async (req: Request, res: Response, next: NextFunction) => {
    const { email } = req.body;
    const user = await this._userModel.findOne({ filter: { email } });
    if (!user) return next(new appError("User not found 🔴", 404));
    const otp = await generateOtp(); 
    
    await sendEmail({
        to: email,
        subject: "Reset Password OTP 🔐",
        html: otpEmailTemplate({ otp })
    });

    res.status(200).json({ message: "OTP sent to your email ✅" });
};

//reset password

resetPassword = async (req: Request, res: Response, next: NextFunction) => {
    const { email, otp, newPassword } = req.body;
    const user = await this._userModel.findOne({ filter: { email } });
    
    if (!user) {
        return next(new appError("User not found 🔴", 404));
    }
    
    if (otp !== "123456") return next(new appError("Invalid OTP 🔴", 400))  
    user.password = await generateHash(newPassword);
    await user.save();

    res.status(200).json({ message: "Password reset successfully ✅" });
};  





}


  


const authService = new AuthService()

export default authService
