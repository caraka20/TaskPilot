import { AppError } from "../../middleware/app-error"
import { ERROR_CODE } from "../../utils/error-codes"
import { AddCourseRequest, ConflictCustomerEntry, ConflictGroupResponse } from "./tuton.model"
import { TutonRepository } from "./tuton.repository"
import { toTutonCourseResponse, TutonCourseResponse } from "./tuton.model"

export class TutonService {
  static async addCourse(customerId: number, payload: AddCourseRequest): Promise<TutonCourseResponse> {
    const customer = await TutonRepository.findCustomerById(customerId)
    if (!customer) throw AppError.fromCode(ERROR_CODE.NOT_FOUND, "Customer tidak ditemukan")

    // Cegah duplikasi matkul untuk customer yang sama
    const existing = await TutonRepository.findCourseByCustomerAndMatkul(customerId, payload.matkul)
    if (existing) {
      throw AppError.fromCode(ERROR_CODE.BAD_REQUEST, "Matkul sudah terdaftar untuk customer ini")
    }

    // Buat course
    const course = await TutonRepository.createCourse(customerId, payload.matkul)

    // Generate default 19 item (kecuali dimatikan)
    const shouldGenerate = payload.generateItems !== false
    let total = course.totalItems
    if (shouldGenerate) {
      const created = await TutonRepository.createItemsForCourse(course.id)
      // pastikan totalItems sinkron (walau schema punya default 19)
      const updated = await TutonRepository.updateCourseTotals(course.id, created, 0)
      return toTutonCourseResponse(updated)
    }

    // kalau tidak generate, pastikan totalItems=0 agar akurat
    if (total !== 0) {
      const updated = await TutonRepository.updateCourseTotals(course.id, 0, 0)
      return toTutonCourseResponse(updated)
    }

    return toTutonCourseResponse(course)
  }

  static async deleteCourse(courseId: number): Promise<{ deleted: true }> {
    const found = await TutonRepository.findCourseById(courseId)
    if (!found) throw AppError.fromCode(ERROR_CODE.NOT_FOUND, "Course tidak ditemukan")

    await TutonRepository.deleteCourse(courseId)
    return { deleted: true }
  }

  static async getConflicts(): Promise<ConflictGroupResponse[]> {
    const rows = await TutonRepository.listAllCoursesWithCustomerMinimal()

    // group by matkul
    const map = new Map<string, ConflictCustomerEntry[]>()

    for (const r of rows) {
      const list = map.get(r.matkul) ?? []
      list.push({
        courseId: r.id,
        customerId: r.customer.id,
        namaCustomer: r.customer.namaCustomer,
        createdAt: r.createdAt,
        isDuplicate: false,
      })
      map.set(r.matkul, list)
    }

    const result: ConflictGroupResponse[] = []
    for (const [matkul, customers] of map.entries()) {
      if (customers.length > 1) {
        customers.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
        customers.forEach((c, i) => (c.isDuplicate = i > 0))
        result.push({ matkul, total: customers.length, customers })
      }
    }
    return result
  }

  static async getConflictByMatkul(matkul: string): Promise<ConflictGroupResponse> {
    const rows = await TutonRepository.listCoursesByMatkul(matkul)

    if (rows.length === 0) {
      throw AppError.fromCode(ERROR_CODE.NOT_FOUND, "Matkul tidak ditemukan atau tidak ada konflik")
    }

    const customers: ConflictCustomerEntry[] = rows
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
      .map((r, idx) => ({
        courseId: r.id,
        customerId: r.customer.id,
        namaCustomer: r.customer.namaCustomer,
        createdAt: r.createdAt,
        isDuplicate: idx > 0,
      }))

    if (customers.length <= 1) {
      throw AppError.fromCode(ERROR_CODE.NOT_FOUND, "Belum ada duplikasi untuk matkul ini")
    }

    return { matkul, total: customers.length, customers }
  }

  static async summary(courseId: number) {
    const exists = await TutonRepository.exists(courseId)
    if (!exists) throw AppError.fromCode(ERROR_CODE.NOT_FOUND, "Course not found")

    return TutonRepository.getSummary(courseId)
  }
}
