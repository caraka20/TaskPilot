import { AppError } from "../../middleware/app-error"
import { ERROR_CODE } from "../../utils/error-codes"
import { AddCourseRequest, ConflictCustomerEntry, ConflictGroupResponse } from "./tuton.model"
import { TutonRepository } from "./tuton.repository"
import { toTutonCourseResponse, TutonCourseResponse } from "./tuton.model"
import { JenisTugas, StatusTugas } from "../../generated/prisma"
import { TutonItemRepository } from "../tuton-item/tuton-item.repository" 
import type { ScanRow } from "../tuton-item/tuton-item.repository";

export class TutonService {
  // ===== Existing =====

  static async addCourse(customerId: number, payload: AddCourseRequest): Promise<TutonCourseResponse> {
    const customer = await TutonRepository.findCustomerById(customerId)
    if (!customer) throw AppError.fromCode(ERROR_CODE.NOT_FOUND, "Customer tidak ditemukan")

    const existing = await TutonRepository.findCourseByCustomerAndMatkul(customerId, payload.matkul)
    if (existing) throw AppError.fromCode(ERROR_CODE.BAD_REQUEST, "Matkul sudah terdaftar untuk customer ini")

    const course = await TutonRepository.createCourse(customerId, payload.matkul)

    const shouldGenerate = payload.generateItems !== false
    let total = course.totalItems
    if (shouldGenerate) {
      const created = await TutonRepository.createItemsForCourse(course.id)
      const updated = await TutonRepository.updateCourseTotals(course.id, created, 0)
      return toTutonCourseResponse(updated)
    }

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
    if (rows.length === 0) throw AppError.fromCode(ERROR_CODE.NOT_FOUND, "Matkul tidak ditemukan atau tidak ada konflik")

    const customers: ConflictCustomerEntry[] = rows
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
      .map((r, idx) => ({
        courseId: r.id,
        customerId: r.customer.id,
        namaCustomer: r.customer.namaCustomer,
        createdAt: r.createdAt,
        isDuplicate: idx > 0,
      }))

    if (customers.length <= 1) throw AppError.fromCode(ERROR_CODE.NOT_FOUND, "Belum ada duplikasi untuk matkul ini")

    return { matkul, total: customers.length, customers }
  }

  static async summary(courseId: number) {
    const sum = await TutonRepository.getSummary(courseId)
    if (!sum) throw AppError.fromCode(ERROR_CODE.NOT_FOUND, "Course not found")
    return sum
  }

  // ===== NEW =====

  static async listSubjects(q?: string): Promise<Array<{ matkul: string; totalCourses: number; isConflict: boolean }>> {
    const rows = await TutonRepository.groupCoursesByMatkul() // { matkul, total }
    const mapped = rows.map(r => ({
      matkul: r.matkul,
      totalCourses: r.total,
      isConflict: r.total > 1,
    }))
    if (!q) return mapped
    const needle = q.toLowerCase()
    return mapped.filter(s => s.matkul.toLowerCase().includes(needle))
  }

  static async scan(filters: {
    matkul?: string
    jenis?: JenisTugas
    sesi?: number
    status?: StatusTugas
    page?: number
    pageSize?: number
  }) {
    const status = filters.status ?? StatusTugas.BELUM
    const page = Math.max(1, filters.page ?? 1)
    const pageSize = Math.min(200, Math.max(1, filters.pageSize ?? 50))
    const skip = (page - 1) * pageSize
    const take = pageSize

    // ⬇️ cast hasil Promise.all jadi tuple tegas [ScanRow[], number]
    const [rows, total] = (await Promise.all([
      TutonItemRepository.scanByFilters({
        matkul: filters.matkul,
        jenis: filters.jenis,
        sesi:  filters.sesi,
        status,
        skip,
        take,
      }),
      TutonItemRepository.countScanByFilters({
        matkul: filters.matkul,
        jenis:  filters.jenis,
        sesi:   filters.sesi,
        status,
      }),
    ])) as [ScanRow[], number]

    const data = rows.map(r => ({
      itemId: r.id,
      courseId: r.courseId,
      customerId: r.course.customer.id,
      customerName: r.course.customer.namaCustomer,
      matkul: r.course.matkul,
      jenis: r.jenis,
      sesi: r.sesi,
      status: r.status,
    }))

    return {
      meta: { page, pageSize, total, hasNext: skip + data.length < total },
      filters: {
        matkul: filters.matkul ?? null,
        jenis:  filters.jenis ?? null,
        sesi:   typeof filters.sesi === "number" ? filters.sesi : null,
        status,
      },
      rows: data,
    }
  }

}
