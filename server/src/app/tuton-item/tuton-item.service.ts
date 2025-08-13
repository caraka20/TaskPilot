import { AppError } from "../../middleware/app-error"
import { ERROR_CODE } from "../../utils/error-codes"
import { prismaClient } from "../../config/database"
import { JenisTugas, StatusTugas } from "../../generated/prisma"
import { TutonCourseRepository, TutonItemRepository } from "./tuton-item.repository"
import {
    BulkNilaiRequest,
    BulkResult,
    BulkStatusRequest,
    CourseSummaryResponse,
  InitItemsRequest,
  InitItemsResponse,
  toTutonItemResponse,
  TutonItemResponse,
  UpdateNilaiRequest,
  UpdateStatusRequest,
  UpdateTutonItemRequest,
} from "./tuton-item.model"
import { TutonRepository } from "../tuton/tuton.repository"

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

    // nilai tidak boleh untuk ABSEN
    if (payload.hasOwnProperty("nilai") && item.jenis === JenisTugas.ABSEN) {
      throw AppError.fromCode(ERROR_CODE.BAD_REQUEST, "ABSEN tidak memiliki nilai")
    }

    const data: any = {}
    if (typeof payload.deskripsi !== "undefined") data.deskripsi = payload.deskripsi
    if (typeof payload.nilai !== "undefined") data.nilai = payload.nilai

    if (typeof payload.status !== "undefined") {
      if (payload.status === StatusTugas.SELESAI) {
        data.status = StatusTugas.SELESAI
        data.selesaiAt = new Date()
      } else if (payload.status === StatusTugas.BELUM) {
        data.status = StatusTugas.BELUM
        data.selesaiAt = null
      }
    }

    const updated = await prismaClient.$transaction(async (tx) => {
      const updatedItem = await tx.tutonItem.update({
        where: { id: itemId },
        data,
      })

      const completedCount = await tx.tutonItem.count({
        where: { courseId: updatedItem.courseId, status: StatusTugas.SELESAI },
      })

      await tx.tutonCourse.update({
        where: { id: updatedItem.courseId },
        data: { completedItems: completedCount },
      })

      return updatedItem
    })

    return toTutonItemResponse(updated)
  }

  static async updateStatus(itemId: number, payload: UpdateStatusRequest): Promise<TutonItemResponse> {
    return this.update(itemId, { status: payload.status })
  }

  static async updateNilai(itemId: number, payload: UpdateNilaiRequest): Promise<TutonItemResponse> {
    const item = await TutonItemRepository.getItemById(itemId)
    if (!item) throw AppError.fromCode(ERROR_CODE.NOT_FOUND, "Item tidak ditemukan")
    if (item.jenis === JenisTugas.ABSEN) {
      throw AppError.fromCode(ERROR_CODE.BAD_REQUEST, "ABSEN tidak memiliki nilai")
    }
    return this.update(itemId, { nilai: payload.nilai })
  }

  static async initForCourse(courseId: number, payload: InitItemsRequest): Promise<InitItemsResponse> {
    const course = await TutonCourseRepository.ensureExists(courseId)
    if (!course) throw AppError.fromCode(ERROR_CODE.NOT_FOUND)

    const existing = await TutonItemRepository.countByCourse(courseId)

    let created = false
    if (existing === 0) {
      const total = await TutonItemRepository.createDefaults(courseId)
      await TutonCourseRepository.touchTotals(courseId, total)
      await TutonCourseRepository.recalcCompletedItems(courseId)
      created = true
    } else if (payload.overwrite) {
      await TutonItemRepository.deleteByCourse(courseId)
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
    // pastikan course ada
    const course = await TutonItemRepository.getCourseById(courseId)
    if (!course) throw AppError.fromCode(ERROR_CODE.NOT_FOUND, "Course not found")

    // payload minimal
    if (!payload.items || payload.items.length === 0) {
      throw AppError.fromCode(ERROR_CODE.BAD_REQUEST, "items wajib diisi")
    }
    // defensif (kalau belum divalidasi Zod)
    for (const it of payload.items) {
      if (it.nilai != null && (typeof it.nilai !== "number" || it.nilai < 0 || it.nilai > 100)) {
        throw AppError.fromCode(ERROR_CODE.BAD_REQUEST, "nilai harus 0..100")
      }
    }

    const ids = payload.items.map(i => i.itemId)

    // pastikan semua item milik course + ambil jenis
    const owned = await TutonItemRepository.findByIdsForCourseWithJenis(courseId, ids)
    if (owned.length !== ids.length) {
      throw AppError.fromCode(ERROR_CODE.BAD_REQUEST, "Beberapa item bukan milik course yang dimaksud")
    }

    // larang ABSEN diberi nilai
    const absenIds = owned.filter(o => o.jenis === JenisTugas.ABSEN).map(o => o.id)
    if (absenIds.length > 0) {
      throw AppError.fromCode(ERROR_CODE.BAD_REQUEST, `ABSEN tidak memiliki nilai (itemId: ${absenIds.join(", ")})`)
    }

    // update nilai (atomic)
    await TutonItemRepository.bulkUpdateNilaiTx(payload.items)

    // refresh progress (jumlah selesai) — nilai tidak mengubah completed, tapi aman
    await TutonItemRepository.recalcCourseCompleted(courseId)

    return { updated: ids.length }
  }

  static async bulkUpdateStatus(courseId: number, payload: BulkStatusRequest): Promise<BulkResult> {
    const course = await TutonItemRepository.getCourseById(courseId)
    if (!course) throw AppError.fromCode(ERROR_CODE.NOT_FOUND)

    if (!payload.items || payload.items.length === 0) {
      throw AppError.fromCode(ERROR_CODE.BAD_REQUEST, "items wajib diisi")
    }

    const ids = payload.items.map(i => i.itemId)

    // pastikan semua item milik course
    const owned = await TutonItemRepository.findByIdsForCourse(courseId, ids)
    if (owned.length !== ids.length) {
      throw AppError.fromCode(ERROR_CODE.BAD_REQUEST, "Beberapa item bukan milik course yang dimaksud")
    }

    // atomic update + selesaiAt
    await TutonItemRepository.bulkUpdateStatusTx(payload.items)

    // refresh completedItems
    await TutonItemRepository.recalcCourseCompleted(courseId)

    return { updated: ids.length }
  }
}

export class TutonSummaryService {
  static async getCourseSummary(courseId: number): Promise<CourseSummaryResponse> {
    const sum = await TutonCourseRepository.summary(courseId)
    if (!sum) throw AppError.fromCode(ERROR_CODE.NOT_FOUND)

    const { course, byJenis } = sum
    const progress = course.totalItems > 0 ? Math.round((course.completedItems / course.totalItems) * 10000) / 100 : 0

    return {
      courseId: course.id,
      matkul: course.matkul,
      totalItems: course.totalItems,
      completedItems: course.completedItems,
      progress,
      byJenis: {
        DISKUSI: { total: byJenis.DISKUSI.total, done: byJenis.DISKUSI.done, avgNilai: byJenis.DISKUSI.avgNilai },
        ABSEN:   { total: byJenis.ABSEN.total,   done: byJenis.ABSEN.done },
        TUGAS:   { total: byJenis.TUGAS.total,   done: byJenis.TUGAS.done, avgNilai: byJenis.TUGAS.avgNilai },
      },
      updatedAt: course.updatedAt,
    }
  }
}
