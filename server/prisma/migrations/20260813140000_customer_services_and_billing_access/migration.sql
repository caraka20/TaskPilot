-- Hak akses sensitif untuk nominal tagihan customer.
ALTER TABLE `User`
  ADD COLUMN `canViewCustomerBilling` BOOLEAN NOT NULL DEFAULT false;

-- Jadwal Tuton saat ini berisi 16 item. Ini hanya mengubah default untuk row
-- baru; data course lama tidak dihapus atau diubah diam-diam.
ALTER TABLE `TutonCourse`
  ALTER COLUMN `totalItems` SET DEFAULT 16;

-- Multi-layanan customer. Kolom `jenis` lama tetap dipertahankan agar kontrak
-- lama dan aplikasi yang sudah terpasang tidak rusak.
ALTER TABLE `Customer`
  ADD COLUMN `layananTuton` BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN `layananKaril` BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN `layananMetodePenelitian` BOOLEAN NOT NULL DEFAULT false;

UPDATE `Customer`
SET
  `layananTuton` = CASE WHEN `jenis` IN ('TUTON', 'TK') THEN true ELSE false END,
  `layananKaril` = CASE WHEN `jenis` IN ('KARIL', 'TK') THEN true ELSE false END;

CREATE TABLE `MetodePenelitianDetail` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `customerId` INTEGER NOT NULL,
  `judul` VARCHAR(191) NOT NULL,
  `tugas1` BOOLEAN NOT NULL DEFAULT false,
  `tugas2` BOOLEAN NOT NULL DEFAULT false,
  `tugas3` BOOLEAN NOT NULL DEFAULT false,
  `tugas4` BOOLEAN NOT NULL DEFAULT false,
  `keterangan` TEXT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,

  UNIQUE INDEX `MetodePenelitianDetail_customerId_key`(`customerId`),
  INDEX `MetodePenelitianDetail_updatedAt_idx`(`updatedAt`),
  PRIMARY KEY (`id`),
  CONSTRAINT `MetodePenelitianDetail_customerId_fkey`
    FOREIGN KEY (`customerId`) REFERENCES `Customer`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
