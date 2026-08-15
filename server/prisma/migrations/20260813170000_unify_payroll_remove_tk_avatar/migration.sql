-- TaskPilot v4: satu sumber payroll, penghentian TK, dan avatar user.
-- Migrasi ini aman dijalankan sekali oleh Prisma Migrate. Data lama tidak
-- dihapus: Salary/JamKerja tetap menjadi arsip, sementara salinannya dibuat
-- dengan ID deterministik pada modul Absensi agar tidak terjadi duplikasi.

ALTER TABLE `User`
  ADD COLUMN `avatarUrl` VARCHAR(255) NULL;

-- TK sekarang direpresentasikan sebagai dua layanan independen.
UPDATE `Customer`
SET `layananTuton` = true,
    `layananKaril` = true,
    `jenis` = 'TUTON'
WHERE `jenis` = 'TK';

ALTER TABLE `Customer`
  MODIFY `jenis` ENUM('TUTON', 'KARIL') NOT NULL;

-- Pembayaran gaji lama dipindahkan ke ledger Payment (Absensi).
-- Legacy row disimpan; INSERT IGNORE + ID deterministik mencegah hitung ganda.
INSERT IGNORE INTO `Payment` (
  `id`, `userId`, `paymentDate`, `amount`, `note`, `createdById`, `createdAt`, `updatedAt`
)
SELECT
  CONCAT('legacy-salary-', salary.`id`),
  employee.`id`,
  DATE(salary.`tanggalBayar`),
  salary.`jumlahBayar`,
  LEFT(CONCAT('[Migrasi payroll lama] ', COALESCE(salary.`catatan`, '')), 255),
  COALESCE((SELECT owner_user.`id` FROM `User` owner_user WHERE owner_user.`role` = 'OWNER' ORDER BY owner_user.`createdAt` ASC LIMIT 1), employee.`id`),
  salary.`createdAt`,
  salary.`updatedAt`
FROM `Salary` salary
INNER JOIN `User` employee ON employee.`username` = salary.`username`;

-- Jam kerja lama diringkas satu baris per user/tanggal agar cocok dengan
-- constraint WorkEntry(userId, workDate). Hanya tanggal yang belum memiliki
-- WorkEntry yang dimigrasikan sehingga data Absensi yang lebih baru menang.
INSERT IGNORE INTO `WorkEntry` (
  `id`, `userId`, `workDate`, `mode`, `status`, `clockIn`, `clockOut`, `note`,
  `dailyRateSnapshot`, `finalAmount`, `submittedAt`, `approvedById`, `approvedAt`,
  `correctionReason`, `automationReason`, `createdAt`, `updatedAt`
)
SELECT
  CONCAT('legacy-jam-', REPLACE(employee.`id`, '-', ''), '-', DATE_FORMAT(MIN(legacy_work.`tanggal`), '%Y%m%d')),
  employee.`id`,
  DATE(legacy_work.`tanggal`),
  'DAILY',
  'APPROVED',
  MIN(legacy_work.`jamMulai`),
  MAX(COALESCE(legacy_work.`jamSelesai`, legacy_work.`jamMulai`)),
  'Migrasi otomatis dari riwayat jam kerja TaskPilot',
  COALESCE(user_config.`gajiPerJam`, global_config.`gajiPerJam`, 0),
  ROUND(SUM(COALESCE(legacy_work.`totalJam`, 0)) * COALESCE(user_config.`gajiPerJam`, global_config.`gajiPerJam`, 0), 2),
  MAX(COALESCE(legacy_work.`jamSelesai`, legacy_work.`updatedAt`)),
  COALESCE((SELECT owner_user.`id` FROM `User` owner_user WHERE owner_user.`role` = 'OWNER' ORDER BY owner_user.`createdAt` ASC LIMIT 1), employee.`id`),
  MAX(COALESCE(legacy_work.`jamSelesai`, legacy_work.`updatedAt`)),
  'Migrasi riwayat jam kerja lama',
  'LEGACY_TASKPILOT_MIGRATION',
  MIN(legacy_work.`createdAt`),
  MAX(legacy_work.`updatedAt`)
FROM `JamKerja` legacy_work
INNER JOIN `User` employee ON employee.`username` = legacy_work.`username`
LEFT JOIN `KonfigurasiOverride` user_config ON user_config.`username` = employee.`username`
LEFT JOIN `Konfigurasi` global_config ON global_config.`id` = 1
LEFT JOIN `WorkEntry` current_work
  ON current_work.`userId` = employee.`id`
  AND current_work.`workDate` = DATE(legacy_work.`tanggal`)
WHERE current_work.`id` IS NULL
GROUP BY
  employee.`id`,
  DATE(legacy_work.`tanggal`),
  user_config.`gajiPerJam`,
  global_config.`gajiPerJam`;
