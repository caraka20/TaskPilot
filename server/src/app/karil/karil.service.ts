// src/app/karil/karil.service.ts
import { AppError } from "../../middleware/app-error"
import { ERROR_CODE } from "../../utils/error-codes"
import { KarilRepository, UpsertKarilDetailInput } from "./karil.repository"
import { JenisUT } from "../../generated/prisma"
import type { KarilListQuery, KarilListItem, Paginated } from "./karil.model"
import { mapRowToItem } from "./karil.model"

export class KarilService {
  static async upsert(
    customerId: number,
    payload: Omit<UpsertKarilDetailInput, "customerId">
  ) {
    const customer = await KarilRepository.findCustomerById(customerId);
    if (!customer) {
      throw AppError.fromCode(ERROR_CODE.NOT_FOUND, "Customer tidak ditemukan");
    }
    // izinkan KARIL atau TK
    const jenis = String(customer.jenis ?? "").trim().toUpperCase();
    if (jenis !== "KARIL" && jenis !== "TK") {
      throw AppError.fromCode(ERROR_CODE.BAD_REQUEST, "Customer ini bukan peserta KARIL/TK");
    }
    return KarilRepository.upsertByCustomerId({ customerId, ...payload });
  }


  static async getDetail(customerId: number): Promise<KarilListItem> {
    const row = await KarilRepository.detailByCustomerId(customerId)
    if (!row) throw AppError.fromCode(ERROR_CODE.NOT_FOUND, "Detail KARIL tidak ditemukan")
    return mapRowToItem(row)
  }

  static async listAll(query: KarilListQuery): Promise<Paginated<KarilListItem>> {
    const { rows, total } = await KarilRepository.listAll(query)
    const items = rows.map(mapRowToItem)
    const totalPages = Math.max(1, Math.ceil(total / query.limit))
    return { items, pagination: { page: query.page, limit: query.limit, total, totalPages } }
  }
}
