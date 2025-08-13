import { date } from "zod";
import { prismaClient } from "../src/config/database";
import bcrypt from "bcrypt"
import { generateToken } from "../src/utils/jwt";
import { JenisTugas, JenisUT, Role, StatusKerja, StatusTugas } from "../src/generated/prisma";

export class UserTest {
    static async create () {
        const hashPassword = await bcrypt.hash("raka20", 10)
        return await prismaClient.user.upsert({
            where: { username: 'raka20' },
            update: {}, // tidak update apa-apa jika sudah ada
            create: {
                username: 'raka20',
                password: hashPassword,
                namaLengkap: 'caraka',
                role: 'USER',
                totalJamKerja: 0,
                totalGaji: 0,
            }
            })
    }

    static async delete () {
        await prismaClient.user.deleteMany({
            where : {
                username : "raka20",
            }
        })
    }

    static async login () {
        const token = await generateToken({username : "raka20"})
        await prismaClient.user.update({
            where : {username : "raka20"},
            data : {token : token}
        })
        return token
    }

    static async loginOwner () {
        const token = await generateToken({username : "owner-test"})
        await prismaClient.user.update({
            where : {username : "owner-test"},
            data : {token : token}
        })
        return token
    }

}

export class GajiTest {
  // === method lama (jangan diubah) ===
  static async create () {
    return await prismaClient.salary.create({
      data : {
        username: 'raka20',
        jumlahBayar: 100000,
        catatan: 'shift pagi'
      }
    })
  }

  static async delete () {
    await prismaClient.salary.deleteMany({
      where : { username : 'raka20' }
    })
  }

  // === method tambahan ===

  /** Pastikan user ada; kalau belum ada, buat minimal. */
  static async ensureUser(username: string, role: Role = Role.USER) {
    await prismaClient.user.upsert({
      where: { username },
      update: {},
      create: {
        username,
        password: 'password',         // isi minimal untuk lewat validasi schema
        namaLengkap: username,        // sesuaikan bila field ini opsional/required
        role,
        // tambahkan field default lain jika schema kamu mewajibkan (mis. isActive)
      },
    })
  }

  /** Hapus user tertentu (dipakai untuk cleanup user tambahan seperti otheruser). */
  static async deleteUser(username: string) {
    await prismaClient.user.deleteMany({ where: { username } })
  }

  /** Buat banyak salary untuk user tertentu. */
  static async createManyForUser(
    username: string,
    items: Array<{ jumlahBayar: number; catatan?: string | null; tanggalBayar?: Date }>
  ) {
    await prismaClient.salary.createMany({
      data: items.map(it => ({
        username,
        jumlahBayar: it.jumlahBayar,
        catatan: it.catatan ?? null,
        ...(it.tanggalBayar ? { tanggalBayar: it.tanggalBayar } : {}),
      })),
    })
  }

  /** Seed salary kemarin & hari ini (UTC) untuk user tertentu. */
  static async seedYesterdayToday(username: string, baseTodayUTC = new Date()) {
    const today = new Date(Date.UTC(
      baseTodayUTC.getUTCFullYear(),
      baseTodayUTC.getUTCMonth(),
      baseTodayUTC.getUTCDate(),
      9, 0, 0, 0
    ))
    const yesterday = new Date(today)
    yesterday.setUTCDate(today.getUTCDate() - 1)
    yesterday.setUTCHours(8, 0, 0, 0)

    await this.createManyForUser(username, [
      { jumlahBayar: 100000, catatan: 'A', tanggalBayar: yesterday },
      { jumlahBayar: 200000, catatan: 'B', tanggalBayar: today },
    ])

    return { yesterday, today }
  }

  /** Hapus salary untuk banyak user (untuk cleanup). */
  static async deleteByUsers(usernames: string[]) {
    await prismaClient.salary.deleteMany({ where: { username: { in: usernames } } })
  }
}

export class JamKerjaTest {
  // --- util internal (tidak mengubah API lama) ---
  private static async ensureUser(username: string, role: Role = Role.USER) {
    await prismaClient.user.upsert({
      where: { username },
      update: {},
      create: {
        username,
        password: 'password',       // sesuaikan jika skema mewajibkan aturan lain
        namaLengkap: username,
        role,
      },
    })
  }

  // ============== API LAMA (dipertahankan) ==============

  static async createAktif(username = 'raka20') {
    await this.ensureUser(username)
    const now = new Date()
    return prismaClient.jamKerja.create({
      data: {
        username,
        jamMulai: now,
        status: StatusKerja.AKTIF,
        totalJam: 0,
        tanggal: now,
      },
    })
  }

  static async createMany(username = 'raka20') {
    await this.ensureUser(username)
    const now = new Date()
    return prismaClient.jamKerja.createMany({
      data: [
        {
          username,
          jamMulai: new Date(now.getTime() - 2 * 60 * 60 * 1000),
          jamSelesai: new Date(now.getTime() - 1 * 60 * 60 * 1000),
          totalJam: 1,
          status: StatusKerja.SELESAI,
          tanggal: now,
          createdAt: now,
          updatedAt: now,
        },
        {
          username,
          jamMulai: new Date(now.getTime() - 4 * 60 * 60 * 1000),
          jamSelesai: new Date(now.getTime() - 3 * 60 * 60 * 1000),
          totalJam: 1,
          status: StatusKerja.SELESAI,
          tanggal: now,
          createdAt: now,
          updatedAt: now,
        },
      ],
    })
  }

  static async createJeda(username = 'raka20') {
    await this.ensureUser(username)
    const now = new Date()
    return prismaClient.jamKerja.create({
      data: {
        username,
        jamMulai: new Date(now.getTime() - 60 * 60 * 1000),
        jamSelesai: null,
        totalJam: 0,
        status: StatusKerja.JEDA,
        tanggal: now,
      },
    })
  }

  static async end(id: number) {
    const jamSelesai = new Date()
    return prismaClient.jamKerja.update({
      where: { id },
      data: {
        jamSelesai,
        totalJam: 1,
        status: StatusKerja.SELESAI,
      },
    })
  }

  static async delete(username = 'raka20') {
    await prismaClient.jamKerja.deleteMany({ where: { username } })
  }

  // ============== util tambahan (opsional) ==============
  static async deleteByUsers(usernames: string[]) {
    if (!usernames.length) return
    await prismaClient.jamKerja.deleteMany({ where: { username: { in: usernames } } })
  }
}
export class KonfigurasiTest {
  // ===== Global config (id=1) =====
  static async create() {
    return prismaClient.konfigurasi.upsert({
      where: { id: 1 },
      update: {},
      create: {
        id: 1,
        batasJedaMenit: 5,
        jedaOtomatisAktif: true,
        gajiPerJam: 14285.71,
      },
    })
  }

  static async update(data: Partial<{
    batasJedaMenit: number
    jedaOtomatisAktif: boolean
    gajiPerJam: number
  }>) {
    return prismaClient.konfigurasi.update({
      where: { id: 1 },
      data,
    })
  }

  static async get() {
    return prismaClient.konfigurasi.findUnique({
      where: { id: 1 },
    })
  }

  static async delete() {
    await prismaClient.konfigurasi.deleteMany({})
  }

  // ===== Per-user overrides =====
  static async setOverride(
    username: string,
    data: Partial<{
      gajiPerJam: number
      batasJedaMenit: number
      jedaOtomatisAktif: boolean
    }>
  ) {
    return prismaClient.konfigurasiOverride.upsert({
      where: { username },
      update: data,
      create: {
        username,
        ...data,
      },
    })
  }

  static async getOverride(username: string) {
    return prismaClient.konfigurasiOverride.findUnique({
      where: { username },
    })
  }

  static async deleteOverride(username: string) {
    await prismaClient.konfigurasiOverride.deleteMany({ where: { username } })
  }

  static async deleteAllOverrides() {
    await prismaClient.konfigurasiOverride.deleteMany({})
  }
}

export class CustomerTest {
  /**
   * Buat 1 customer dengan NIM unik (prefix "TEST-")
   */
  static async create(overrides: Partial<{
    namaCustomer: string
    noWa: string
    nim: string
    password: string
    jurusan: string
    jenis: JenisUT
    totalBayar: number
    sudahBayar: number
    sisaBayar: number
  }> = {}) {
    const now = Date.now()
    const rnd = Math.random().toString(36).slice(2, 8)
    const nim = overrides.nim ?? `TEST-${now}-${rnd}`

    return prismaClient.customer.create({
      data: {
        namaCustomer: overrides.namaCustomer ?? 'Budi Test',
        noWa: overrides.noWa ?? '081234567890',
        nim,
        password: overrides.password ?? 'password123',
        jurusan: overrides.jurusan ?? 'Manajemen',
        jenis: overrides.jenis ?? JenisUT.TUTON,
        totalBayar: overrides.totalBayar ?? 0,
        sudahBayar: overrides.sudahBayar ?? 0,
        sisaBayar: overrides.sisaBayar ?? 0,
      },
    })
  }

  /**
   * Buat 1 customer dengan override ringan (prefix "NIM-")
   */
  static async createWith(override: Partial<{
    namaCustomer: string
    noWa: string
    nim: string
    password: string
    jurusan: string
    jenis: JenisUT
  }> = {}) {
    const now = Date.now()
    const rnd = Math.floor(Math.random() * 1000)
    const nim = override.nim ?? `NIM-${now}-${rnd}`

    return prismaClient.customer.create({
      data: {
        namaCustomer: override.namaCustomer ?? `Cust ${now}`,
        noWa: override.noWa ?? '08123456789',
        nim,
        password: override.password ?? 'pass123',
        jurusan: override.jurusan ?? 'Manajemen',
        jenis: override.jenis ?? JenisUT.TUTON,
      },
    })
  }

  /**
   * Buat banyak customer untuk kebutuhan listing
   */
  static async createMany(n: number, seedName = 'Cust') {
    const base = Date.now()
    const jobs: Promise<any>[] = []
    for (let i = 0; i < n; i++) {
      const rnd = Math.random().toString(36).slice(2, 8)
      jobs.push(this.create({
        namaCustomer: `${seedName} ${i + 1}`,
        nim: `NIM-${seedName}-${base}-${i}-${rnd}`,
      }))
    }
    return Promise.all(jobs)
  }

  /**
   * Hapus data customer test (hapus payments dulu → turunan lain → customer)
   * Default membersihkan NIM dengan prefix "TEST-".
   * Panggil lagi dengan prefix "NIM-" jika kamu juga pakai createWith/createMany.
   */
  static async delete(prefix = 'TEST-') {
    // ambil id customer yang match prefix
    const customers = await prismaClient.customer.findMany({
      where: { nim: { startsWith: prefix } },
      select: { id: true },
    })
    const ids = customers.map(c => c.id)

    if (ids.length) {
      await prismaClient.customerPayment.deleteMany({ where: { customerId: { in: ids } } })
    }

    // turunan lain
    await prismaClient.karilDetail.deleteMany({
      where: { customer: { nim: { startsWith: prefix } } },
    })
    await prismaClient.tutonCourse.deleteMany({
      where: { customer: { nim: { startsWith: prefix } } },
    })

    // terakhir: customer
    await prismaClient.customer.deleteMany({
      where: { nim: { startsWith: prefix } },
    })
  }
}


export class TutonTest {
  static async createCourse(customerId: number, matkul = "Manajemen") {
    return prismaClient.tutonCourse.create({
      data: { customerId, matkul },
    })
  }

  // generate 19 item (8 diskusi, 8 absen, 3 tugas)
  static async createItems(courseId: number) {
    const items: Array<{ courseId: number; jenis: JenisTugas; sesi: number; status: StatusTugas }> = []

    // Diskusi 1..8
    for (let s = 1; s <= 8; s++) {
      items.push({ courseId, jenis: JenisTugas.DISKUSI, sesi: s, status: StatusTugas.BELUM })
    }
    // Absen 1..8
    for (let s = 1; s <= 8; s++) {
      items.push({ courseId, jenis: JenisTugas.ABSEN, sesi: s, status: StatusTugas.BELUM })
    }
    // Tugas 3,5,7
    for (const s of [3, 5, 7]) {
      items.push({ courseId, jenis: JenisTugas.TUGAS, sesi: s, status: StatusTugas.BELUM })
    }

    await prismaClient.tutonItem.createMany({ data: items })
    await prismaClient.tutonCourse.update({
      where: { id: courseId },
      data: { totalItems: items.length, completedItems: 0 },
    })

    return items.length // 19
  }

  static async countItems(courseId: number) {
    return prismaClient.tutonItem.count({ where: { courseId } })
  }

  // 🔥 BARU: cari item berdasarkan (courseId, jenis, sesi) → buat dapetin id di test
  static async findItem(courseId: number, jenis: JenisTugas, sesi: number) {
    const row = await prismaClient.tutonItem.findFirstOrThrow({ where: { courseId, jenis, sesi } })
    return row // TS akan infer sebagai TutonItem
  }

  static async delete() {
    await prismaClient.tutonItem.deleteMany({})
    await prismaClient.tutonCourse.deleteMany({})
  }

  // Buat course untuk customer tertentu dengan nama matkul
  static async createCourseFor(customerId: number, matkul: string) {
    return prismaClient.tutonCourse.create({ data: { customerId, matkul } })
  }

  // Cari 1 course by (customerId, matkul) – opsional
  static async findCourseByCustomerMatkul(customerId: number, matkul: string) {
    return prismaClient.tutonCourse.findFirst({ where: { customerId, matkul } })
  }

  static async setItemStatus(
    courseId: number,
    jenis: JenisTugas,
    sesi: number,
    status: StatusTugas,
    nilai?: number | null
  ) {
    const data: any = { status, selesaiAt: status === StatusTugas.SELESAI ? new Date() : null }
    if (typeof nilai !== "undefined") data.nilai = nilai
    return prismaClient.tutonItem.updateMany({
      where: { courseId, jenis, sesi },
      data,
    })
  }

  // Recalculate & update completedItems di course agar sinkron
  static async recalcCompleted(courseId: number) {
    const count = await prismaClient.tutonItem.count({
      where: { courseId, status: StatusTugas.SELESAI },
    })
    await prismaClient.tutonCourse.update({
      where: { id: courseId },
      data: { completedItems: count },
    })
  }
}

export class KarilTest {
  static async create(customerId: number, override?: Partial<{
    judul: string
    tugas1: boolean
    tugas2: boolean
    tugas3: boolean
    tugas4: boolean
    keterangan: string | null
  }>) {
    const base = {
      customerId,
      judul: "Judul KARIL",
      tugas1: false,
      tugas2: false,
      tugas3: false,
      tugas4: false,
      keterangan: null as string | null,
    }
    return prismaClient.karilDetail.create({
      data: { ...base, ...(override ?? {}) },
    })
  }

  static async findByCustomer(customerId: number) {
    return prismaClient.karilDetail.findUnique({ where: { customerId } })
  }

  static async delete() {
    await prismaClient.karilDetail.deleteMany({})
  }
}