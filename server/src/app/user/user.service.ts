import {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  SetJedaOtomatisRequest,
  toLoginResponse,
  toUserDetailResponse,
  toUserResponse,
  UserDetailRequest,
  UserDetailResponse,
  UserResponse,
} from './user.model'
import { UserRepository } from './user.repository'
import bcrypt from 'bcrypt'
import { ERROR_CODE } from '../../utils/error-codes'
import { AppError } from '../../middleware/app-error'
import { generateToken } from '../../utils/jwt'
import { UserRequest } from '../../types/user-request'

export class UserService {
  static async register(request: RegisterRequest): Promise<UserResponse> {
    // Cek username unik
    const existing = await UserRepository.findByUsername(request.username)
    if (existing) {
      throw AppError.fromCode(ERROR_CODE.USER_ALREADY_EXISTS)
    }

    // Hash password untuk akun USER (ini beda dengan Customer yang plaintext)
    const hashPassword = await bcrypt.hash(request.password, 10)
    request.password = hashPassword

    const user = await UserRepository.create(request)
    return toUserResponse(user)
  }

  static async login(request: LoginRequest): Promise<LoginResponse> {
    const user = await UserRepository.findByUsername(request.username)
    if (!user) throw AppError.fromCode(ERROR_CODE.USER_NOT_FOUND)

    const isPasswordValid = await bcrypt.compare(request.password, user.password)
    if (!isPasswordValid) throw AppError.fromCode(ERROR_CODE.UNAUTHORIZED)

    const token = generateToken({ username: user.username })
    await UserRepository.login(user.username, token)

    return toLoginResponse(user, token)
  }

  static async getAllUsers(): Promise<UserResponse[]> {
    const users = await UserRepository.findAllUsers()
    return users.map(toUserResponse)
  }

static async getUserDetail(request: UserDetailRequest): Promise<UserDetailResponse> {
  const user = await UserRepository.getUserDetail(request.username)
  if (!user) throw AppError.fromCode(ERROR_CODE.USER_NOT_FOUND)

  return toUserDetailResponse(user)
}

  static async logout(userReq: UserRequest): Promise<{ loggedOut: true }> {
    await UserRepository.logout(userReq.user!)
    return { loggedOut: true }
  }

  static async setJedaOtomatis(username: string, payload: SetJedaOtomatisRequest) {
    const user = await UserRepository.findByUsername(username)
    if (!user) throw AppError.fromCode(ERROR_CODE.USER_NOT_FOUND)

    return UserRepository.updateJedaOtomatis(username, payload.aktif)
  }
}
