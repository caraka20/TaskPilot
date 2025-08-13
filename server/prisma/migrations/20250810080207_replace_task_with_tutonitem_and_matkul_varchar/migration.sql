/*
  Warnings:

  - You are about to drop the `Task` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `Task` DROP FOREIGN KEY `Task_customerId_fkey`;

-- DropForeignKey
ALTER TABLE `Task` DROP FOREIGN KEY `Task_username_fkey`;

-- DropTable
DROP TABLE `Task`;

-- CreateTable
CREATE TABLE `TutonCourse` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `customerId` INTEGER NOT NULL,
    `matkul` VARCHAR(191) NOT NULL,
    `totalItems` INTEGER NOT NULL DEFAULT 19,
    `completedItems` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `TutonCourse_matkul_idx`(`matkul`),
    UNIQUE INDEX `TutonCourse_customerId_matkul_key`(`customerId`, `matkul`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TutonItem` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `courseId` INTEGER NOT NULL,
    `jenis` ENUM('DISKUSI', 'TUGAS', 'ABSEN') NOT NULL,
    `sesi` INTEGER NOT NULL,
    `status` ENUM('BELUM', 'SELESAI') NOT NULL DEFAULT 'BELUM',
    `nilai` DOUBLE NULL,
    `username` VARCHAR(100) NULL,
    `deskripsi` VARCHAR(191) NULL,
    `selesaiAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `TutonItem_username_idx`(`username`),
    UNIQUE INDEX `TutonItem_courseId_jenis_sesi_key`(`courseId`, `jenis`, `sesi`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `TutonCourse` ADD CONSTRAINT `TutonCourse_customerId_fkey` FOREIGN KEY (`customerId`) REFERENCES `Customer`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TutonItem` ADD CONSTRAINT `TutonItem_courseId_fkey` FOREIGN KEY (`courseId`) REFERENCES `TutonCourse`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TutonItem` ADD CONSTRAINT `TutonItem_username_fkey` FOREIGN KEY (`username`) REFERENCES `User`(`username`) ON DELETE SET NULL ON UPDATE CASCADE;
