# ARTECH Backend API — README

Base URL: `{{ base_url }}` (contoh: `http://localhost:3000`)

Semua endpoint (kecuali `/health` dan `/api/users/login`) menggunakan **JWT Bearer Token** pada header:
```
Authorization: Bearer <token>
Content-Type: application/json
```

## Roles
- `OWNER` memiliki akses penuh ke semua endpoint bertanda OWNER.
- `USER` memiliki akses sesuai yang ditandai.

## Health
- **GET** `/health` — Cek status server.

## Auth & User
- **POST** `/api/users/login` — Login dan mendapatkan token.
  - Body:
    ```json
    { "username": "jane", "password": "secret" }
    ```
- **POST** `/api/users/register` — Registrasi user (OWNER).
  - Body:
    ```json
    { "username": "john", "password": "secret", "namaLengkap": "John Doe", "role": "USER" }
    ```
- **GET** `/api/users` — List semua user (OWNER).
- **GET** `/api/users/:username` — Detail user (OWNER/USER yang login).
- **POST** `/api/users/logout` — Logout user login.
- **PATCH** `/api/users/:username/jeda-otomatis` — Set jeda otomatis per user (OWNER).
  - Body (contoh):
    ```json
    { "enabled": true, "batasJedaMenit": 10 }
    ```

## Gaji (OWNER kecuali `/me`)
- **POST** `/api/gaji` — Buat gaji.
  - Body (contoh minimal):
    ```json
    {
      "username": "john",
      "periode": "2025-08",
      "totalJamKerja": 120,
      "gajiPerJam": 14285.71,
      "totalGaji": 1714285.2,
      "keterangan": "Periode Agustus 2025"
    }
    ```
- **GET** `/api/gaji` — List semua gaji.
- **PATCH** `/api/gaji/:id` — Update gaji.
- **DELETE** `/api/gaji/:id` — Hapus gaji.
- **GET** `/api/gaji/me` — Lihat gaji milik user login (USER).

## Jam Kerja
- **POST** `/api/jam-kerja/start` (USER) — Mulai jam kerja.
  - Body:
    ```json
    { "taskId": 123, "catatan": "Mulai kerja modul A" }
    ```
- **PATCH** `/api/jam-kerja/:id/end` (USER) — Akhiri jam kerja.
  - Body:
    ```json
    { "catatanSelesai": "Selesai modul A" }
    ```
- **POST** `/api/jam-kerja/:id/pause` (USER) — Pause (manual).
- **POST** `/api/jam-kerja/:id/resume` (USER) — Resume.
- **GET** `/api/jam-kerja` (OWNER/USER) — Riwayat (mendukung query seperti: `?username=john&from=2025-08-01&to=2025-08-31`).
- **GET** `/api/jam-kerja/rekap` (OWNER/USER) — Rekap mingguan/bulanan (query: `type=weekly|monthly&username=john&from=...&to=...`).
- **GET** `/api/jam-kerja/aktif` (OWNER/USER) — Daftar session yang masih aktif.

## Konfigurasi
- **GET** `/api/konfigurasi` (OWNER) — Ambil konfigurasi global.
- **PUT** `/api/konfigurasi` (OWNER) — Update konfigurasi global.
  - Body (contoh):
    ```json
    { "gajiPerJam": 14285.71, "batasJedaMenit": 10, "autoPauseEnabled": true }
    ```
- **GET** `/api/konfigurasi/effective` (OWNER/USER) — Konfigurasi efektif untuk user login.
- **PUT** `/api/konfigurasi/override/:username` (OWNER) — Override khusus user.
  - Body (contoh):
    ```json
    { "gajiPerJam": 20000, "batasJedaMenit": 15, "autoPauseEnabled": false }
    ```
- **DELETE** `/api/konfigurasi/override/:username` (OWNER) — Hapus override user.

## Dashboard
- **GET** `/api/dashboard/summary` (OWNER) — Ringkasan agregat (aktif, total jam, dsb).

## Customer
- **POST** `/api/customers` (OWNER/USER) — Buat customer.
  - Body:
    ```json
    { "nama": "Andi", "whatsapp": "62812xxxx", "totalBayar": 1000000, "jenis": "TUTON" }
    ```
- **GET** `/api/customers` (OWNER/USER) — List customer (mendukung filter/query).
- **GET** `/api/customers/:id` (OWNER/USER) — Detail customer.
- **PATCH** `/api/customers/:id/payment` (OWNER/USER) — Update pembayaran.
  - Body:
    ```json
    { "status": "LUNAS", "nominal": 1000000, "catatan": "Pelunasan via transfer" }
    ```
- **DELETE** `/api/customers/:id` (OWNER/USER) — Hapus customer.

## Tuton
- **POST** `/api/customers/:id/tuton-courses` (OWNER/USER) — Tambah matkul ke customer.
  - Body:
    ```json
    { "matkul": "EKMA4311", "namaMatkul": "Studi Kelayakan Bisnis", "semester": "2025.2" }
    ```
- **DELETE** `/api/tuton-courses/:courseId` (OWNER/USER) — Hapus course dari customer.
- **GET** `/api/tuton-courses/:courseId/summary` (OWNER/USER) — Ringkasan progres course.

## Karil
- **PUT** `/api/customers/:id/karil` (OWNER) — Upsert data KARIL untuk customer.
  - Body (contoh minimal):
    ```json
    { "judul": "Manajemen Waktu...", "status": "PROGRESS", "catatan": "Bab I-II selesai" }
    ```

## Tuton Items
- **GET** `/api/tuton-courses/:courseId/items` (OWNER/USER) — Daftar item per course.
- **PATCH** `/api/tuton-items/:itemId` (OWNER/USER) — Update (status/nilai/deskripsi).
  - Body (opsional semua):
    ```json
    { "status": "SELESAI", "nilai": 95, "deskripsi": "Upload tugas minggu 3" }
    ```
- **PATCH** `/api/tuton-items/:itemId/status` (OWNER/USER) — Update khusus status.
  - Body:
    ```json
    { "status": "SELESAI" }
    ```
- **PATCH** `/api/tuton-items/:itemId/nilai` (OWNER/USER) — Update khusus nilai.
  - Body:
    ```json
    { "nilai": 90 }
    ```
- **POST** `/api/tuton-courses/:courseId/items/init` (OWNER/USER) — Inisialisasi 19 item default.
- **POST** `/api/tuton-courses/:courseId/items/bulk-status` (OWNER/USER) — Bulk update status.
  - Body:
    ```json
    { "itemIds": [1,2,3], "status": "SELESAI" }
    ```
- **POST** `/api/tuton-courses/:courseId/items/bulk-nilai` (OWNER/USER) — Bulk update nilai.
  - Body:
    ```json
    { "itemIds": [1,2,3], "nilai": 100 }
    ```

## Tuton Conflicts
- **GET** `/api/tuton-courses/conflicts` (OWNER/USER) — Daftar matkul bentrok lintas customer.
- **GET** `/api/tuton-courses/conflicts/:matkul` (OWNER/USER) — Detail konflik untuk satu matkul.

## Customer Tuton Summary
- **GET** `/api/customers/:id/tuton-summary` (OWNER/USER) — Ringkasan progres tuton per customer.

---

## Cara Cepat Coba via cURL
```bash
# Health
curl {{base_url}}/health

# Login (dapatkan token)
curl -X POST {{base_url}}/api/users/login   -H "Content-Type: application/json"   -d '{"username":"john","password":"secret"}'

# Contoh akses endpoint ber-token
curl {{base_url}}/api/jam-kerja/aktif   -H "Authorization: Bearer <token>"
```

## Postman
Gunakan file koleksi **`artech-api.postman_collection.json`** dan environment **`artech-api.postman_environment.json`** yang disertakan.

- Set `base_url` (contoh: `http://localhost:3000`).
- Isi `token` setelah login berhasil.
