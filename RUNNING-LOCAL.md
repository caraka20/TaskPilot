# Menjalankan TaskPilot di Lokal

## Persiapan pertama

Pastikan Docker Desktop sudah aktif.

### Terminal 1 — database dan backend

```bash
cd server
cp -n .env.example .env
SECRET="$(openssl rand -hex 32)"
sed -i '' "s/replace-with-a-long-random-secret/$SECRET/" .env
npm install
npm run db:up
npx prisma generate
npm run db:migrate
npm run seed
npm run dev
```

Backend tersedia di `http://localhost:3000`.

### Terminal 2 — frontend

```bash
cd client
cp -n .env.example .env
npm install
npm run dev
```

Frontend biasanya tersedia di `http://localhost:5173`.

## Menjalankan kembali setelah setup pertama

Terminal backend:

```bash
cd server
npm run db:up
npm run dev
```

Terminal frontend:

```bash
cd client
npm run dev
```

## Jika port 3000 sudah digunakan

```bash
lsof -nP -iTCP:3000 -sTCP:LISTEN
kill PID_YANG_MUNCUL
npm run dev
```

Jangan menjalankan `npm run seed` setiap kali aplikasi dimulai. Seed hanya
diperlukan pada database lokal baru atau ketika data awal memang ingin dibuat.
