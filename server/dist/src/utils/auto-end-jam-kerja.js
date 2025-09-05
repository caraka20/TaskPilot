"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.autoEndJamKerjaOverdue = autoEndJamKerjaOverdue;
const database_1 = require("../config/database");
const user_repository_1 = require("../app/user/user.repository");
const server_1 = require("../server"); // pastikan server.ts sudah ekspor io
async function autoEndJamKerjaOverdue() {
    const batas = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 jam lalu
    // Ambil semua jam kerja yang belum diselesaikan lebih dari 24 jam
    const jamKerjaList = await database_1.prismaClient.jamKerja.findMany({
        where: {
            status: 'AKTIF',
            jamMulai: {
                lte: batas,
            },
        },
    });
    // Ambil konfigurasi gaji per jam
    const konfigurasi = await user_repository_1.UserRepository.getKonfigurasi();
    const gajiPerJam = konfigurasi?.gajiPerJam ?? 0;
    for (const jam of jamKerjaList) {
        const jamSelesai = new Date(jam.jamMulai.getTime() + 24 * 60 * 60 * 1000);
        const totalJam = 24;
        // Update data jam kerja: set status SELESAI dan hitung total jam
        await database_1.prismaClient.jamKerja.update({
            where: { id: jam.id },
            data: {
                status: 'SELESAI',
                jamSelesai,
                totalJam,
            },
        });
        // Tambahkan ke total jam kerja & gaji user
        await user_repository_1.UserRepository.tambahJamKerjaDanGaji(jam.username, totalJam, gajiPerJam);
        // Emit event realtime untuk dashboard monitoring (jika Socket.IO aktif)
        server_1.io.emit('jamKerja:autoEnded', {
            id: jam.id,
            username: jam.username,
            jamSelesai,
            totalJam,
            status: 'SELESAI',
            auto: true,
        });
    }
    console.log(`[CRON] Jam kerja otomatis diselesaikan: ${jamKerjaList.length}`);
}
