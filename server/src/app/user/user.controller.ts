import { Request, Response, NextFunction } from 'express'
import { LoginRequest, RegisterRequest } from './user.model'
import { Validation } from '../../middleware/validation'
import { UserValidation } from './user.validation'
import { UserService } from './user.service'
import { ResponseHandler } from '../../utils/response-handler'
import { SUCCESS_MESSAGES } from '../../utils/success-messages'
import { UserRequest } from '../../types/user-request'

export class UserController {
  static async register(req: Request, res: Response, next: NextFunction) {
    try {
      const request: RegisterRequest = req.body as RegisterRequest
      const createRequest = Validation.validate<RegisterRequest>(UserValidation.CREATE, request)
      const response = await UserService.register(createRequest)
      return ResponseHandler.success(res, response, SUCCESS_MESSAGES.CREATED.USER)
    } catch (err) {
      next(err)
    }
  }

  static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const request: LoginRequest = req.body as LoginRequest
      const loginRequest = Validation.validate<LoginRequest>(UserValidation.LOGIN, request)
      const response = await UserService.login(loginRequest)
      return ResponseHandler.success(res, response, SUCCESS_MESSAGES.LOGIN.USER)
    } catch (err) {
      next(err)
    }
  }

  static async getAllUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const users = await UserService.getAllUsers()
      return ResponseHandler.success(res, users)
    } catch (err) {
      next(err)
    }
  }

  static async getUserDetail(req: Request, res: Response, next: NextFunction) {
    try {
      const params = UserValidation.DETAIL_USER.parse(req.params)
      const result = await UserService.getUserDetail(params)

      return ResponseHandler.success(res, result, SUCCESS_MESSAGES.FETCHED.USER)
    } catch (err) {
      next(err)
    }
  }

  static async logout(req: UserRequest, res: Response, next: NextFunction) {
    try {
      console.log(req.user);
      
      const result = await UserService.logout(req)
      // console.log(result);
      
      return ResponseHandler.success(res, result, SUCCESS_MESSAGES.LOGOUT.USER)
    } catch (err) {
      next(err)
    }
  }

}
