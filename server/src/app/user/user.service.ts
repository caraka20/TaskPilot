import { LoginRequest, LoginResponse, RegisterRequest, toLoginResponse, toUserDetailResponse, toUserResponse, UserDetailRequest, UserDetailResponse, UserResponse } from './user.model'
import { UserRepository } from './user.repository'
import bcrypt from "bcrypt"
import { ERROR_CODE } from '../../utils/error-codes'
import { AppError } from '../../middleware/app-error'
import { generateToken } from '../../utils/jwt'


export class UserService {

    static async register (request : RegisterRequest) : Promise<UserResponse> {
      const hashPassword = await bcrypt.hash(request.password, 10)
      request.password = hashPassword
      const exiting = await UserRepository.findByUsername(request.username)
      if (exiting){
        throw AppError.fromCode(ERROR_CODE.USER_ALREADY_EXISTS)
      }
      const user = await UserRepository.create(request)
      return toUserResponse(user)
    }

    static async login(request: LoginRequest): Promise<LoginResponse> {
      const user = await UserRepository.findByUsername(request.username)
      if (!user) throw AppError.fromCode(ERROR_CODE.USER_NOT_FOUND)

      const isPasswordValid = await bcrypt.compare(request.password, user.password)
      if (!isPasswordValid) throw AppError.fromCode(ERROR_CODE.UNAUTHORIZED)

      const token = generateToken({username: user.username })
      return toLoginResponse(user, token)
    }

    static async getAllUsers(): Promise<UserResponse[]> {
      const users = await UserRepository.findAllUsers()
      return users.map(toUserResponse)
    }

    static async getUserDetail(request: UserDetailRequest): Promise<UserDetailResponse> {
      const user = await UserRepository.getUserDetail(request.username)

      if (!user) {
        throw AppError.fromCode(ERROR_CODE.USER_NOT_FOUND)
      }

      const response = toUserDetailResponse(user)
      return response
    }
    
}


