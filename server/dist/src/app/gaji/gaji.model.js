"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GajiModel = void 0;
exports.toGajiResponse = toGajiResponse;
function toGajiResponse(row) {
    return {
        id: row.id,
        username: row.username,
        jumlahBayar: row.jumlahBayar,
        tanggalBayar: row.tanggalBayar ?? row.createdAt,
        catatan: row.catatan ?? null,
        namaLengkap: row.user?.namaLengkap ?? row.namaLengkap ?? undefined,
    };
}
class GajiModel {
    static buildWhere(query) {
        const where = {};
        if (query.username)
            where.username = query.username;
        if (query['tanggalBayar.gte'] || query['tanggalBayar.lte']) {
            where.tanggalBayar = {};
            if (query['tanggalBayar.gte'])
                where.tanggalBayar.gte = new Date(query['tanggalBayar.gte']);
            if (query['tanggalBayar.lte'])
                where.tanggalBayar.lte = new Date(query['tanggalBayar.lte']);
        }
        return where;
    }
}
exports.GajiModel = GajiModel;
