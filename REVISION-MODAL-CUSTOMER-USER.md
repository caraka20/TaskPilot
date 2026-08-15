# Revisi Modal, Customer, dan Detail User

## Perubahan utama

- Modal Absensi sekarang dirender melalui portal langsung ke `document.body`.
  Overlay menutup seluruh viewport dan tidak lagi terpotong sidebar, tab, atau
  container yang memiliki scroll/transform.
- Modal operasional memakai ukuran `100vw × 100dvh` pada mobile dan
  `96vw × 94vh` pada desktop, dengan header tetap, konten scroll, footer form
  sticky, focus trap, tombol tutup 44 px, dan dukungan tombol Escape.
- Modal HeroUI lama memakai satu style reusable yang sama agar Payroll,
  Customer, Karil, Tuton, User, dan konfigurasi tetap konsisten.
- Header customer diringkas menjadi nama, NIM, dan password. NIM/password dapat
  disalin, password memiliki show/hide, dan seluruh kontrol tetap nyaman disentuh.
- Layanan akademik tampil lebih dahulu. Identitas pendukung dipindah ke bawah
  layanan dan dibuat ringkas (program studi, WhatsApp, tanggal terdaftar, edit).
- Dashboard OWNER tidak lagi menampilkan Piutang Customer maupun Progres
  Akademik/Penyelesaian Layanan. Kartu ringkasan, payroll terpadu, komposisi
  layanan, aktivitas kerja, dan pembayaran terbaru dirapikan kembali.
- Menu dan route Konfigurasi hanya terlihat/dapat dibuka oleh OWNER. Endpoint
  konfigurasi efektif tetap boleh dibaca secara internal oleh USER karena aturan
  tersebut masih dipakai oleh logika absensi, bukan ditampilkan sebagai halaman.
- URL foto profil kini dinormalisasi terhadap alamat backend dan Vite meneruskan
  `/uploads`, sehingga foto yang sudah diunggah tampil di sidebar, navigasi
  mobile, akun, daftar user, dan detail user.
- Hak akses tagihan customer kini berlaku untuk baca dan tulis. USER berizin
  dapat melihat nominal/riwayat, memperbarui total tagihan, menambah pembayaran,
  serta melakukan pelunasan. USER tanpa izin tetap mendapat `403` dari API.
- Detail user yang dibuka OWNER dirombak menjadi profil ringkas, kontrol akses,
  konfigurasi jeda, kendali sesi kerja, ringkasan jam, payroll terpadu, dan
  histori kerja dengan hierarki yang lebih jelas.

## Menjalankan

Ikuti `RUNNING-LOCAL.md`. Untuk instalasi pertama, mulai backend dan database:

```bash
cd server
cp -n .env.example .env
SECRET="$(openssl rand -hex 32)"
sed -i '' "s/replace-with-a-long-random-secret/$SECRET/" .env
npm install
npm run db:setup
npm run dev
```

Kemudian jalankan frontend pada terminal kedua:

```bash
cd client
cp -n .env.example .env
npm install
npm run dev
```

Permission tagihan dibaca backend dari database pada setiap request. User cukup
memuat ulang halaman Customer setelah OWNER mengubah akses; token lama tidak
memberikan akses tambahan ketika permission sudah dicabut.
