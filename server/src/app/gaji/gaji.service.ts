import { prismaClient } from '../../config/database'
import { AppError } from '../../middleware/app-error'
import { ERROR_CODE, ERROR_DEFINITIONS } from '../../utils/error-codes'
import { getPagination } from '../../utils/pagination'
import { KonfigurasiService } from '../konfigurasi/konfigurasi.service'
import { JamKerjaRepository } from '../jam-kerja/jam-kerja.repository'
import { UserRepository } from '../user/user.repository'
import { GajiRepository } from './gaji.repository'
import {
  CreateGajiRequest,
  GajiMeSummary,
  GajiResponse,
  GetMyGajiInput,
  Paginated,
  UpdateGajiRequest,
  toGajiResponse,
} from './gaji.model'
import { Prisma } from '../../generated/prisma'

const round2 = (n: number) => Math.round(n * 100) / 100

export class GajiService {
  static async createGaji(request: CreateGajiRequest): Promise<GajiResponse> {
    const { username, jumlahBayar, catatan } = request
    if (!Number.isFinite(jumlahBayar) || jumlahBayar <= 0) {
      throw AppError.fromCode(ERROR_CODE.BAD_REQUEST, 'Jumlah bayar harus > 0')
    }

    // Transaksi: validasi sisa berbasis (totalJam SELESAI × rate efektif) - total dibayar
    const created = await prismaClient.$transaction(async (tx) => {
      const user = await GajiRepository.findUserByUsername(tx, username)
      if (!user) throw AppError.fromCode(ERROR_CODE.USER_NOT_FOUND)

      // rate efektif (override > global)
      const eff = await KonfigurasiService.getEffective(username)
      const gajiPerJam = eff?.effective?.gajiPerJam ?? 0

      // total jam selesai (all-time) — pakai repo jam kerja (non-tx; konsisten cukup)
      const totalJam = await JamKerjaRepository.sumTotalJamAll(username)
      const upahKeseluruhan = totalJam * gajiPerJam

      // total yang sudah dibayar (tx)
      const totalPaid = await GajiRepository.sumPaidByUsernameTx(tx, username)

      const remaining = round2(Math.max(0, upahKeseluruhan - totalPaid))
      const EPS = 1e-9
      if (jumlahBayar - remaining > EPS) {
        throw AppError.fromCode(
          ERROR_CODE.GAJI_EXCEEDS_REMAINING,
          `${ERROR_DEFINITIONS.GAJI_EXCEEDS_REMAINING.message}. Sisa saat ini: ${remaining}`
        )
      }

      const row = await GajiRepository.createTx(tx, {
        username,
        jumlahBayar,
        catatan: catatan ?? null,
      })
      return row
    })

    return toGajiResponse(created)
  }

  /* ================= LIST OWNER ================= */
  static async getAllGaji(query: any): Promise<{ page: number; total: number; perPage: number; data: GajiResponse[] }> {
    const where = (await import('./gaji.model')).GajiModel.buildWhere(query)
    const { page, limit, skip } = getPagination(query)

    const [total, list] = await Promise.all([
      GajiRepository.countAll(where),
      GajiRepository.findAllPaginated(where, skip, limit),
    ])

    return {
      page,
      total,
      perPage: limit,
      data: list.map(toGajiResponse),
    }
  }

  /* ================= CRUD by id ================= */
  static async deleteById(id: number): Promise<void> {
    const gaji = await GajiRepository.findById(id)
    if (!gaji) throw AppError.fromCode(ERROR_CODE.NOT_FOUND, ERROR_DEFINITIONS.NOT_FOUND)
    await GajiRepository.deleteById(id)
  }

  static async updateById(id: number, request: UpdateGajiRequest) {
    // jalankan sebagai transaksi biar konsisten
    const updated = await prismaClient.$transaction(async (tx) => {
      const row = await GajiRepository.findByIdTx(tx, id);
      if (!row) {
        throw AppError.fromCode(ERROR_CODE.NOT_FOUND, ERROR_DEFINITIONS.NOT_FOUND.message);
      }

      // user pemilik record
      const user = await GajiRepository.findUserByUsername(tx, row.username);
      if (!user) throw AppError.fromCode(ERROR_CODE.USER_NOT_FOUND);

      // siapkan patch dinamis
      const patch: Prisma.SalaryUpdateInput = {};

      // jika jumlahBayar dikirim → validasi nominal & sisa
      if (Object.prototype.hasOwnProperty.call(request, "jumlahBayar")) {
        const jml = Number(request.jumlahBayar);
        if (!Number.isFinite(jml) || jml <= 0) {
          throw AppError.fromCode(ERROR_CODE.BAD_REQUEST, "Jumlah bayar harus > 0");
        }

        // total yg sudah dibayar EXCEPT baris ini
        const paidExceptThis = await GajiRepository.sumPaidByUsernameExcludingId(
          tx,
          row.username,
          row.id
        );
        const remaining = (user.totalGaji ?? 0) - paidExceptThis;

        const EPS = 1e-6;
        if (jml - remaining > EPS) {
          const sisaStr = Math.max(0, Math.round(remaining * 100) / 100);
          // kirimkan pesan human-friendly pada "errors" oleh error handler-mu
          throw AppError.fromCode(
            ERROR_CODE.GAJI_EXCEEDS_REMAINING,
            `${ERROR_DEFINITIONS.GAJI_EXCEEDS_REMAINING.message}. Sisa saat ini: ${sisaStr}`
          );
        }

        patch.jumlahBayar = jml;
      }

      // jika catatan dikirim → set (boleh null)
      if (Object.prototype.hasOwnProperty.call(request, "catatan")) {
        patch.catatan = request.catatan ?? null;
      }

      if (Object.keys(patch).length === 0) {
        // seharusnya tertangkap di Zod, tapi jaga-jaga
        throw AppError.fromCode(ERROR_CODE.BAD_REQUEST, "Tidak ada perubahan");
      }

      const res = await GajiRepository.updateTx(tx, id, patch);
      return res;
    });

    return toGajiResponse(updated as any);
  }

  /* ================= LIST USER ================= */
  static async getMyGaji(username: string, query: GetMyGajiInput): Promise<Paginated<GajiResponse>> {
    const page = Math.max(1, Number(query.page || 1))
    const limit = Math.min(100, Math.max(1, Number(query.limit || 10)))
    const skip = (page - 1) * limit
    const order: 'asc' | 'desc' = query.sort || 'desc'

    const where: Record<string, any> = { username }

    if (query['tanggalBayar.gte'] || query['tanggalBayar.lte']) {
      where.tanggalBayar = {}
      if (query['tanggalBayar.gte']) {
        const s = query['tanggalBayar.gte']
        where.tanggalBayar.gte = new Date(s.length === 10 ? `${s}T00:00:00.000Z` : s)
      }
      if (query['tanggalBayar.lte']) {
        const s = query['tanggalBayar.lte']
        where.tanggalBayar.lte = new Date(s.length === 10 ? `${s}T23:59:59.999Z` : s)
      }
    }

    const { items, total } = await GajiRepository.findMany(where, { skip, take: limit, order })
    const data = items.map((it) => toGajiResponse(it as any))
    const totalPages = Math.max(1, Math.ceil(total / limit))
    return { items: data, pagination: { page, limit, total, totalPages } }
  }

  /* ================= SUMMARY OWNER ================= */
  static async getSummary(period: 'total' | 'minggu' | 'bulan'): Promise<{
    period: typeof period
    totalGaji: number
    totalDibayar: number
    belumDibayar: number
  }> {
    const now = new Date()
    let start: Date | undefined

    if (period === 'minggu') {
      const d = new Date()
      const day = d.getDay()
      const diff = d.getDate() - day + (day === 0 ? -6 : 1)
      start = new Date(d.getFullYear(), d.getMonth(), diff, 0, 0, 0, 0)
    } else if (period === 'bulan') {
      const d = new Date()
      start = new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0)
    }

    const jamWhere: any = { status: 'SELESAI' }
    if (start) jamWhere.jamMulai = { gte: start, lte: now }

    const aggJam = await prismaClient.jamKerja.aggregate({ where: jamWhere, _sum: { totalJam: true } })
    const totalJam = aggJam._sum.totalJam ?? 0

    const cfg = await UserRepository.getKonfigurasi()
    const gajiPerJam = cfg?.gajiPerJam ?? 0
    const totalGaji = totalJam * gajiPerJam

    const salaryWhere: any = {}
    if (start) salaryWhere.tanggalBayar = { gte: start, lte: now }
    const aggPay = await prismaClient.salary.aggregate({ where: salaryWhere, _sum: { jumlahBayar: true } })
    const totalDibayar = aggPay._sum.jumlahBayar ?? 0

    const belumDibayar = Math.max(0, totalGaji - totalDibayar)
    return { period, totalGaji, totalDibayar, belumDibayar }
  }

  /* ================= SUMMARY USER ================= */
  static async getMySummary(username: string): Promise<GajiMeSummary> {
    const user = await UserRepository.findByUsername(username)
    if (!user) throw AppError.fromCode(ERROR_CODE.USER_NOT_FOUND)

    const eff = await KonfigurasiService.getEffective(username)
    const gajiPerJam = eff?.effective?.gajiPerJam ?? 0

    const totalJamRaw = await JamKerjaRepository.sumTotalJamAll(username)
    const totalJam = round2(totalJamRaw)

    const totalDiterima = await GajiRepository.sumByUsername(username)

    const upahKeseluruhan = round2(totalJam * gajiPerJam)
    const belumDibayar = round2(Math.max(0, upahKeseluruhan - totalDiterima))

    return {
      username,
      totalJam,
      gajiPerJam,
      upahKeseluruhan,
      totalDiterima,
      belumDibayar,
    }
  }
}