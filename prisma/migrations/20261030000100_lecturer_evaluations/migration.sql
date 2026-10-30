ALTER TABLE `SurveyCampaign` ADD COLUMN `evaluationMode` VARCHAR(191) NOT NULL DEFAULT 'COURSE';
ALTER TABLE `CourseClass` ADD COLUMN `teachingConfigured` BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE `Answer` ADD COLUMN `lecturerId` VARCHAR(191) NULL;
CREATE TABLE `CourseTeaching` (
  `classId` VARCHAR(191) NOT NULL,
  `lecturerId` VARCHAR(191) NOT NULL,
  PRIMARY KEY (`classId`,`lecturerId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE TABLE `ParticipationTeaching` (
  `participationId` VARCHAR(191) NOT NULL,
  `courseId` VARCHAR(191) NOT NULL,
  `lecturerId` VARCHAR(191) NOT NULL,
  PRIMARY KEY (`participationId`,`courseId`,`lecturerId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE `Answer` ADD CONSTRAINT `Answer_lecturerId_fkey` FOREIGN KEY (`lecturerId`) REFERENCES `LecturerProfile`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `CourseTeaching` ADD CONSTRAINT `CourseTeaching_classId_fkey` FOREIGN KEY (`classId`) REFERENCES `CourseClass`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `CourseTeaching` ADD CONSTRAINT `CourseTeaching_lecturerId_fkey` FOREIGN KEY (`lecturerId`) REFERENCES `LecturerProfile`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `ParticipationTeaching` ADD CONSTRAINT `ParticipationTeaching_participationId_fkey` FOREIGN KEY (`participationId`) REFERENCES `SurveyParticipation`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `ParticipationTeaching` ADD CONSTRAINT `ParticipationTeaching_courseId_fkey` FOREIGN KEY (`courseId`) REFERENCES `Course`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `ParticipationTeaching` ADD CONSTRAINT `ParticipationTeaching_lecturerId_fkey` FOREIGN KEY (`lecturerId`) REFERENCES `LecturerProfile`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
