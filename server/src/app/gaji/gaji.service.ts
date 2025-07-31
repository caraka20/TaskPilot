import { GajiRepository } from './gaji.repository'
import {
  CreateGajiRequest,
  GajiResponse,
  toGajiResponse
} from './gaji.model'
import { UserRepository } from '../user/user.repository'
import { AppError } from '../../middleware/app-error'
import { ERROR_CODE } from '../../utils/error-codes'

export class GajiService {

    static async createGaji(request: CreateGajiRequest): Promise<GajiResponse> {
        const exiting = await UserRepository.findByUsername(request.username)
            if (!exiting){
            throw AppError.fromCode(ERROR_CODE.USER_NOT_FOUND)
        }
        const response = await GajiRepository.create(request)
        return toGajiResponse(response)
    }

  // ✅ Ambil semua gaji
  static async getAllGaji(): Promise<GajiResponse[]> {
    const gajiList = await GajiRepository.findAll()
    return gajiList.map(toGajiResponse)
  }
  
}
