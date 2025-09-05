"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomerRepository = void 0;
const database_1 = require("../../config/database");
const customer_model_1 = require("./customer.model");
class CustomerRepository {
    /** Cek eksistensi by NIM (untuk validasi unik di service) */
    static async findByNim(nim) {
        return database_1.prismaClient.customer.findUnique({ where: { nim } });
    }
    /** Create customer (ASSUME password sudah di-hash di service) */
    static async create(data) {
        const total = data.totalBayar ?? 0;
        const sudah = data.sudahBayar ?? 0;
        const sisa = (0, customer_model_1.hitungSisaBayar)(total, sudah);
        return database_1.prismaClient.customer.create({
            data: {
                namaCustomer: data.namaCustomer,
                noWa: data.noWa,
                nim: data.nim,
                password: data.password, // sudah di-hash di service
                jurusan: data.jurusan,
                jenis: data.jenis,
                totalBayar: total,
                sudahBayar: sudah,
                sisaBayar: sisa,
            },
        });
    }
    /** Detail customer (dengan ringkasan relasi) */
    static async findDetailById(id) {
        return database_1.prismaClient.customer.findUnique({
            where: { id },
            select: {
                id: true,
                namaCustomer: true,
                noWa: true,
                nim: true,
                jurusan: true,
                jenis: true,
                password: true, // ⬅️ tambahkan
                totalBayar: true,
                sudahBayar: true,
                sisaBayar: true,
                createdAt: true,
                updatedAt: true,
                _count: { select: { tutonCourses: true } },
                karil: { select: { id: true } },
            },
        });
    }
    /** Ambil customer polos */
    static async findById(id) {
        return database_1.prismaClient.customer.findUnique({ where: { id } });
    }
    // ===========================
    // PEMBAYARAN CUSTOMER
    // ===========================
    /**
     * Insert transaksi pembayaran + recompute sudahBayar & sisaBayar
     * Kompatibel dgn data lama: gunakan "baseline" = current.sudahBayar - sum(transaksi_sebelum)
     * Sehingga setelah insert: sudahBaru = baseline + (sumSebelum + amountBaru) = current.sudahBayar + amountBaru
     */
    static async addPayment(params) {
        const { customerId, amount, catatan, tanggalBayar } = params;
        return database_1.prismaClient.$transaction(async (tx) => {
            const customer = await tx.customer.findUnique({ where: { id: customerId } });
            if (!customer)
                return null;
            // SUM transaksi SEBELUM insert
            const aggBefore = await tx.customerPayment.aggregate({
                where: { customerId },
                _sum: { amount: true },
            });
            const sumBefore = aggBefore._sum.amount ?? 0;
            // baseline (kompatibilitas dengan kolom sudahBayar yang sudah ada)
            const baseline = (customer.sudahBayar ?? 0) - sumBefore;
            // insert transaksi baru
            await tx.customerPayment.create({
                data: {
                    customerId,
                    amount,
                    catatan,
                    tanggalBayar: tanggalBayar ?? new Date(),
                },
            });
            // sum sesudah insert
            const sumAfter = sumBefore + amount;
            // sudahBaru = baseline + sumAfter  == current.sudahBayar + amount
            const sudahBaru = baseline + sumAfter;
            const sisaBaru = Math.max((customer.totalBayar ?? 0) - sudahBaru, 0);
            const updated = await tx.customer.update({
                where: { id: customerId },
                data: {
                    sudahBayar: sudahBaru,
                    sisaBayar: sisaBaru,
                },
                select: {
                    id: true, namaCustomer: true, nim: true,
                    totalBayar: true, sudahBayar: true, sisaBayar: true,
                    updatedAt: true,
                },
            });
            return updated;
        });
    }
    /**
     * Update total tagihan (invoice) + recompute sisaBayar berdasarkan nilai "sudah" yang konsisten
     * (baseline + sumSaatIni). TIDAK menimpa nilai kolom sudahBayar.
     */
    static async updateInvoiceTotal(id, totalBayar) {
        return database_1.prismaClient.$transaction(async (tx) => {
            const customer = await tx.customer.findUnique({ where: { id } });
            if (!customer)
                return null;
            // SUM transaksi saat ini
            const agg = await tx.customerPayment.aggregate({
                where: { customerId: id },
                _sum: { amount: true },
            });
            const sumNow = agg._sum.amount ?? 0;
            // baseline konsisten
            const baseline = (customer.sudahBayar ?? 0) - sumNow;
            const sudah = baseline + sumNow; // == customer.sudahBayar
            if (totalBayar < sudah) {
                // tidak boleh lebih kecil dari jumlah yang sudah dibayar (konsisten)
                throw new Error('TOTAL_LESS_THAN_PAID');
            }
            const sisa = totalBayar - sudah;
            return tx.customer.update({
                where: { id },
                data: { totalBayar, sisaBayar: sisa }, // TIDAK mengubah sudahBayar
                select: {
                    id: true, namaCustomer: true, nim: true,
                    totalBayar: true, sudahBayar: true, sisaBayar: true,
                    updatedAt: true,
                },
            });
        });
    }
    // List histori pembayaran per customer
    static async listPayments(customerId, query) {
        const { page, limit, sortDir, start, end } = query;
        const where = { customerId };
        if (start || end) {
            where.tanggalBayar = {};
            if (start)
                where.tanggalBayar.gte = start;
            if (end)
                where.tanggalBayar.lte = end;
        }
        const [items, total] = await Promise.all([
            database_1.prismaClient.customerPayment.findMany({
                where,
                orderBy: { tanggalBayar: sortDir },
                skip: (page - 1) * limit,
                take: limit,
                select: {
                    id: true,
                    amount: true,
                    tanggalBayar: true,
                    catatan: true,
                    createdAt: true,
                },
            }),
            database_1.prismaClient.customerPayment.count({ where }),
        ]);
        return {
            items,
            pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        };
    }
    // ===========================
    // LAIN-LAIN (dibiarkan sama; hanya ditambah hapus payments saat remove)
    // ===========================
    static async remove(id) {
        return database_1.prismaClient.$transaction(async (tx) => {
            // Hapus histori pembayaran lebih dulu (tambahan terkait fitur payments)
            await tx.customerPayment.deleteMany({ where: { customerId: id } });
            // Hapus KarilDetail jika ada
            await tx.karilDetail.deleteMany({ where: { customerId: id } });
            // Hapus semua matkul (TutonCourse) -> akan cascade ke TutonItem
            await tx.tutonCourse.deleteMany({ where: { customerId: id } });
            // Terakhir hapus customer
            await tx.customer.delete({ where: { id } });
            return true;
        });
    }
    static async getByIdBasic(id) {
        return database_1.prismaClient.customer.findUnique({
            where: { id },
            select: { id: true, namaCustomer: true },
        });
    }
    // semua course milik customer
    static async listTutonCoursesByCustomer(customerId) {
        return database_1.prismaClient.tutonCourse.findMany({
            where: { customerId },
            select: {
                id: true,
                matkul: true,
                totalItems: true,
                completedItems: true,
                createdAt: true,
                updatedAt: true,
            },
            orderBy: [{ createdAt: "asc" }],
        });
    }
    // ambil semua item untuk daftar course
    static async listItemsForCourses(courseIds) {
        if (courseIds.length === 0)
            return [];
        return database_1.prismaClient.tutonItem.findMany({
            where: { courseId: { in: courseIds } },
            select: {
                courseId: true,
                jenis: true,
                status: true,
                nilai: true,
            },
        });
    }
    static buildWhereForList(q, jenis) {
        const where = {};
        if (q) {
            where.OR = [
                { nim: { contains: q } }, // tanpa mode: 'insensitive'
                { namaCustomer: { contains: q } }, // collation MySQL umumnya CI
            ];
        }
        if (jenis) {
            where.jenis = Array.isArray(jenis) ? { in: jenis } : jenis;
        }
        return where;
    }
    /** ⬅️ UPDATE: teruskan jenis ke buildWhereForList */
    static async list(query) {
        const where = this.buildWhereForList(query.q, query.jenis);
        const [rows, total] = await Promise.all([
            database_1.prismaClient.customer.findMany({
                where,
                skip: (query.page - 1) * query.limit,
                take: query.limit,
                orderBy: { [query.sortBy]: query.sortDir },
                select: {
                    id: true,
                    namaCustomer: true,
                    noWa: true,
                    nim: true,
                    jurusan: true,
                    jenis: true,
                    totalBayar: true,
                    sudahBayar: true,
                    sisaBayar: true,
                    createdAt: true,
                    updatedAt: true,
                    _count: { select: { tutonCourses: true } },
                },
            }),
            database_1.prismaClient.customer.count({ where }),
        ]);
        return { rows, total };
    }
}
exports.CustomerRepository = CustomerRepository;
