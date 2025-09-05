"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toUserResponse = toUserResponse;
exports.toLoginResponse = toLoginResponse;
exports.toUserDetailResponse = toUserDetailResponse;
/* ========= MAPPERS ========= */
function toUserResponse(user) {
    return {
        username: user.username,
        namaLengkap: user.namaLengkap,
        role: user.role,
        totalJamKerja: user.totalJamKerja,
        totalGaji: user.totalGaji,
    };
}
function toLoginResponse(user, token) {
    return {
        token,
        user: toUserResponse(user),
    };
}
function toUserDetailResponse(user) {
    const tugas = (user.tutonItems ?? []).map((item) => {
        const customer = item.course?.customer;
        return {
            id: item.id,
            deskripsi: item.deskripsi || `${String(item.jenis)} sesi ${item.sesi}`,
            jenisTugas: String(item.jenis),
            status: String(item.status),
            waktuSelesai: item.selesaiAt ?? null,
            customer: {
                id: customer?.id ?? 0,
                namaCustomer: customer?.namaCustomer ?? "",
                nim: customer?.nim ?? "",
                jurusan: customer?.jurusan ?? "",
            },
        };
    });
    return {
        username: user.username,
        namaLengkap: user.namaLengkap,
        role: user.role,
        totalJamKerja: user.totalJamKerja,
        totalGaji: user.totalGaji,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        jamKerja: user.jamKerja ?? [],
        riwayatGaji: user.riwayatGaji ?? [],
        tugas, // back-compat untuk test lama
    };
}
