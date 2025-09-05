"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mapRowToItem = mapRowToItem;
function mapRowToItem(row) {
    const total = 4;
    const done = (row.tugas1 ? 1 : 0) +
        (row.tugas2 ? 1 : 0) +
        (row.tugas3 ? 1 : 0) +
        (row.tugas4 ? 1 : 0);
    return {
        id: row.id,
        customerId: row.customerId,
        namaCustomer: row.customer.namaCustomer,
        nim: row.customer.nim,
        jurusan: row.customer.jurusan,
        judul: row.judul,
        tugas1: row.tugas1,
        tugas2: row.tugas2,
        tugas3: row.tugas3,
        tugas4: row.tugas4,
        totalTasks: total,
        doneTasks: done,
        progress: total > 0 ? +(done / total).toFixed(4) : 0,
        keterangan: row.keterangan,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
    };
}
