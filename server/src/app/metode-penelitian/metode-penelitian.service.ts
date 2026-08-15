import { AppError } from "../../middleware/app-error"
import { ERROR_CODE } from "../../utils/error-codes"
import { mapMetodePenelitian, type MetodePenelitianListQuery } from "./metode-penelitian.model"
import { MetodePenelitianRepository, type UpsertMetodePenelitianInput } from "./metode-penelitian.repository"

export class MetodePenelitianService {
  static async upsert(customerId: number, payload: Omit<UpsertMetodePenelitianInput, "customerId">) {
    const customer = await MetodePenelitianRepository.findCustomerById(customerId)
    if (!customer) throw AppError.fromCode(ERROR_CODE.NOT_FOUND, "Customer tidak ditemukan")
    if (!customer.layananMetodePenelitian) {
      throw AppError.fromCode(ERROR_CODE.BAD_REQUEST, "Layanan Metode Penelitian belum diaktifkan untuk customer ini")
    }
    await MetodePenelitianRepository.upsert({ customerId, ...payload })
    const saved = await MetodePenelitianRepository.detail(customerId)
    if (!saved) {
      throw AppError.fromCode(ERROR_CODE.INTERNAL_SERVER_ERROR, "Data Metode Penelitian gagal dimuat setelah disimpan")
    }
    return mapMetodePenelitian(saved)
  }

  static async detail(customerId: number) {
    const row = await MetodePenelitianRepository.detail(customerId)
    if (!row?.metodePenelitian) throw AppError.fromCode(ERROR_CODE.NOT_FOUND, "Detail Metode Penelitian tidak ditemukan")
    return mapMetodePenelitian(row)
  }

  static async list(query: MetodePenelitianListQuery) {
    const { rows, total } = await MetodePenelitianRepository.list(query)
    return {
      items: rows.map(mapMetodePenelitian),
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / query.limit)),
      },
    }
  }
}
