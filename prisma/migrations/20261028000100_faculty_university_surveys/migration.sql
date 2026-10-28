ALTER TABLE `Answer` ADD COLUMN `courseId` VARCHAR(191) NULL;
ALTER TABLE `StudentProfile` ADD COLUMN `academicClassId` VARCHAR(191) NULL;
ALTER TABLE `SurveyCampaign`
  ADD COLUMN `courseTemplateId` VARCHAR(191) NULL,
  ADD COLUMN `facultyId` VARCHAR(191) NULL,
  ADD COLUMN `scope` ENUM('LEGACY_CLASS', 'FACULTY', 'UNIVERSITY') NOT NULL DEFAULT 'LEGACY_CLASS',
  ADD COLUMN `semesterId` VARCHAR(191) NULL;

CREATE TABLE `Faculty` (
  `id` VARCHAR(191) NOT NULL, `code` VARCHAR(191) NOT NULL, `name` VARCHAR(191) NOT NULL,
  UNIQUE INDEX `Faculty_code_key` (`code`), PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE TABLE `AcademicClass` (
  `id` VARCHAR(191) NOT NULL, `code` VARCHAR(191) NOT NULL, `name` VARCHAR(191) NOT NULL, `facultyId` VARCHAR(191) NOT NULL,
  UNIQUE INDEX `AcademicClass_code_key` (`code`), PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE TABLE `CampaignCourse` (
  `campaignId` VARCHAR(191) NOT NULL, `courseId` VARCHAR(191) NOT NULL,
  PRIMARY KEY (`campaignId`, `courseId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE TABLE `ParticipationCourse` (
  `participationId` VARCHAR(191) NOT NULL, `courseId` VARCHAR(191) NOT NULL,
  PRIMARY KEY (`participationId`, `courseId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `AcademicClass` ADD CONSTRAINT `AcademicClass_facultyId_fkey` FOREIGN KEY (`facultyId`) REFERENCES `Faculty` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `StudentProfile` ADD CONSTRAINT `StudentProfile_academicClassId_fkey` FOREIGN KEY (`academicClassId`) REFERENCES `AcademicClass` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `SurveyCampaign` ADD CONSTRAINT `SurveyCampaign_facultyId_fkey` FOREIGN KEY (`facultyId`) REFERENCES `Faculty` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `SurveyCampaign` ADD CONSTRAINT `SurveyCampaign_semesterId_fkey` FOREIGN KEY (`semesterId`) REFERENCES `Semester` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `SurveyCampaign` ADD CONSTRAINT `SurveyCampaign_courseTemplateId_fkey` FOREIGN KEY (`courseTemplateId`) REFERENCES `SurveyTemplate` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `Answer` ADD CONSTRAINT `Answer_courseId_fkey` FOREIGN KEY (`courseId`) REFERENCES `Course` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `CampaignCourse` ADD CONSTRAINT `CampaignCourse_campaignId_fkey` FOREIGN KEY (`campaignId`) REFERENCES `SurveyCampaign` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `CampaignCourse` ADD CONSTRAINT `CampaignCourse_courseId_fkey` FOREIGN KEY (`courseId`) REFERENCES `Course` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `ParticipationCourse` ADD CONSTRAINT `ParticipationCourse_participationId_fkey` FOREIGN KEY (`participationId`) REFERENCES `SurveyParticipation` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `ParticipationCourse` ADD CONSTRAINT `ParticipationCourse_courseId_fkey` FOREIGN KEY (`courseId`) REFERENCES `Course` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
