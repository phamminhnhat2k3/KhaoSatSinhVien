CREATE TABLE `ClassStudyAssignment` (
 `academicClassId` VARCHAR(191) NOT NULL,
 `classId` VARCHAR(191) NOT NULL,
 PRIMARY KEY (`academicClassId`,`classId`),
 CONSTRAINT `ClassStudyAssignment_academicClassId_fkey` FOREIGN KEY (`academicClassId`) REFERENCES `AcademicClass`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
 CONSTRAINT `ClassStudyAssignment_classId_fkey` FOREIGN KEY (`classId`) REFERENCES `CourseClass`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE TABLE `StudentStudyPlan` (
 `studentId` VARCHAR(191) NOT NULL,
 `semesterId` VARCHAR(191) NOT NULL,
 PRIMARY KEY (`studentId`,`semesterId`),
 CONSTRAINT `StudentStudyPlan_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `StudentProfile`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
 CONSTRAINT `StudentStudyPlan_semesterId_fkey` FOREIGN KEY (`semesterId`) REFERENCES `Semester`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE TABLE `CampaignAcademicClass` (
 `campaignId` VARCHAR(191) NOT NULL,
 `academicClassId` VARCHAR(191) NOT NULL,
 PRIMARY KEY (`campaignId`,`academicClassId`),
 CONSTRAINT `CampaignAcademicClass_campaignId_fkey` FOREIGN KEY (`campaignId`) REFERENCES `SurveyCampaign`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
 CONSTRAINT `CampaignAcademicClass_academicClassId_fkey` FOREIGN KEY (`academicClassId`) REFERENCES `AcademicClass`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
