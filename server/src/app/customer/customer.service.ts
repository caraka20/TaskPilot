import { JenisTugas, StatusTugas } from "../../generated/prisma"
import { AppError } from "../../middleware/app-error"
import { ERROR_CODE } from "../../utils/error-codes"
import {
  CreateCustomerRequest,
  UpdatePaymentRequest,
  toCustomerResponse,
  toCustomerDetailResponse,
  TutonCourseSummary,
  TutonJenisBreakdown,
  CustomerTutonSummaryResponse,
  CustomerListQuery,
  Paginated,
  CustomerListItem,
  toCustomerListItem,
  CustomerDetailResponse,
} from "./customer.model"
import { CustomerRepository } from "./customer.repository"

export class CustomerService {
  static async create(payload: CreateCustomerRequest) {
    // pastikan NIM unik
    const existing = await CustomerRepository.findByNim(payload.nim)
    if (existing) throw AppError.fromCode(ERROR_CODE.BAD_REQUEST, "NIM sudah terdaftar")

    // simpan password apa adanya (sesuai kebutuhan login e-learning UT)
    const created = await CustomerRepository.create({
      namaCustomer: payload.namaCustomer,
      noWa: payload.noWa,
      nim: payload.nim,
      password: payload.password, // <-- TANPA HASH
      jurusan: payload.jurusan,
      jenis: payload.jenis,
      totalBayar: payload.totalBayar,
      sudahBayar: payload.sudahBayar,
    })

    return toCustomerResponse(created)
  }

  static async detail(id: number): Promise<CustomerDetailResponse> {
    const row = await CustomerRepository.findDetailById(id)
    if (!row) throw AppError.fromCode(ERROR_CODE.NOT_FOUND)
    return toCustomerDetailResponse(row) // berisi password
  }


  static async addPayment(
    id: number,
    payload: { amount: number; catatan?: string; tanggalBayar?: Date }
  ) {
    const updated = await CustomerRepository.addPayment({
      customerId: id,
      amount: payload.amount,
      catatan: payload.catatan,
      tanggalBayar: payload.tanggalBayar,
    })
    if (!updated) throw AppError.fromCode(ERROR_CODE.NOT_FOUND, 'Customer tidak ditemukan')
    return updated
  }

  // OWNER: update total tagihan
  static async updateInvoiceTotal(id: number, totalBayar: number) {
    try {
      const updated = await CustomerRepository.updateInvoiceTotal(id, totalBayar)
      if (!updated) throw AppError.fromCode(ERROR_CODE.NOT_FOUND, 'Customer tidak ditemukan')
      return updated
    } catch (e: any) {
      if (e?.message === 'TOTAL_LESS_THAN_PAID') {
        throw AppError.fromCode(
          ERROR_CODE.BAD_REQUEST,
          'totalBayar tidak boleh lebih kecil dari jumlah pembayaran yang sudah tercatat'
        )
      }
      throw e
    }
  }

  // OWNER/USER (opsional: jika mau izinkan USER melihat historinya sendiri)
  static async listPayments(customerId: number, query: {
    page: number; limit: number; sortDir: 'asc'|'desc'; start?: Date; end?: Date
  }) {
    const customer = await CustomerRepository.findById(customerId)
    if (!customer) throw AppError.fromCode(ERROR_CODE.NOT_FOUND, 'Customer tidak ditemukan')
    return CustomerRepository.listPayments(customerId, query)
  }

  static async remove(id: number) {
    const existing = await CustomerRepository.findById(id)
    if (!existing) throw AppError.fromCode(ERROR_CODE.NOT_FOUND, "Customer tidak ditemukan")

    await CustomerRepository.remove(id)
    return { deleted: true }
  }

  static async getTutonSummary(customerId: number): Promise<CustomerTutonSummaryResponse> {
    const customer = await CustomerRepository.getByIdBasic(customerId)
    if (!customer) throw AppError.fromCode(ERROR_CODE.NOT_FOUND, "Customer tidak ditemukan")

    const courses = await CustomerRepository.listTutonCoursesByCustomer(customerId)
    const courseIds = courses.map(c => c.id)
    const items = await CustomerRepository.listItemsForCourses(courseIds)

    // index items by courseId
    const byCourse = new Map<number, typeof items>()
    for (const it of items) {
      const list = byCourse.get(it.courseId) ?? []
      list.push(it)
      byCourse.set(it.courseId, list)
    }

    // helper hitung breakdown untuk satu course
    const buildBreakdown = (courseId: number) => {
      const list = byCourse.get(courseId) ?? []

      const make = (jenis: JenisTugas, withAvg = false): TutonJenisBreakdown => {
        const subset = list.filter(i => i.jenis === jenis)
        const total = subset.length
        const selesai = subset.filter(i => i.status === StatusTugas.SELESAI).length
        const belum = total - selesai
        let nilaiAvg: number | null | undefined = undefined
        if (withAvg) {
          const vals = subset.map(i => i.nilai).filter((v): v is number => typeof v === "number")
          nilaiAvg = vals.length ? parseFloat((vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(2)) : null
        }
        return withAvg ? { total, selesai, belum, nilaiAvg } : { total, selesai, belum }
      }

      return {
        DISKUSI: make(JenisTugas.DISKUSI, true),
        ABSEN: make(JenisTugas.ABSEN, false),
        TUGAS: make(JenisTugas.TUGAS, true),
      }
    }

    // bentuk per-course summary
    const courseSummaries: TutonCourseSummary[] = courses.map(c => {
      const breakdown = buildBreakdown(c.id)
      const totalItems = c.totalItems ?? (breakdown.DISKUSI.total + breakdown.ABSEN.total + breakdown.TUGAS.total)
      const completedItems = c.completedItems ?? (breakdown.DISKUSI.selesai + breakdown.ABSEN.selesai + breakdown.TUGAS.selesai)
      const progress = totalItems > 0 ? parseFloat((completedItems / totalItems).toFixed(4)) : 0

      return {
        courseId: c.id,
        matkul: c.matkul,
        totalItems,
        completedItems,
        progress,
        breakdown,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
      }
    })

    // header summary
    const totalCourses = courseSummaries.length
    const totalItems = courseSummaries.reduce((a, b) => a + b.totalItems, 0)
    const totalCompleted = courseSummaries.reduce((a, b) => a + b.completedItems, 0)
    const overallProgress = totalItems > 0 ? parseFloat((totalCompleted / totalItems).toFixed(4)) : 0

    return {
      customerId: customer.id,
      namaCustomer: customer.namaCustomer,
      totalCourses,
      totalItems,
      totalCompleted,
      overallProgress,
      courses: courseSummaries,
    }
  }

  static async list(query: CustomerListQuery): Promise<Paginated<CustomerListItem>> {
    const { rows, total } = await CustomerRepository.list(query)
    const items = rows.map(toCustomerListItem)
    const totalPages = Math.max(1, Math.ceil(total / query.limit))
    return { items, pagination: { page: query.page, limit: query.limit, total, totalPages } }
  }

}
