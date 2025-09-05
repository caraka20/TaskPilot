"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.KarilTest = exports.TutonTest = exports.CustomerTest = exports.KonfigurasiTest = exports.JamKerjaTest = exports.GajiTest = exports.UserTest = void 0;
const database_1 = require("../src/config/database");
const bcrypt_1 = __importDefault(require("bcrypt"));
const jwt_1 = require("../src/utils/jwt");
const prisma_1 = require("../src/generated/prisma");
class UserTest {
    static async create() {
        const hashPassword = await bcrypt_1.default.hash("raka20", 10);
        return await database_1.prismaClient.user.upsert({
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
        });
    }
    static async delete() {
        await database_1.prismaClient.user.deleteMany({
            where: {
                username: "raka20",
            }
        });
    }
    static async login() {
        const token = await (0, jwt_1.generateToken)({ username: "raka20" });
        await database_1.prismaClient.user.update({
            where: { username: "raka20" },
            data: { token: token }
        });
        return token;
    }
    static async loginOwner() {
        const token = await (0, jwt_1.generateToken)({ username: "owner-test" });
        await database_1.prismaClient.user.update({
            where: { username: "owner-test" },
            data: { token: token }
        });
        return token;
    }
}
exports.UserTest = UserTest;
class GajiTest {
    // === method lama (jangan diubah) ===
    static async create() {
        return await database_1.prismaClient.salary.create({
            data: {
                username: 'raka20',
                jumlahBayar: 100000,
                catatan: 'shift pagi'
            }
        });
    }
    static async delete() {
        await database_1.prismaClient.salary.deleteMany({
            where: { username: 'raka20' }
        });
    }
    // === method tambahan ===
    /** Pastikan user ada; kalau belum ada, buat minimal. */
    static async ensureUser(username, role = prisma_1.Role.USER) {
        await database_1.prismaClient.user.upsert({
            where: { username },
            update: {},
            create: {
                username,
                password: 'password', // isi minimal untuk lewat validasi schema
                namaLengkap: username, // sesuaikan bila field ini opsional/required
                role,
                // tambahkan field default lain jika schema kamu mewajibkan (mis. isActive)
            },
        });
    }
    /** Hapus user tertentu (dipakai untuk cleanup user tambahan seperti otheruser). */
    static async deleteUser(username) {
        await database_1.prismaClient.user.deleteMany({ where: { username } });
    }
    /** Buat banyak salary untuk user tertentu. */
    static async createManyForUser(username, items) {
        await database_1.prismaClient.salary.createMany({
            data: items.map(it => ({
                username,
                jumlahBayar: it.jumlahBayar,
                catatan: it.catatan ?? null,
                ...(it.tanggalBayar ? { tanggalBayar: it.tanggalBayar } : {}),
            })),
        });
    }
    /** Seed salary kemarin & hari ini (UTC) untuk user tertentu. */
    static async seedYesterdayToday(username, baseTodayUTC = new Date()) {
        const today = new Date(Date.UTC(baseTodayUTC.getUTCFullYear(), baseTodayUTC.getUTCMonth(), baseTodayUTC.getUTCDate(), 9, 0, 0, 0));
        const yesterday = new Date(today);
        yesterday.setUTCDate(today.getUTCDate() - 1);
        yesterday.setUTCHours(8, 0, 0, 0);
        await this.createManyForUser(username, [
            { jumlahBayar: 100000, catatan: 'A', tanggalBayar: yesterday },
            { jumlahBayar: 200000, catatan: 'B', tanggalBayar: today },
        ]);
        return { yesterday, today };
    }
    /** Hapus salary untuk banyak user (untuk cleanup). */
    static async deleteByUsers(usernames) {
        await database_1.prismaClient.salary.deleteMany({ where: { username: { in: usernames } } });
    }
    static async snapshotGlobalCfg() {
        const row = await database_1.prismaClient.konfigurasi.findUnique({ where: { id: 1 } });
        return row;
    }
    static async setGlobalGajiPerJam(value) {
        await database_1.prismaClient.konfigurasi.upsert({
            where: { id: 1 },
            update: { gajiPerJam: value },
            create: {
                id: 1,
                gajiPerJam: value,
                batasJedaMenit: 10,
                jedaOtomatisAktif: true,
            },
        });
    }
}
exports.GajiTest = GajiTest;
class JamKerjaTest {
    // --- util internal (tidak mengubah API lama) ---
    static async ensureUser(username, role = prisma_1.Role.USER) {
        await database_1.prismaClient.user.upsert({
            where: { username },
            update: {},
            create: {
                username,
                password: 'password', // sesuaikan jika skema mewajibkan aturan lain
                namaLengkap: username,
                role,
            },
        });
    }
    // ============== API LAMA (dipertahankan) ==============
    static async createAktif(username = 'raka20') {
        await this.ensureUser(username);
        const now = new Date();
        return database_1.prismaClient.jamKerja.create({
            data: {
                username,
                jamMulai: now,
                status: prisma_1.StatusKerja.AKTIF,
                totalJam: 0,
                tanggal: now,
            },
        });
    }
    static async createMany(username = 'raka20') {
        await this.ensureUser(username);
        const now = new Date();
        return database_1.prismaClient.jamKerja.createMany({
            data: [
                {
                    username,
                    jamMulai: new Date(now.getTime() - 2 * 60 * 60 * 1000),
                    jamSelesai: new Date(now.getTime() - 1 * 60 * 60 * 1000),
                    totalJam: 1,
                    status: prisma_1.StatusKerja.SELESAI,
                    tanggal: now,
                    createdAt: now,
                    updatedAt: now,
                },
                {
                    username,
                    jamMulai: new Date(now.getTime() - 4 * 60 * 60 * 1000),
                    jamSelesai: new Date(now.getTime() - 3 * 60 * 60 * 1000),
                    totalJam: 1,
                    status: prisma_1.StatusKerja.SELESAI,
                    tanggal: now,
                    createdAt: now,
                    updatedAt: now,
                },
            ],
        });
    }
    static async createJeda(username = 'raka20') {
        await this.ensureUser(username);
        const now = new Date();
        return database_1.prismaClient.jamKerja.create({
            data: {
                username,
                jamMulai: new Date(now.getTime() - 60 * 60 * 1000),
                jamSelesai: null,
                totalJam: 0,
                status: prisma_1.StatusKerja.JEDA,
                tanggal: now,
            },
        });
    }
    static async end(id) {
        const jamSelesai = new Date();
        return database_1.prismaClient.jamKerja.update({
            where: { id },
            data: {
                jamSelesai,
                totalJam: 1,
                status: prisma_1.StatusKerja.SELESAI,
            },
        });
    }
    static async delete(username = 'raka20') {
        await database_1.prismaClient.jamKerja.deleteMany({ where: { username } });
    }
    // ============== util tambahan (opsional) ==============
    static async deleteByUsers(usernames) {
        if (!usernames.length)
            return;
        await database_1.prismaClient.jamKerja.deleteMany({ where: { username: { in: usernames } } });
    }
}
exports.JamKerjaTest = JamKerjaTest;
class KonfigurasiTest {
    // ===== Global config (id=1) =====
    static async create() {
        return database_1.prismaClient.konfigurasi.upsert({
            where: { id: 1 },
            update: {},
            create: {
                id: 1,
                batasJedaMenit: 5,
                jedaOtomatisAktif: true,
                gajiPerJam: 14285.71,
            },
        });
    }
    static async update(data) {
        return database_1.prismaClient.konfigurasi.update({
            where: { id: 1 },
            data,
        });
    }
    static async get() {
        return database_1.prismaClient.konfigurasi.findUnique({
            where: { id: 1 },
        });
    }
    static async delete() {
        await database_1.prismaClient.konfigurasi.deleteMany({});
    }
    // ===== Per-user overrides =====
    static async setOverride(username, data) {
        return database_1.prismaClient.konfigurasiOverride.upsert({
            where: { username },
            update: data,
            create: {
                username,
                ...data,
            },
        });
    }
    static async getOverride(username) {
        return database_1.prismaClient.konfigurasiOverride.findUnique({
            where: { username },
        });
    }
    static async deleteOverride(username) {
        await database_1.prismaClient.konfigurasiOverride.deleteMany({ where: { username } });
    }
    static async deleteAllOverrides() {
        await database_1.prismaClient.konfigurasiOverride.deleteMany({});
    }
}
exports.KonfigurasiTest = KonfigurasiTest;
class CustomerTest {
    /**
     * Buat 1 customer dengan NIM unik (prefix "TEST-")
     */
    static async create(overrides = {}) {
        const now = Date.now();
        const rnd = Math.random().toString(36).slice(2, 8);
        const nim = overrides.nim ?? `TEST-${now}-${rnd}`;
        return database_1.prismaClient.customer.create({
            data: {
                namaCustomer: overrides.namaCustomer ?? 'Budi Test',
                noWa: overrides.noWa ?? '081234567890',
                nim,
                password: overrides.password ?? 'password123',
                jurusan: overrides.jurusan ?? 'Manajemen',
                jenis: overrides.jenis ?? prisma_1.JenisUT.TUTON,
                totalBayar: overrides.totalBayar ?? 0,
                sudahBayar: overrides.sudahBayar ?? 0,
                sisaBayar: overrides.sisaBayar ?? 0,
            },
        });
    }
    /**
     * Buat 1 customer dengan override ringan (prefix "NIM-")
     */
    static async createWith(override = {}) {
        const now = Date.now();
        const rnd = Math.floor(Math.random() * 1000);
        const nim = override.nim ?? `NIM-${now}-${rnd}`;
        return database_1.prismaClient.customer.create({
            data: {
                namaCustomer: override.namaCustomer ?? `Cust ${now}`,
                noWa: override.noWa ?? '08123456789',
                nim,
                password: override.password ?? 'pass123',
                jurusan: override.jurusan ?? 'Manajemen',
                jenis: override.jenis ?? prisma_1.JenisUT.TUTON,
            },
        });
    }
    /**
     * Buat banyak customer untuk kebutuhan listing
     */
    static async createMany(n, seedName = 'Cust') {
        const base = Date.now();
        const jobs = [];
        for (let i = 0; i < n; i++) {
            const rnd = Math.random().toString(36).slice(2, 8);
            jobs.push(this.create({
                namaCustomer: `${seedName} ${i + 1}`,
                nim: `NIM-${seedName}-${base}-${i}-${rnd}`,
            }));
        }
        return Promise.all(jobs);
    }
    /**
     * Hapus data customer test (hapus payments dulu → turunan lain → customer)
     * Default membersihkan NIM dengan prefix "TEST-".
     * Panggil lagi dengan prefix "NIM-" jika kamu juga pakai createWith/createMany.
     */
    static async delete(prefix = 'TEST-') {
        // ambil id customer yang match prefix
        const customers = await database_1.prismaClient.customer.findMany({
            where: { nim: { startsWith: prefix } },
            select: { id: true },
        });
        const ids = customers.map(c => c.id);
        if (ids.length) {
            await database_1.prismaClient.customerPayment.deleteMany({ where: { customerId: { in: ids } } });
        }
        // turunan lain
        await database_1.prismaClient.karilDetail.deleteMany({
            where: { customer: { nim: { startsWith: prefix } } },
        });
        await database_1.prismaClient.tutonCourse.deleteMany({
            where: { customer: { nim: { startsWith: prefix } } },
        });
        // terakhir: customer
        await database_1.prismaClient.customer.deleteMany({
            where: { nim: { startsWith: prefix } },
        });
    }
}
exports.CustomerTest = CustomerTest;
class TutonTest {
    static async createCourse(customerId, matkul = "Manajemen") {
        return database_1.prismaClient.tutonCourse.create({
            data: { customerId, matkul },
        });
    }
    // generate 19 item (8 diskusi, 8 absen, 3 tugas)
    static async createItems(courseId) {
        const items = [];
        // Diskusi 1..8
        for (let s = 1; s <= 8; s++) {
            items.push({ courseId, jenis: prisma_1.JenisTugas.DISKUSI, sesi: s, status: prisma_1.StatusTugas.BELUM });
        }
        // Absen 1..8
        for (let s = 1; s <= 8; s++) {
            items.push({ courseId, jenis: prisma_1.JenisTugas.ABSEN, sesi: s, status: prisma_1.StatusTugas.BELUM });
        }
        // Tugas 3,5,7
        for (const s of [3, 5, 7]) {
            items.push({ courseId, jenis: prisma_1.JenisTugas.TUGAS, sesi: s, status: prisma_1.StatusTugas.BELUM });
        }
        await database_1.prismaClient.tutonItem.createMany({ data: items });
        await database_1.prismaClient.tutonCourse.update({
            where: { id: courseId },
            data: { totalItems: items.length, completedItems: 0 },
        });
        return items.length; // 19
    }
    static async countItems(courseId) {
        return database_1.prismaClient.tutonItem.count({ where: { courseId } });
    }
    // 🔥 BARU: cari item berdasarkan (courseId, jenis, sesi) → buat dapetin id di test
    static async findItem(courseId, jenis, sesi) {
        const row = await database_1.prismaClient.tutonItem.findFirstOrThrow({ where: { courseId, jenis, sesi } });
        return row; // TS akan infer sebagai TutonItem
    }
    static async delete() {
        await database_1.prismaClient.tutonItem.deleteMany({});
        await database_1.prismaClient.tutonCourse.deleteMany({});
    }
    // Buat course untuk customer tertentu dengan nama matkul
    static async createCourseFor(customerId, matkul) {
        return database_1.prismaClient.tutonCourse.create({ data: { customerId, matkul } });
    }
    // Cari 1 course by (customerId, matkul) – opsional
    static async findCourseByCustomerMatkul(customerId, matkul) {
        return database_1.prismaClient.tutonCourse.findFirst({ where: { customerId, matkul } });
    }
    static async setItemStatus(courseId, jenis, sesi, status, nilai) {
        const data = { status, selesaiAt: status === prisma_1.StatusTugas.SELESAI ? new Date() : null };
        if (typeof nilai !== "undefined")
            data.nilai = nilai;
        return database_1.prismaClient.tutonItem.updateMany({
            where: { courseId, jenis, sesi },
            data,
        });
    }
    // Recalculate & update completedItems di course agar sinkron
    static async recalcCompleted(courseId) {
        const count = await database_1.prismaClient.tutonItem.count({
            where: { courseId, status: prisma_1.StatusTugas.SELESAI },
        });
        await database_1.prismaClient.tutonCourse.update({
            where: { id: courseId },
            data: { completedItems: count },
        });
    }
}
exports.TutonTest = TutonTest;
class KarilTest {
    static async create(customerId, override) {
        const base = {
            customerId,
            judul: "Judul KARIL",
            tugas1: false,
            tugas2: false,
            tugas3: false,
            tugas4: false,
            keterangan: null,
        };
        return database_1.prismaClient.karilDetail.create({
            data: { ...base, ...(override ?? {}) },
        });
    }
    static async findByCustomer(customerId) {
        return database_1.prismaClient.karilDetail.findUnique({ where: { customerId } });
    }
    static async delete() {
        await database_1.prismaClient.karilDetail.deleteMany({});
    }
}
exports.KarilTest = KarilTest;
