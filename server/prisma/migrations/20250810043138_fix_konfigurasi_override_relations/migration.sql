/*
  Warnings:

  - You are about to alter the column `username` on the `JamKerja` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `VarChar(100)`.
  - You are about to alter the column `username` on the `Salary` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `VarChar(100)`.
  - You are about to alter the column `username` on the `Task` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `VarChar(100)`.

*/
-- DropForeignKey
ALTER TABLE `JamKerja` DROP FOREIGN KEY `JamKerja_username_fkey`;

-- DropForeignKey
ALTER TABLE `Salary` DROP FOREIGN KEY `Salary_username_fkey`;

-- DropForeignKey
ALTER TABLE `Task` DROP FOREIGN KEY `Task_username_fkey`;

-- AlterTable
ALTER TABLE `JamKerja` MODIFY `username` VARCHAR(100) NOT NULL;

-- AlterTable
ALTER TABLE `Salary` MODIFY `username` VARCHAR(100) NOT NULL;

-- AlterTable
ALTER TABLE `Task` MODIFY `username` VARCHAR(100) NULL;

-- CreateTable
CREATE TABLE `KonfigurasiOverride` (
    `username` VARCHAR(100) NOT NULL,
    `gajiPerJam` DOUBLE NULL,
    `batasJedaMenit` INTEGER NULL,
    `jedaOtomatisAktif` BOOLEAN NULL,
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`username`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Task` ADD CONSTRAINT `Task_username_fkey` FOREIGN KEY (`username`) REFERENCES `User`(`username`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `JamKerja` ADD CONSTRAINT `JamKerja_username_fkey` FOREIGN KEY (`username`) REFERENCES `User`(`username`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Salary` ADD CONSTRAINT `Salary_username_fkey` FOREIGN KEY (`username`) REFERENCES `User`(`username`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `KonfigurasiOverride` ADD CONSTRAINT `KonfigurasiOverride_username_fkey` FOREIGN KEY (`username`) REFERENCES `User`(`username`) ON DELETE CASCADE ON UPDATE CASCADE;

-- RenameIndex
ALTER TABLE `JamKerja` RENAME INDEX `JamKerja_username_fkey` TO `JamKerja_username_idx`;

-- RenameIndex
ALTER TABLE `Salary` RENAME INDEX `Salary_username_fkey` TO `Salary_username_idx`;

-- RenameIndex
ALTER TABLE `Task` RENAME INDEX `Task_username_fkey` TO `Task_username_idx`;
