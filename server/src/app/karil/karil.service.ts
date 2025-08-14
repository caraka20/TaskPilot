// src/app/karil/karil.service.ts
import { AppError } from "../../middleware/app-error"
import { ERROR_CODE } from "../../utils/error-codes"
import { KarilRepository, UpsertKarilDetailInput } from "./karil.repository"
import { JenisUT } from "../../generated/prisma"

export class KarilService {
  static async upsert(customerId: number, payload: Omit<UpsertKarilDetailInput, "customerId">) {
    const customer = await KarilRepository.findCustomerById(customerId)
    if (!customer) {
      throw AppError.fromCode(ERROR_CODE.NOT_FOUND, "Customer tidak ditemukan")
    }

    // Pastikan customer adalah peserta KARIL
    if (customer.jenis !== JenisUT.KARIL) {
      // Bisa BAD_REQUEST atau FORBIDDEN sesuai kebijakan
      throw AppError.fromCode(
        ERROR_CODE.BAD_REQUEST,
        "Customer ini bukan peserta KARIL"
      )
    }

    return KarilRepository.upsertByCustomerId({ customerId, ...payload })
  }
}
