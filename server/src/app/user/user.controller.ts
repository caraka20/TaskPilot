import { Request, Response, NextFunction } from 'express'
import { LoginRequest, RegisterRequest, SetJedaOtomatisRequest } from './user.model'
import { Validation } from '../../middleware/validation'
import { UserValidation } from './user.validation'
import { UserService } from './user.service'
import { ResponseHandler } from '../../utils/response-handler'
import { SUCCESS_MESSAGES } from '../../utils/success-messages'
import { UserRequest } from '../../types/user-request'

export class UserController {
  static async register(req: Request, res: Response, next: NextFunction) {
    try {
      const request: RegisterRequest = await Validation.validate<RegisterRequest>(UserValidation.CREATE, req.body)
      const response = await UserService.register(request)
      return ResponseHandler.success(res, response, SUCCESS_MESSAGES.CREATED.USER)
    } catch (err) {
      next(err)
    }
  }

  static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const request: LoginRequest = await Validation.validate<LoginRequest>(UserValidation.LOGIN, req.body)
      const response = await UserService.login(request)
      return ResponseHandler.success(res, response, SUCCESS_MESSAGES.LOGIN.USER)
    } catch (err) {
      next(err)
    }
  }

  static async getAllUsers(_req: Request, res: Response, next: NextFunction) {
    try {
      const users = await UserService.getAllUsers()
      return ResponseHandler.success(res, users)
    } catch (err) {
      next(err)
    }
  }

  static async getUserDetail(req: Request, res: Response, next: NextFunction) {
    try {
      const params = await Validation.validate(UserValidation.DETAIL_USER, req.params as Record<string, any>)
      const result = await UserService.getUserDetail(params)

      // Back-compat untuk test lama: selalu sediakan 'tugas' sebagai array.
      const tugas =
        Array.isArray((result as any)?.tugas)
          ? (result as any).tugas
          : Array.isArray((result as any)?.tutonItems)
            ? (result as any).tutonItems
            : []

      const normalized = {
        ...result,
        tugas,
      }

      return ResponseHandler.success(res, normalized, SUCCESS_MESSAGES.FETCHED.USER)
    } catch (err) {
      next(err)
    }
  }

  static async logout(req: UserRequest, res: Response, next: NextFunction) {
    try {
      const result = await UserService.logout(req)
      return ResponseHandler.success(res, result, SUCCESS_MESSAGES.LOGOUT.USER)
    } catch (err) {
      next(err)
    }
  }

  static async setJedaOtomatisUser(req: Request, res: Response, next: NextFunction) {
    try {
      const { username } = req.params
      const payload = await Validation.validate<SetJedaOtomatisRequest>(UserValidation.SET_JEDA_OTOMATIS, req.body)
      const result = await UserService.setJedaOtomatis(username, payload)
      return ResponseHandler.success(res, result, SUCCESS_MESSAGES.UPDATED.JEDA_OTOMATIS)
    } catch (err) {
      next(err)
    }
  }
}
