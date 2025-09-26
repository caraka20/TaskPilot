// server/src/modules/customer/customer.service.ts
import { JenisTugas, StatusTugas } from "../../generated/prisma";
import { AppError } from "../../middleware/app-error";
import { ERROR_CODE } from "../../utils/error-codes";
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
  PublicCourseView,
  PublicItemView,
  PublicCustomerSelfViewResponse,
  UpdateCustomerRequest,
  CustomerListResponse,
} from "./customer.model";
import { CustomerRepository } from "./customer.repository";

export class CustomerService {
  /* ===================== Create / Update / Delete ===================== */

  static async create(payload: CreateCustomerRequest) {
    // Pastikan NIM unik
    const existing = await CustomerRepository.findByNim(payload.nim);
    if (existing) throw AppError.fromCode(ERROR_CODE.BAD_REQUEST, "NIM sudah terdaftar");

    // Simpan password apa adanya (plain) sesuai kebutuhan login e-learning UT
    const created = await CustomerRepository.createWithInitialPayment({
      namaCustomer: payload.namaCustomer,
      noWa: payload.noWa,
      nim: payload.nim,
      password: payload.password, // plain sesuai kebutuhan
      jurusan: payload.jurusan,
      jenis: payload.jenis,
      totalBayar: payload.totalBayar,
      sudahBayar: payload.sudahBayar,
    });

    return toCustomerResponse(created);

  }

  static async update(id: number, payload: UpdateCustomerRequest) {
    const existing = await CustomerRepository.findById(id);
    if (!existing) throw AppError.fromCode(ERROR_CODE.NOT_FOUND, "Customer tidak ditemukan");

    // Jika NIM mau diubah, pastikan unik
    if (payload.nim && payload.nim !== existing.nim) {
      const dup = await CustomerRepository.findByNim(payload.nim);
      if (dup) throw AppError.fromCode(ERROR_CODE.BAD_REQUEST, "NIM sudah terdaftar");
    }

    // Password tetap disimpan apa adanya (plain)
    const updated = await CustomerRepository.updateBasic(id, {
      namaCustomer: payload.namaCustomer,
      noWa: payload.noWa,
      nim: payload.nim,
      password: payload.password,
      jurusan: payload.jurusan,
      jenis: payload.jenis,
    });

    return toCustomerResponse(updated);
  }

  static async remove(id: number) {
    const existing = await CustomerRepository.findById(id);
    if (!existing) throw AppError.fromCode(ERROR_CODE.NOT_FOUND, "Customer tidak ditemukan");

    await CustomerRepository.remove(id);
    return { deleted: true };
  }

  /* ===================== Detail / Payments ===================== */

  static async detail(id: number): Promise<CustomerDetailResponse> {
    const row = await CustomerRepository.findDetailById(id);
    if (!row) throw AppError.fromCode(ERROR_CODE.NOT_FOUND);
    return toCustomerDetailResponse(row); // berisi password
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
    });
    if (!updated) throw AppError.fromCode(ERROR_CODE.NOT_FOUND, "Customer tidak ditemukan");
    return updated;
  }

  // OWNER: update total tagihan
  static async updateInvoiceTotal(id: number, totalBayar: number) {
    try {
      const updated = await CustomerRepository.updateInvoiceTotal(id, totalBayar);
      if (!updated) throw AppError.fromCode(ERROR_CODE.NOT_FOUND, "Customer tidak ditemukan");
      return updated;
    } catch (e: any) {
      if (e?.message === "TOTAL_LESS_THAN_PAID") {
        throw AppError.fromCode(
          ERROR_CODE.BAD_REQUEST,
          "totalBayar tidak boleh lebih kecil dari jumlah pembayaran yang sudah tercatat",
        );
      }
      throw e;
    }
  }

  // OWNER/USER (opsional kalau mau izinkan USER melihat historinya sendiri)
  static async listPayments(
    customerId: number,
    query: { page: number; limit: number; sortDir: "asc" | "desc"; start?: Date; end?: Date },
  ) {
    const customer = await CustomerRepository.findById(customerId);
    if (!customer) throw AppError.fromCode(ERROR_CODE.NOT_FOUND, "Customer tidak ditemukan");
    return CustomerRepository.listPayments(customerId, query);
  }

  /* ===================== Listing ===================== */

  static async list(query: CustomerListQuery): Promise<Paginated<CustomerListItem> & {
    totalsGlobal: { totalBayar: number; sudahBayar: number; sisaBayar: number };
    countNoMKGlobal: number;
    totalCustomers: number;
  }> {
    const { rows, total, totalsGlobal, countNoMKGlobal, totalCustomers } = await CustomerRepository.list(query);
    const items = rows.map(toCustomerListItem);
    const totalPages = Math.max(1, Math.ceil(total / query.limit));
    return {
      items,
      pagination: { page: query.page, limit: query.limit, total, totalPages },
      // ➕ forward agregat global
      totalsGlobal,
      countNoMKGlobal,
      totalCustomers,
    };
  }


  /* ===================== TUTON: Owner summary ===================== */

  static async getTutonSummary(customerId: number): Promise<CustomerTutonSummaryResponse> {
    const customer = await CustomerRepository.getByIdBasic(customerId);
    if (!customer) throw AppError.fromCode(ERROR_CODE.NOT_FOUND, "Customer tidak ditemukan");

    const courses = await CustomerRepository.listTutonCoursesByCustomer(customerId);
    const courseIds = courses.map((c) => c.id);
    const items = await CustomerRepository.listItemsForCourses(courseIds);

    // Index items by courseId
    const byCourse = new Map<number, typeof items>();
    for (const it of items) {
      const list = byCourse.get(it.courseId) ?? [];
      list.push(it);
      byCourse.set(it.courseId, list);
    }

    // Helper: breakdown per course
    const buildBreakdown = (courseId: number) => {
      const list = byCourse.get(courseId) ?? [];

      const make = (jenis: JenisTugas, withAvg = false): TutonJenisBreakdown => {
        const subset = list.filter((i) => i.jenis === jenis);
        const total = subset.length;
        const selesai = subset.filter((i) => i.status === StatusTugas.SELESAI).length;
        const belum = total - selesai;
        let nilaiAvg: number | null | undefined = undefined;
        if (withAvg) {
          const vals = subset.map((i) => i.nilai).filter((v): v is number => typeof v === "number");
          nilaiAvg = vals.length ? parseFloat((vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(2)) : null;
        }
        return withAvg ? { total, selesai, belum, nilaiAvg } : { total, selesai, belum };
      };

      return {
        DISKUSI: make(JenisTugas.DISKUSI, true),
        ABSEN: make(JenisTugas.ABSEN, false),
        TUGAS: make(JenisTugas.TUGAS, true),
      };
    };

    // Bentuk per-course summary
    const courseSummaries: TutonCourseSummary[] = courses.map((c) => {
      const breakdown = buildBreakdown(c.id);
      const totalItems =
        c.totalItems ?? breakdown.DISKUSI.total + breakdown.ABSEN.total + breakdown.TUGAS.total;
      const completedItems =
        c.completedItems ??
        breakdown.DISKUSI.selesai + breakdown.ABSEN.selesai + breakdown.TUGAS.selesai;
      const progress = totalItems > 0 ? parseFloat((completedItems / totalItems).toFixed(4)) : 0;

      return {
        courseId: c.id,
        matkul: c.matkul,
        totalItems,
        completedItems,
        progress,
        breakdown,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
      };
    });

    // Header summary
    const totalCourses = courseSummaries.length;
    const totalItems = courseSummaries.reduce((a, b) => a + b.totalItems, 0);
    const totalCompleted = courseSummaries.reduce((a, b) => a + b.completedItems, 0);
    const overallProgress = totalItems > 0 ? parseFloat((totalCompleted / totalItems).toFixed(4)) : 0;

    return {
      customerId: customer.id,
      namaCustomer: customer.namaCustomer,
      totalCourses,
      totalItems,
      totalCompleted,
      overallProgress,
      courses: courseSummaries,
    };
  }

  /* ===================== PUBLIC: Self view by NIM ===================== */

  /**
   * Endpoint publik (tanpa auth) untuk melihat progress diri sendiri.
   * PERBAIKAN:
   *  - Normalisasi sesi TUGAS: 3→1, 5→2, 7→3 agar kolom T1/T2/T3 tampil sinkron di FE publik.
   *  - Hanya field non-sensitif.
   */
  static async publicSelfViewByNim(nim: string): Promise<PublicCustomerSelfViewResponse> {
    const cust = await CustomerRepository.findByNimBasic(nim);
    if (!cust) throw AppError.fromCode(ERROR_CODE.NOT_FOUND, "Customer tidak ditemukan");

    const courses = await CustomerRepository.listCoursesByCustomer(cust.id);
    const courseIds = courses.map((c) => c.id);
    const items = await CustomerRepository.listFilteredItemsForCourses(courseIds);

    // Index items per course
    const map = new Map<number, typeof items>();
    for (const it of items) {
      const arr = map.get(it.courseId) ?? [];
      arr.push(it);
      map.set(it.courseId, arr);
    }

    // ⬇️ Normalisasi sesi tugas untuk publik: D3/D5/D7 → T1/T2/T3
    const toPublicItem = (x: any): PublicItemView => {
      const normTugasSesi = (s: number) => (s === 3 ? 1 : s === 5 ? 2 : s === 7 ? 3 : s);
      return {
        jenis: x.jenis,
        sesi: x.jenis === "TUGAS" ? normTugasSesi(x.sesi) : x.sesi,
        status: x.status,
        nilai: x.nilai ?? null,
        selesaiAt: x.selesaiAt ?? null,
        deskripsi: x.deskripsi ?? null,
        copasSoal: !!x.copasSoal,
      };
    };

    const courseViews = courses.map((c) => {
      const list = map.get(c.id) ?? [];
      const diskusi = list.filter((i) => i.jenis === "DISKUSI").map(toPublicItem);
      const tugas = list.filter((i) => i.jenis === "TUGAS").map(toPublicItem);
      const absen = list.filter((i) => i.jenis === "ABSEN").map(toPublicItem);

      const totalItems = c.totalItems ?? diskusi.length + tugas.length + absen.length;
      const completedItems =
        c.completedItems ??
        diskusi.filter((i) => i.status === StatusTugas.SELESAI).length +
          tugas.filter((i) => i.status === StatusTugas.SELESAI).length +
          absen.filter((i) => i.status === StatusTugas.SELESAI).length;
      const progress = totalItems > 0 ? parseFloat((completedItems / totalItems).toFixed(4)) : 0;

      return {
        courseId: c.id,
        matkul: c.matkul,
        items: { DISKUSI: diskusi, TUGAS: tugas, ABSEN: absen },
        totalItems,
        completedItems,
        progress,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
      } as PublicCourseView;
    });

    const totalCourses = courseViews.length;
    const totalItems = courseViews.reduce((a, b) => a + b.totalItems, 0);
    const totalCompleted = courseViews.reduce((a, b) => a + b.completedItems, 0);
    const overallProgress = totalItems > 0 ? parseFloat((totalCompleted / totalItems).toFixed(4)) : 0;

    return {
      nim: cust.nim,
      namaCustomer: cust.namaCustomer,
      jurusan: cust.jurusan,
      jenis: cust.jenis,
      totalCourses,
      totalItems,
      totalCompleted,
      overallProgress,
      courses: courseViews,
    };
  }
}
