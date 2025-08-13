import { PrismaClient, Role } from '../src/generated/prisma' // sesuaikan path jika pakai @prisma/client
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  const username = 'owner-test'
  const hashedPassword = await bcrypt.hash('owner123', 10)

  const owner = await prisma.user.upsert({
    where: { username },
    update: {
      // update role dan password jika user sudah ada
      role: Role.OWNER,
      password: hashedPassword,
    },
    create: {
      username,
      password: hashedPassword,
      namaLengkap: 'Pemilik Sistem',
      role: Role.OWNER,
      token: null,
      totalJamKerja: 0.0,
      totalGaji: 0.0,
    },
  })

  console.log('✅ OWNER berhasil disimpan:', owner)
}

main()
  .catch((e) => {
    console.error('❌ Gagal membuat OWNER:', e)
    process.exit(1)
  })
  .finally(() => {
    prisma.$disconnect()
  })
