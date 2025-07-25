/*
  Warnings:

  - You are about to drop the column `userId` on the `Gaji` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `JamKerja` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `Task` table. All the data in the column will be lost.
  - The primary key for the `User` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `email` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `id` on the `User` table. All the data in the column will be lost.
  - You are about to alter the column `namaLengkap` on the `User` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `VarChar(100)`.
  - Added the required column `username` to the `Gaji` table without a default value. This is not possible if the table is not empty.
  - Added the required column `username` to the `JamKerja` table without a default value. This is not possible if the table is not empty.
  - Added the required column `username` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `Gaji` DROP FOREIGN KEY `Gaji_userId_fkey`;

-- DropForeignKey
ALTER TABLE `JamKerja` DROP FOREIGN KEY `JamKerja_userId_fkey`;

-- DropForeignKey
ALTER TABLE `Task` DROP FOREIGN KEY `Task_userId_fkey`;

-- DropIndex
DROP INDEX `Gaji_userId_fkey` ON `Gaji`;

-- DropIndex
DROP INDEX `JamKerja_userId_fkey` ON `JamKerja`;

-- DropIndex
DROP INDEX `Task_userId_fkey` ON `Task`;

-- DropIndex
DROP INDEX `User_email_key` ON `User`;

-- AlterTable
ALTER TABLE `Gaji` DROP COLUMN `userId`,
    ADD COLUMN `username` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `JamKerja` DROP COLUMN `userId`,
    ADD COLUMN `username` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `Task` DROP COLUMN `userId`,
    ADD COLUMN `username` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `User` DROP PRIMARY KEY,
    DROP COLUMN `email`,
    DROP COLUMN `id`,
    ADD COLUMN `username` VARCHAR(100) NOT NULL,
    MODIFY `namaLengkap` VARCHAR(100) NOT NULL,
    ADD PRIMARY KEY (`username`);

-- AddForeignKey
ALTER TABLE `Task` ADD CONSTRAINT `Task_username_fkey` FOREIGN KEY (`username`) REFERENCES `User`(`username`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `JamKerja` ADD CONSTRAINT `JamKerja_username_fkey` FOREIGN KEY (`username`) REFERENCES `User`(`username`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Gaji` ADD CONSTRAINT `Gaji_username_fkey` FOREIGN KEY (`username`) REFERENCES `User`(`username`) ON DELETE RESTRICT ON UPDATE CASCADE;
