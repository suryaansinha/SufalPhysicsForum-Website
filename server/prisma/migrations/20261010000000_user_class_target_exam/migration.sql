-- AlterTable
ALTER TABLE `User`
    ADD COLUMN `classLevel` ENUM('CLASS_9', 'CLASS_10', 'CLASS_11', 'CLASS_12', 'DROPPER') NULL,
    ADD COLUMN `targetExam` ENUM('JEE', 'NEET', 'BOARDS', 'OTHERS') NULL;
