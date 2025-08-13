import { AppError } from "../../middleware/app-error"
import { ERROR_CODE } from "../../utils/error-codes"
import { KarilRepository, UpsertKarilDetailInput } from "./karil.repository"


export class KarilService {
  static async upsert(customerId: number, payload: Omit<UpsertKarilDetailInput, "customerId">) {
    const customer = await KarilRepository.findCustomerById(customerId)
    if (!customer) {
      throw AppError.fromCode(ERROR_CODE.NOT_FOUND, "Customer tidak ditemukan")
    }

    return KarilRepository.upsertByCustomerId({ customerId, ...payload })
  }
}
