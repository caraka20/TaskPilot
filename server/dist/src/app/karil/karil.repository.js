"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KarilRepository = void 0;
// src/app/karil/karil.repository.ts
const database_1 = require("../../config/database");
const prisma_1 = require("../../generated/prisma");
class KarilRepository {
    static findCustomerById(id) {
        return database_1.prismaClient.customer.findUnique({
            where: { id },
            include: { karil: true },
        });
    }
    static findByCustomerId(customerId) {
        return database_1.prismaClient.karilDetail.findUnique({ where: { customerId } });
    }
    static async upsertByCustomerId(input) {
        const { customerId, judul, tugas1, tugas2, tugas3, tugas4, keterangan } = input;
        return database_1.prismaClient.karilDetail.upsert({
            where: { customerId },
            create: {
                customerId,
                judul,
                ...(typeof tugas1 === "boolean" ? { tugas1 } : {}),
                ...(typeof tugas2 === "boolean" ? { tugas2 } : {}),
                ...(typeof tugas3 === "boolean" ? { tugas3 } : {}),
                ...(typeof tugas4 === "boolean" ? { tugas4 } : {}),
                keterangan: keterangan ?? null,
            },
            update: {
                judul,
                ...(typeof tugas1 === "boolean" ? { tugas1 } : {}),
                ...(typeof tugas2 === "boolean" ? { tugas2 } : {}),
                ...(typeof tugas3 === "boolean" ? { tugas3 } : {}),
                ...(typeof tugas4 === "boolean" ? { tugas4 } : {}),
                ...(keterangan !== undefined ? { keterangan } : {}),
            },
        });
    }
    /** Detail lengkap satu customer (include relasi customer) */
    static async detailByCustomerId(customerId) {
        return database_1.prismaClient.karilDetail.findUnique({
            where: { customerId },
            include: {
                customer: { select: { id: true, namaCustomer: true, nim: true, jurusan: true, jenis: true } },
            },
        });
    }
    /** List semua KARIL + filter/search/sort/paging */
    static async listAll(query) {
        const q = (query.q ?? "").trim();
        // progress filter
        const progressFilter = query.progress === "complete"
            ? { AND: [{ tugas1: true }, { tugas2: true }, { tugas3: true }, { tugas4: true }] }
            : query.progress === "incomplete"
                ? { NOT: { AND: [{ tugas1: true }, { tugas2: true }, { tugas3: true }, { tugas4: true }] } }
                : {};
        // filter by related customer (KARIL + TK) + optional search
        const customerWhere = {
            jenis: { in: [prisma_1.JenisUT.KARIL, prisma_1.JenisUT.TK] },
            ...(q
                ? {
                    OR: [
                        { namaCustomer: { contains: q } }, // hapus mode
                        { nim: { contains: q } },
                    ],
                }
                : {}),
        };
        // gabungkan ke where utama
        const where = {
            customer: { is: customerWhere },
            ...progressFilter,
        };
        // orderBy: kalau sortBy field milik customer, taruh di bawah customer
        const orderBy = query.sortBy === "namaCustomer" || query.sortBy === "nim"
            ? { customer: { [query.sortBy]: query.sortDir } }
            : { [query.sortBy]: query.sortDir };
        const page = Math.max(1, query.page ?? 1);
        const limit = Math.min(Math.max(1, query.limit ?? 10), 100);
        const [rows, total] = await Promise.all([
            database_1.prismaClient.karilDetail.findMany({
                where,
                include: {
                    customer: {
                        select: { id: true, namaCustomer: true, nim: true, jurusan: true, jenis: true },
                    },
                },
                orderBy,
                skip: (page - 1) * limit,
                take: limit,
            }),
            database_1.prismaClient.karilDetail.count({ where }),
        ]);
        return { rows, total };
    }
}
exports.KarilRepository = KarilRepository;
