-- CreateEnum
ALTER TABLE `ForumQuestion`
    ADD COLUMN `status` ENUM('PENDING', 'ANSWERED') NOT NULL DEFAULT 'PENDING';

-- CreateTable
CREATE TABLE `ForumQuestionImage` (
    `id` VARCHAR(191) NOT NULL,
    `questionId` VARCHAR(191) NOT NULL,
    `url` VARCHAR(512) NOT NULL,
    `publicId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ForumQuestionImage_questionId_idx`(`questionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `ForumQuestionImage` ADD CONSTRAINT `ForumQuestionImage_questionId_fkey` FOREIGN KEY (`questionId`) REFERENCES `ForumQuestion`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill existing imageUrl rows. publicId is left empty so destroy is skipped for legacy assets.
INSERT INTO `ForumQuestionImage` (`id`, `questionId`, `url`, `publicId`, `createdAt`)
SELECT CONCAT('img_', `id`), `id`, `imageUrl`, '', NOW()
FROM `ForumQuestion`
WHERE `imageUrl` IS NOT NULL AND `imageUrl` <> '';

-- DropColumn
ALTER TABLE `ForumQuestion` DROP COLUMN `imageUrl`;
