-- AlterTable
ALTER TABLE `Konfigurasi` ADD COLUMN `jedaOtomatisAktif` BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE `User` ADD COLUMN `jedaOtomatis` BOOLEAN NOT NULL DEFAULT true;
