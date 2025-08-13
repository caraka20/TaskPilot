import { prismaClient } from '../config/database'
import { UserRepository } from '../app/user/user.repository'
import { io } from '../server' // pastikan server.ts sudah ekspor io

export async function autoEndJamKerjaOverdue() {
  const batas = new Date(Date.now() - 24 * 60 * 60 * 1000) // 24 jam lalu

  // Ambil semua jam kerja yang belum diselesaikan lebih dari 24 jam
  const jamKerjaList = await prismaClient.jamKerja.findMany({
    where: {
      status: 'AKTIF',
      jamMulai: {
        lte: batas,
      },
    },
  })

  // Ambil konfigurasi gaji per jam
  const konfigurasi = await UserRepository.getKonfigurasi()
  const gajiPerJam = konfigurasi?.gajiPerJam ?? 0

  for (const jam of jamKerjaList) {
    const jamSelesai = new Date(jam.jamMulai.getTime() + 24 * 60 * 60 * 1000)
    const totalJam = 24

    // Update data jam kerja: set status SELESAI dan hitung total jam
    await prismaClient.jamKerja.update({
      where: { id: jam.id },
      data: {
        status: 'SELESAI',
        jamSelesai,
        totalJam,
      },
    })

    // Tambahkan ke total jam kerja & gaji user
    await UserRepository.tambahJamKerjaDanGaji(jam.username, totalJam, gajiPerJam)

    // Emit event realtime untuk dashboard monitoring (jika Socket.IO aktif)
    io.emit('jamKerja:autoEnded', {
      id: jam.id,
      username: jam.username,
      jamSelesai,
      totalJam,
      status: 'SELESAI',
      auto: true,
    })
  }

  console.log(`[CRON] Jam kerja otomatis diselesaikan: ${jamKerjaList.length}`)
}
