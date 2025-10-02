// prisma/seed.ts
import 'dotenv/config' // pastikan .env tetap dibaca
import { PrismaClient, Role } from "../src/generated/prisma";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

// Utility hash password
const ROUNDS = Number(process.env.SALT_ROUNDS || 10);
async function hash(pw: string) {
  return bcrypt.hash(pw, ROUNDS);
}

async function seedConfig() {
  const cfg = await prisma.konfigurasi.upsert({
    where: { id: 1 },
    update: {
      gajiPerJam: 15000,
      batasJedaMenit: 10,
      jedaOtomatisAktif: true,
    },
    create: {
      id: 1,
      gajiPerJam: 15000,
      batasJedaMenit: 10,
      jedaOtomatisAktif: true,
    },
  });
  console.log("✅ Konfigurasi default:", cfg);
}

async function seedOwner() {
  const username = "raka20";
  const password = await hash("raka20");

  const owner = await prisma.user.upsert({
    where: { username },
    update: {
      role: Role.OWNER,
      password,
      token: null,
    },
    create: {
      username,
      password,
      namaLengkap: "Pemilik Sistem",
      role: Role.OWNER,
      token: null,
      totalJamKerja: 0.0,
      totalGaji: 0.0,
    },
  });

  console.log("✅ OWNER tersimpan:", owner.username);
}


async function main() {
  console.log("🔄 Mulai seeding...");
  await seedConfig();
  await seedOwner();
  console.log("🎉 Selesai seeding!");
}

main()
  .catch((e) => {
    console.error("❌ Gagal seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
