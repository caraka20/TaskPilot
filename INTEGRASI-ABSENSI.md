# Integrasi Absensi ke TaskPilot

Project ini menggabungkan fitur dari `caraka20/absensi` ke aplikasi dan database
`caraka20/TaskPilot`. Modul lama TaskPilot tidak dihapus atau diganti.

## Fitur yang masuk

- pekerjaan harian dan borongan;
- input banyak produk dan jumlah produksi saat checkout borongan;
- tarif harian dan tarif produk per pekerja dengan snapshot transaksi;
- persetujuan, koreksi, dan persetujuan massal oleh OWNER;
- kalender pekerjaan dan tugas per pekerja;
- catatan personal dari OWNER;
- payroll, pembayaran sebagian, slip PDF, laporan Excel;
- audit tindakan administratif;
- tampilan mobile, desktop, serta dark mode di design system TaskPilot.

## Peningkatan TaskPilot pada paket ini

- customer dapat memiliki beberapa layanan sekaligus: Tuton, Karya Ilmiah,
  dan Metode Penelitian;
- Metode Penelitian memiliki judul, empat status tugas, catatan, daftar, serta
  filter progres yang setara dengan Karya Ilmiah;
- OWNER dapat memberi user izin baca ringkasan tagihan customer tanpa memberi
  izin mengubah atau menghapus pembayaran;
- tombol **Langsung Lunas** mencatat transaksi pelunasan dan memperbarui saldo
  customer dalam satu transaksi database;
- export Excel memakai tabel Excel berfilter, satu tab per customer, serta
  menyertakan ringkasan layanan, pembayaran, Tuton, Karya Ilmiah, dan Metode
  Penelitian;
- dashboard user menampilkan rentang tanggal minggu berjalan dan tanggal awal
  histori kerja;
- payroll terpadu menghitung tiga sumber secara eksplisit: sesi JamKerja selesai
  dikali tarif efektif per jam, pekerjaan Absensi harian yang disetujui, dan
  produksi borongan yang disetujui;
- dashboard OWNER menampilkan posisi payroll, piutang customer, user aktif,
  pekerjaan berjalan, antrean persetujuan, progres layanan akademik, serta
  aktivitas terbaru dalam satu ringkasan operasional;
- detail customer dibagi menjadi tiga area tanpa card bertumpuk berlebihan:
  identitas, layanan akademik, serta tagihan dan pembayaran;
- profil user mendukung avatar lokal JPG/PNG/WebP maksimum 2 MB, ganti password,
  serta aktivasi/nonaktivasi akun oleh OWNER;
- pelanggan lama berjenis TK dikonversi aman menjadi layanan Tuton dan Karya
  Ilmiah; pilihan TK tidak lagi ditampilkan di aplikasi;
- daftar Karya Ilmiah tetap menampilkan customer yang detailnya belum dibuat,
  sehingga OWNER maupun USER dapat melakukan upsert;
- menu akses cepat Daftar Tuton dihapus, sementara halaman dan API inti Tuton
  tetap dipertahankan agar tidak menghilangkan fungsi lama.

Semua endpoint berada di `/api/attendance`. Login tetap menggunakan login
TaskPilot dan token Bearer yang sama. Role `OWNER` dipetakan ke administrator
modul Absensi, sedangkan `USER` menjadi pekerja.

## Aturan otomatis

Scheduler berjalan setiap lima menit dengan zona waktu `Asia/Jakarta`:

1. Mulai 23:00, `WorkEntry` yang masih `IN_PROGRESS` ditutup otomatis dan
   masuk status `PENDING`.
2. Laporan yang tertinggal dari tanggal sebelumnya juga ditutup pada scheduler
   berikutnya; proses ini aman dijalankan berulang (idempotent).
3. Hanya laporan hasil auto-close yang disetujui otomatis setelah grace period
   empat jam. Laporan checkout manual tetap harus diperiksa OWNER.
4. Borongan checkout manual wajib mengirim minimal satu produk dan jumlah
   produksi positif. Jika borongan kosong terpaksa auto-close, nominalnya nol
   dan diberi penanda agar OWNER dapat mengoreksinya sebelum grace period habis.

Implementasi aturan terdapat di
`server/src/attendance/services/automation.service.ts`. Endpoint OWNER untuk
menjalankan scheduler secara manual adalah:

```text
POST /api/attendance/admin/automation/run
```

## Menjalankan lokal

```bash
cd server
# Tidak perlu bila memakai ZIP karena .env development sudah disertakan.
# Jika mengambil dari Git: cp .env.example .env
npm install
npm run db:up
npm run db:migrate
npm run seed
npm run dev
```

Terminal kedua:

```bash
cd client
npm install
npm run dev
```

Buka `http://localhost:5173`, login dengan akun TaskPilot, lalu pilih menu
**Absensi**.

## Penerapan ke database yang sudah berisi data

Jangan memakai `prisma db push` di production. Lakukan backup terlebih dahulu,
lalu jalankan migration deploy:

```bash
mysqldump --single-transaction --routines --triggers taskpilot > taskpilot-before-attendance.sql
cd server
npm install
npx prisma generate
npx prisma migrate deploy
npm run build
```

Migration `20260813090000_integrate_attendance` menambah internal UUID ke semua
user lama, menyalin `namaLengkap` ke nama modul Absensi, dan membuat tabel baru.
Migration tidak menghapus customer, Tuton, Karil, jam kerja, maupun gaji lama.

Migration `20260813140000_customer_services_and_billing_access` menambahkan
multi-layanan customer, detail Metode Penelitian, izin baca tagihan per user,
dan mengubah default item Tuton baru menjadi 16. Data lama dibackfill dari
nilai `jenis`; record customer dan transaksi lama tidak dihapus.

Migration `20260813170000_unify_payroll_remove_tk_avatar` menambahkan metadata
avatar, menghapus pilihan TK setelah mengonversi customer terkait menjadi
Tuton + Karya Ilmiah, dan memindahkan data payroll legacy ke tabel Absensi.
Migrasi memakai ID deterministik/`INSERT IGNORE`: data Salary dan JamKerja lama
tetap disimpan. Arsip WorkEntry hasil migrasi diberi penanda khusus dan tidak
dihitung sebagai pekerjaan harian. Mesin payroll membaca JamKerja langsung,
menambahkan pekerjaan harian/borongan asli, lalu mengurangi pembayaran pada
ledger Absensi. Dengan demikian sesi JamKerja baru tetap masuk dan arsip
migrasi tidak dihitung dua kali.

Rumus saldo payroll:

```text
upah jam-jaman = jumlah JamKerja SELESAI × tarif per jam efektif user
total pendapatan = upah jam-jaman + upah harian APPROVED + upah borongan APPROVED
sisa gaji = total pendapatan − seluruh pembayaran payroll
```

Avatar disimpan di `server/uploads/avatars`. Pada production, folder ini harus
dipasang sebagai persistent volume dan tetap dapat ditulis oleh proses Node.

## Data dari database Absensi lama

ZIP ini menyatukan schema dan aplikasi. Data historis dari database `absensi`
tidak disalin otomatis karena dump/credential database lama tidak ada di GitHub.
Impor data riil perlu dijalankan terpisah setelah pemetaan username diverifikasi;
jangan memasukkan file `.env` atau dump berisi data pribadi ke repository/ZIP.

## Verifikasi yang dilakukan

- Prisma format + Prisma Client generation: lulus.
- TypeScript backend + production build: lulus.
- TypeScript frontend + Vite production build: lulus.
- ESLint frontend: lulus tanpa error.
- Unit test penggabungan payroll: lulus (2 test).
- `git diff --check`: lulus.

Test integrasi yang membutuhkan MySQL tidak dapat dijalankan di lingkungan
build ZIP karena Docker/MySQL tidak tersedia. Jalankan `npm test` dari folder
`server` setelah database test lokal siap.
