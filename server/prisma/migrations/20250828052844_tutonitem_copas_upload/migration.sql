-- AlterTable
ALTER TABLE `JamKerja` ADD COLUMN `isOpen` BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE `TutonItem` ADD COLUMN `copas` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `copasAt` DATETIME(3) NULL,
    ADD COLUMN `copasBy` VARCHAR(100) NULL,
    ADD COLUMN `uploadAt` DATETIME(3) NULL,
    ADD COLUMN `uploadBy` VARCHAR(100) NULL,
    ADD COLUMN `uploadNote` VARCHAR(191) NULL,
    ADD COLUMN `uploadUrl` VARCHAR(512) NULL;

-- CreateIndex
CREATE INDEX `JamKerja_username_isOpen_idx` ON `JamKerja`(`username`, `isOpen`);

-- CreateIndex
CREATE INDEX `JamKerja_tanggal_idx` ON `JamKerja`(`tanggal`);

-- CreateIndex
CREATE INDEX `TutonItem_copasBy_idx` ON `TutonItem`(`copasBy`);

-- CreateIndex
CREATE INDEX `TutonItem_uploadBy_idx` ON `TutonItem`(`uploadBy`);

-- AddForeignKey
ALTER TABLE `TutonItem` ADD CONSTRAINT `TutonItem_copasBy_fkey` FOREIGN KEY (`copasBy`) REFERENCES `User`(`username`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TutonItem` ADD CONSTRAINT `TutonItem_uploadBy_fkey` FOREIGN KEY (`uploadBy`) REFERENCES `User`(`username`) ON DELETE SET NULL ON UPDATE CASCADE;
