import { AppError } from "../../middleware/app-error"
import { ERROR_CODE } from "../../utils/error-codes"
import { prismaClient } from "../../config/database"
import { JenisTugas, StatusTugas } from "../../generated/prisma"
import { TutonCourseRepository, TutonItemRepository } from "./tuton-item.repository"
import {
  BulkNilaiRequest, BulkResult, BulkStatusRequest,
  InitItemsRequest, InitItemsResponse,
  toTutonItemResponse, TutonItemResponse,
  UpdateNilaiRequest, UpdateStatusRequest, UpdateTutonItemRequest, UpdateCopasRequest,
} from "./tuton-item.model"

export class TutonItemService {
  static async listByCourse(courseId: number): Promise<TutonItemResponse[]> {
    const course = await TutonItemRepository.getCourseById(courseId)
    if (!course) throw AppError.fromCode(ERROR_CODE.NOT_FOUND, "Course tidak ditemukan")
    const items = await TutonItemRepository.listByCourse(courseId)
    return items.map(toTutonItemResponse)
  }


  static async update(itemId: number, payload: UpdateTutonItemRequest): Promise<TutonItemResponse> {
    const item = await TutonItemRepository.getItemById(itemId)
    if (!item) throw AppError.fromCode(ERROR_CODE.NOT_FOUND, "Item tidak ditemukan")

    if (payload.hasOwnProperty("nilai") && item.jenis === JenisTugas.ABSEN) {
      throw AppError.fromCode(ERROR_CODE.BAD_REQUEST, "ABSEN tidak memiliki nilai")
    }
    if (payload.hasOwnProperty("copas") && item.jenis === JenisTugas.ABSEN) {
      throw AppError.fromCode(ERROR_CODE.BAD_REQUEST, "ABSEN tidak memiliki copas soal")
    }

    const data: any = {}
    if (typeof payload.deskripsi !== "undefined") data.deskripsi = payload.deskripsi
    if (typeof payload.nilai !== "undefined")      data.nilai     = payload.nilai
    if (typeof payload.copas !== "undefined")      data.copasSoal = payload.copas

    // Atur status + “cap selesai”
    if (typeof payload.status !== "undefined") {
      if (payload.status === StatusTugas.SELESAI) {
        data.status = StatusTugas.SELESAI
        data.selesaiAt = new Date()
      } else {
        data.status = StatusTugas.BELUM
        data.selesaiAt = null               // NEW: clear penanda selesai saat revert
      }
    }

    const updated = await prismaClient.$transaction(async (tx) => {
      const updatedItem = await tx.tutonItem.update({ where: { id: itemId }, data })

      // Recalc progress course bila status berubah
      if (typeof payload.status !== "undefined") {
        const completedCount = await tx.tutonItem.count({
          where: { courseId: updatedItem.courseId, status: StatusTugas.SELESAI },
        })
        await tx.tutonCourse.update({ where: { id: updatedItem.courseId }, data: { completedItems: completedCount } })
      }
      return updatedItem
    })

    return toTutonItemResponse(updated)
  }

  static async updateStatus(itemId: number, payload: UpdateStatusRequest) {
    return this.update(itemId, { status: payload.status })
  }

  static async updateNilai(itemId: number, payload: UpdateNilaiRequest) {
    const item = await TutonItemRepository.getItemById(itemId)
    if (!item) throw AppError.fromCode(ERROR_CODE.NOT_FOUND, "Item tidak ditemukan")
    if (item.jenis === JenisTugas.ABSEN) {
      throw AppError.fromCode(ERROR_CODE.BAD_REQUEST, "ABSEN tidak memiliki nilai")
    }
    return this.update(itemId, { nilai: payload.nilai })
  }

  static async updateCopas(itemId: number, payload: UpdateCopasRequest) {
    const item = await TutonItemRepository.getItemById(itemId)
    if (!item) throw AppError.fromCode(ERROR_CODE.NOT_FOUND, "Item tidak ditemukan")
    if (item.jenis === JenisTugas.ABSEN) {
      throw AppError.fromCode(ERROR_CODE.BAD_REQUEST, "ABSEN tidak memiliki copas soal")
    }
    const updated = await TutonItemRepository.updateItem(itemId, { copasSoal: payload.copas })
    return toTutonItemResponse(updated)
  }

  static async initForCourse(courseId: number, payload: InitItemsRequest): Promise<InitItemsResponse> {
    const course = await TutonCourseRepository.ensureExists(courseId)
    if (!course) throw AppError.fromCode(ERROR_CODE.NOT_FOUND)
    const existing = await TutonItemRepository.countByCourse(courseId)

    let created = false
    if (existing === 0 || payload.overwrite) {
      if (existing > 0) await TutonItemRepository.deleteByCourse(courseId)
      const total = await TutonItemRepository.createDefaults(courseId)
      await TutonCourseRepository.touchTotals(courseId, total)
      await TutonCourseRepository.recalcCompletedItems(courseId)
      created = true
    }

    const after = await TutonCourseRepository.ensureExists(courseId)
    return {
      courseId,
      created,
      totalItems: after?.totalItems ?? 0,
      completedItems: after?.completedItems ?? 0,
    }
  }

  static async bulkUpdateNilai(courseId: number, payload: BulkNilaiRequest): Promise<BulkResult> {
    const course = await TutonItemRepository.getCourseById(courseId)
    if (!course) throw AppError.fromCode(ERROR_CODE.NOT_FOUND, "Course not found")
    if (!payload.items?.length) throw AppError.fromCode(ERROR_CODE.BAD_REQUEST, "items wajib diisi")

    const ids = payload.items.map(i => i.itemId)
    const owned = await TutonItemRepository.findByIdsForCourseWithJenis(courseId, ids)
    if (owned.length !== ids.length) {
      throw AppError.fromCode(ERROR_CODE.BAD_REQUEST, "Beberapa item bukan milik course yang dimaksud")
    }

    const absenIds = owned.filter(o => o.jenis === "ABSEN").map(o => o.id)
    if (absenIds.length) {
      throw AppError.fromCode(ERROR_CODE.BAD_REQUEST, `ABSEN tidak memiliki nilai (itemId: ${absenIds.join(", ")})`)
    }

    await TutonItemRepository.bulkUpdateNilaiTx(payload.items)
    await TutonItemRepository.recalcCourseCompleted(courseId)
    return { updated: ids.length }
  }

  static async bulkUpdateStatus(courseId: number, payload: BulkStatusRequest): Promise<BulkResult> {
    const course = await TutonItemRepository.getCourseById(courseId)
    if (!course) throw AppError.fromCode(ERROR_CODE.NOT_FOUND)
    if (!payload.items?.length) throw AppError.fromCode(ERROR_CODE.BAD_REQUEST, "items wajib diisi")

    const ids = payload.items.map(i => i.itemId)
    const owned = await TutonItemRepository.findByIdsForCourse(courseId, ids)
    if (owned.length !== ids.length) {
      throw AppError.fromCode(ERROR_CODE.BAD_REQUEST, "Beberapa item bukan milik course yang dimaksud")
    }

    // Update status + selesaiAt (di TX)
    await TutonItemRepository.bulkUpdateStatusTx(payload.items)

    // NEW: ekstra aman — bersihkan selesaiAt untuk semua yang di-set ke BELUM (idempotent)
    const revertedIds = payload.items.filter(i => i.status === StatusTugas.BELUM).map(i => i.itemId)
    if (revertedIds.length) await TutonItemRepository.clearCompletionMarksBulk(revertedIds)

    // Recalc progress course biar konsisten di FE
    await TutonItemRepository.recalcCourseCompleted(courseId)
    return { updated: ids.length }
  }
  
}
