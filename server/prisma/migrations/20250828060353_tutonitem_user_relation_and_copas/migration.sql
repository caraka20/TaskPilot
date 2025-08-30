/*
  Warnings:

  - You are about to drop the column `copas` on the `TutonItem` table. All the data in the column will be lost.
  - You are about to drop the column `copasAt` on the `TutonItem` table. All the data in the column will be lost.
  - You are about to drop the column `copasBy` on the `TutonItem` table. All the data in the column will be lost.
  - You are about to drop the column `uploadAt` on the `TutonItem` table. All the data in the column will be lost.
  - You are about to drop the column `uploadBy` on the `TutonItem` table. All the data in the column will be lost.
  - You are about to drop the column `uploadNote` on the `TutonItem` table. All the data in the column will be lost.
  - You are about to drop the column `uploadUrl` on the `TutonItem` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE `TutonItem` DROP FOREIGN KEY `TutonItem_copasBy_fkey`;

-- DropForeignKey
ALTER TABLE `TutonItem` DROP FOREIGN KEY `TutonItem_uploadBy_fkey`;

-- DropIndex
DROP INDEX `TutonItem_copasBy_idx` ON `TutonItem`;

-- DropIndex
DROP INDEX `TutonItem_uploadBy_idx` ON `TutonItem`;

-- AlterTable
ALTER TABLE `TutonItem` DROP COLUMN `copas`,
    DROP COLUMN `copasAt`,
    DROP COLUMN `copasBy`,
    DROP COLUMN `uploadAt`,
    DROP COLUMN `uploadBy`,
    DROP COLUMN `uploadNote`,
    DROP COLUMN `uploadUrl`,
    ADD COLUMN `copasSoal` BOOLEAN NOT NULL DEFAULT false;
