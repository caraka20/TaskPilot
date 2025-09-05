"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hitungSisaBayar = hitungSisaBayar;
exports.toCustomerResponse = toCustomerResponse;
exports.toCustomerListItem = toCustomerListItem;
exports.toCustomerDetailResponse = toCustomerDetailResponse;
/** util hitung sisa bayar (selalu >= 0) */
function hitungSisaBayar(total = 0, sudah = 0) {
    const sisa = (total ?? 0) - (sudah ?? 0);
    return sisa > 0 ? +Number(sisa).toFixed(2) : 0;
}
/** mapper: Prisma.Customer -> CustomerResponse */
function toCustomerResponse(c) {
    return {
        id: c.id,
        namaCustomer: c.namaCustomer,
        noWa: c.noWa,
        nim: c.nim,
        jurusan: c.jurusan,
        jenis: c.jenis,
        totalBayar: c.totalBayar,
        sudahBayar: c.sudahBayar,
        sisaBayar: c.sisaBayar,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
    };
}
function toCustomerListItem(row) {
    return {
        id: row.id,
        namaCustomer: row.namaCustomer,
        noWa: row.noWa,
        nim: row.nim,
        jurusan: row.jurusan,
        jenis: row.jenis,
        totalBayar: row.totalBayar,
        sudahBayar: row.sudahBayar,
        sisaBayar: row.sisaBayar,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
        tutonCourseCount: row._count.tutonCourses,
    };
}
function toCustomerDetailResponse(row) {
    return {
        id: row.id,
        namaCustomer: row.namaCustomer,
        noWa: row.noWa,
        nim: row.nim,
        jurusan: row.jurusan,
        jenis: row.jenis,
        password: row.password, // ⬅️ kirimkan password apa adanya
        totalBayar: row.totalBayar,
        sudahBayar: row.sudahBayar,
        sisaBayar: row.sisaBayar,
        tutonCourseCount: row._count.tutonCourses,
        hasKaril: !!row.karil,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
    };
}
