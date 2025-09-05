"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toJamKerjaResponse = toJamKerjaResponse;
exports.toRekapJamKerjaResponse = toRekapJamKerjaResponse;
exports.toJamKerjaAktifResponse = toJamKerjaAktifResponse;
function toJamKerjaResponse(data) {
    return {
        id: data.id,
        username: data.username,
        tanggal: data.tanggal,
        jamMulai: data.jamMulai,
        jamSelesai: data.jamSelesai,
        totalJam: data.totalJam,
        status: data.status,
    };
}
function toRekapJamKerjaResponse(username, totalJam, periode) {
    return {
        username,
        totalJam: parseFloat(totalJam.toFixed(2)),
        periode,
    };
}
function toJamKerjaAktifResponse(data) {
    return {
        id: data.id,
        username: data.username,
        jamMulai: data.jamMulai,
        status: "AKTIF",
    };
}
