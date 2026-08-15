# TaskPilot Integrated

TaskPilot React + TypeScript, API Express + Prisma/MySQL, dan modul Absensi
terpadu. Dokumentasi fitur, aturan otomatis, migrasi, serta deployment aman ada
di [INTEGRASI-ABSENSI.md](./INTEGRASI-ABSENSI.md).

## Menjalankan lokal

```bash
cd server
# Paket ZIP sudah menyertakan .env khusus development lokal.
# Jika mengambil dari Git, jalankan: cp .env.example .env
npm install
npm run db:up
npm run db:migrate
npm run seed
npm run dev
```

Terminal kedua:

```bash
cd client
# Paket ZIP sudah menyertakan .env khusus development lokal.
npm install
npm run dev
```

Buka `http://localhost:5173`.

## Pemeriksaan sebelum deployment

```bash
cd server && npm run build
cd ../client && npm run lint && npm run build
```

Nilai `.env` di paket hanya untuk MySQL Docker lokal. Ganti `DATABASE_URL` dan
`JWT_SECRET_KEY` saat deployment. Jangan commit `.env`, database dump,
`node_modules`, dan folder build ke repository.
