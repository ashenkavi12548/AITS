CREATE TYPE "DailyActivityType" AS ENUM ('FEEDING', 'WEIGHT_CHECK', 'HEALTH_CHECK', 'GENERAL_OBSERVATION');

CREATE TYPE "ActivitySession" AS ENUM ('MORNING', 'AFTERNOON', 'EVENING', 'NIGHT');

CREATE TYPE "ActivityStatus" AS ENUM ('COMPLETED', 'PENDING', 'CANCELLED');

CREATE TYPE "FarmTransferStatus" AS ENUM ('SCHEDULED', 'IN_TRANSIT', 'ARRIVED', 'COMPLETED', 'CANCELLED');

CREATE TYPE "FarmTransferReason" AS ENUM ('PERMANENT_TRANSFER', 'TEMPORARY_TRANSFER', 'VETERINARY_VISIT', 'BREEDING_PURPOSE', 'GRAZING', 'SALE_OR_MARKET', 'RETURN_TO_ORIGINAL_FARM', 'OTHER');

CREATE TYPE "NotificationPriority" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'CRITICAL');

CREATE TYPE "TaskPriority" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'URGENT');

CREATE TYPE "TaskStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

CREATE TYPE "TaskCategory" AS ENUM ('ANIMAL_CARE', 'FEEDING', 'MILKING', 'HEALTH', 'CLEANING', 'BREEDING', 'MAINTENANCE', 'GENERAL');

CREATE TYPE "QuarantineStatus" AS ENUM ('ACTIVE', 'RELEASED', 'EXTENDED');

CREATE TYPE "ClearanceStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'EXPIRED');

CREATE TYPE "LabResultStatus" AS ENUM ('PENDING', 'NEGATIVE', 'POSITIVE', 'FLAGGED');

CREATE TYPE "HealthCaseStatus" AS ENUM ('OPEN', 'UNDER_INVESTIGATION', 'DIAGNOSED', 'UNDER_TREATMENT', 'UNDER_OBSERVATION', 'CONTAINED', 'FOLLOW_UP', 'RESOLVED', 'CLOSED');

CREATE TYPE "ClinicalCertainty" AS ENUM ('SUSPECTED', 'PROBABLE', 'CONFIRMED', 'RULED_OUT');

CREATE TYPE "BiosecurityRiskLevel" AS ENUM ('LOW', 'MODERATE', 'HIGH', 'CRITICAL');

CREATE TYPE "WithdrawalProduct" AS ENUM ('MILK', 'MEAT', 'EGGS', 'OTHER');

CREATE TYPE "WithdrawalStatus" AS ENUM ('ACTIVE', 'EXPIRED', 'CANCELLED');

CREATE TYPE "LabTestStage" AS ENUM ('REQUESTED', 'COLLECTED', 'SUBMITTED', 'IN_TESTING', 'COMPLETED', 'CANCELLED');

CREATE TYPE "MovementRestrictionType" AS ENUM ('TRANSFER', 'SALE', 'TRANSPORT', 'SLAUGHTER', 'ALL');

CREATE TYPE "AlertSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

CREATE TYPE "FollowUpStatus" AS ENUM ('PENDING', 'COMPLETED', 'MISSED', 'CANCELLED');

ALTER TABLE "HealthRecord" ADD COLUMN "severity" TEXT;
ALTER TABLE "HealthRecord" ADD COLUMN "labResultRequired" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Disease" ADD COLUMN "code" TEXT;
ALTER TABLE "Disease" ADD COLUMN "contagious" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Disease" ADD COLUMN "reportable" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Disease" ADD COLUMN "quarantineRequired" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Disease" ADD COLUMN "movementRestrictionRequired" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Disease" ADD COLUMN "defaultWithdrawalDays" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Disease" ADD COLUMN "active" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "AnimalDisease" ADD COLUMN "caseId" UUID;
ALTER TABLE "Treatment" ADD COLUMN "caseId" UUID;
ALTER TABLE "Treatment" ADD COLUMN "medicationId" UUID;
ALTER TABLE "Treatment" ADD COLUMN "prescriptionNumber" TEXT;
ALTER TABLE "Treatment" ADD COLUMN "category" TEXT;
ALTER TABLE "Treatment" ADD COLUMN "dose" TEXT;
ALTER TABLE "Treatment" ADD COLUMN "route" TEXT;
ALTER TABLE "Treatment" ADD COLUMN "frequency" TEXT;
ALTER TABLE "Treatment" ADD COLUMN "instructions" TEXT;
ALTER TABLE "Treatment" ADD COLUMN "duration" INTEGER;
ALTER TABLE "Treatment" ADD COLUMN "withdrawalMilk" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Treatment" ADD COLUMN "withdrawalMeat" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Treatment" ADD COLUMN "milkWithheld" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Treatment" ADD COLUMN "condition" TEXT;
ALTER TABLE "Vaccination" ADD COLUMN "actualDate" TIMESTAMP(3);
ALTER TABLE "Vaccination" ADD COLUMN "noNextDose" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Vaccination" ADD COLUMN "cancelledAt" TIMESTAMP(3);
ALTER TABLE "Vaccination" ADD COLUMN "cancellationReason" TEXT;
ALTER TABLE "Notification" ADD COLUMN "category" TEXT;
ALTER TABLE "Notification" ADD COLUMN "priority" "NotificationPriority" NOT NULL DEFAULT 'NORMAL';
ALTER TABLE "Notification" ADD COLUMN "actionUrl" TEXT;
ALTER TABLE "Notification" ADD COLUMN "farmId" UUID;
ALTER TABLE "Notification" ADD COLUMN "dedupKey" TEXT;

CREATE TABLE "CalendarEvent" (
    "id" UUID NOT NULL,
    "farmId" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "startTime" TEXT,
    "endTime" TEXT,
    "isAllDay" BOOLEAN NOT NULL DEFAULT true,
    "color" TEXT,
    "category" TEXT,
    "animalId" UUID,
    "createdById" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CalendarEvent_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Medication" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "genericName" TEXT NOT NULL,
    "brandName" TEXT,
    "category" TEXT NOT NULL,
    "activeIngredient" TEXT,
    "formulation" TEXT,
    "strength" TEXT,
    "defaultDose" TEXT,
    "defaultRoute" TEXT,
    "withdrawalMilkDays" INTEGER NOT NULL DEFAULT 0,
    "withdrawalMeatDays" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Medication_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "LabTestCatalog" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "sampleType" TEXT NOT NULL,
    "referenceRange" TEXT,
    "turnaroundDays" INTEGER NOT NULL DEFAULT 1,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LabTestCatalog_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "VaccinationProgram" (
    "id" UUID NOT NULL,
    "farmId" UUID,
    "diseaseId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "targetSpecies" TEXT NOT NULL DEFAULT 'BOVINE',
    "startAgeMonths" INTEGER NOT NULL DEFAULT 3,
    "boosterIntervalDays" INTEGER NOT NULL DEFAULT 180,
    "mandatory" BOOLEAN NOT NULL DEFAULT false,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VaccinationProgram_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "HealthCase" (
    "id" UUID NOT NULL,
    "caseNumber" TEXT NOT NULL,
    "farmId" UUID NOT NULL,
    "animalId" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "chiefComplaint" TEXT,
    "status" "HealthCaseStatus" NOT NULL DEFAULT 'OPEN',
    "veterinarianId" UUID NOT NULL,
    "openedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HealthCase_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ClinicalExamination" (
    "id" UUID NOT NULL,
    "caseId" UUID,
    "animalId" UUID NOT NULL,
    "farmId" UUID NOT NULL,
    "veterinarianId" UUID NOT NULL,
    "examDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "temperature" DOUBLE PRECISION,
    "heartRate" INTEGER,
    "respiratoryRate" INTEGER,
    "rumenMotility" INTEGER,
    "mucousMembranes" TEXT,
    "bodyConditionScore" DOUBLE PRECISION,
    "clinicalSigns" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "initialAssessment" TEXT,
    "certainty" "ClinicalCertainty" NOT NULL DEFAULT 'SUSPECTED',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClinicalExamination_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "WithdrawalPeriod" (
    "id" UUID NOT NULL,
    "treatmentId" UUID,
    "caseId" UUID,
    "animalId" UUID NOT NULL,
    "farmId" UUID NOT NULL,
    "productType" "WithdrawalProduct" NOT NULL DEFAULT 'MILK',
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "status" "WithdrawalStatus" NOT NULL DEFAULT 'ACTIVE',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WithdrawalPeriod_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "BiosecurityRiskAssessment" (
    "id" UUID NOT NULL,
    "caseId" UUID,
    "animalId" UUID NOT NULL,
    "farmId" UUID NOT NULL,
    "assessedById" UUID NOT NULL,
    "riskLevel" "BiosecurityRiskLevel" NOT NULL DEFAULT 'LOW',
    "contagiousnessScore" INTEGER NOT NULL DEFAULT 1,
    "clinicalSeverity" TEXT,
    "exposureScore" INTEGER NOT NULL DEFAULT 1,
    "containmentRecommendation" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BiosecurityRiskAssessment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ExposureRecord" (
    "id" UUID NOT NULL,
    "farmId" UUID NOT NULL,
    "sourceAnimalId" UUID NOT NULL,
    "contactAnimalId" UUID NOT NULL,
    "exposureDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "exposureType" TEXT NOT NULL,
    "location" TEXT,
    "riskLevel" "BiosecurityRiskLevel" NOT NULL DEFAULT 'MODERATE',
    "recommendedAction" TEXT,
    "actionTaken" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExposureRecord_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MovementRestriction" (
    "id" UUID NOT NULL,
    "animalId" UUID NOT NULL,
    "farmId" UUID NOT NULL,
    "imposedById" UUID NOT NULL,
    "reason" TEXT NOT NULL,
    "restrictionType" "MovementRestrictionType" NOT NULL DEFAULT 'ALL',
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "liftedById" UUID,
    "liftedReason" TEXT,
    "liftedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MovementRestriction_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "QuarantineZone" (
    "id" UUID NOT NULL,
    "farmId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "capacity" INTEGER NOT NULL DEFAULT 10,
    "status" TEXT NOT NULL DEFAULT 'available',
    "diseaseRisk" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QuarantineZone_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "QuarantineRecord" (
    "id" UUID NOT NULL,
    "farmId" UUID NOT NULL,
    "animalId" UUID NOT NULL,
    "caseId" UUID,
    "zoneId" UUID,
    "riskAssessmentId" UUID,
    "zoneName" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "expectedRelease" TIMESTAMP(3) NOT NULL,
    "actualRelease" TIMESTAMP(3),
    "status" "QuarantineStatus" NOT NULL DEFAULT 'ACTIVE',
    "orderedById" UUID NOT NULL,
    "releasedById" UUID,
    "releaseCriteriaMet" BOOLEAN NOT NULL DEFAULT false,
    "releaseReason" TEXT,
    "supportingLabResultId" TEXT,
    "govtRef" TEXT,
    "contactAnimals" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QuarantineRecord_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "HealthClearance" (
    "id" UUID NOT NULL,
    "farmId" UUID NOT NULL,
    "animalId" UUID NOT NULL,
    "permitNo" TEXT NOT NULL,
    "clearanceType" TEXT NOT NULL DEFAULT 'TRANSIT',
    "purpose" TEXT NOT NULL,
    "destination" TEXT NOT NULL,
    "issuedById" UUID NOT NULL,
    "issuedDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "validUntil" TIMESTAMP(3) NOT NULL,
    "approvedById" UUID,
    "approvedAt" TIMESTAMP(3),
    "status" "ClearanceStatus" NOT NULL DEFAULT 'PENDING',
    "prerequisitesChecked" BOOLEAN NOT NULL DEFAULT true,
    "revokedById" UUID,
    "revokedAt" TIMESTAMP(3),
    "revocationReason" TEXT,
    "conditions" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HealthClearance_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "LabResult" (
    "id" UUID NOT NULL,
    "farmId" UUID NOT NULL,
    "animalId" UUID NOT NULL,
    "healthRecordId" UUID,
    "testType" TEXT NOT NULL,
    "laboratory" TEXT NOT NULL,
    "sampleDate" TIMESTAMP(3) NOT NULL,
    "resultDate" TIMESTAMP(3),
    "status" "LabResultStatus" NOT NULL DEFAULT 'PENDING',
    "resultText" TEXT,
    "isFlagged" BOOLEAN NOT NULL DEFAULT false,
    "requestedById" UUID NOT NULL,
    "notes" TEXT,
    "documentUrl" TEXT,
    "documentUrls" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LabResult_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "LabTestRecord" (
    "id" UUID NOT NULL,
    "caseId" UUID,
    "animalId" UUID NOT NULL,
    "farmId" UUID NOT NULL,
    "catalogId" UUID,
    "sampleId" TEXT NOT NULL,
    "sampleType" TEXT NOT NULL,
    "collectionDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "collectedById" UUID NOT NULL,
    "laboratory" TEXT NOT NULL,
    "stage" "LabTestStage" NOT NULL DEFAULT 'REQUESTED',
    "resultDate" TIMESTAMP(3),
    "resultValue" TEXT,
    "resultInterpretation" TEXT,
    "isAbnormal" BOOLEAN NOT NULL DEFAULT false,
    "isCritical" BOOLEAN NOT NULL DEFAULT false,
    "reviewedById" UUID,
    "reviewedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LabTestRecord_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "HealthAlert" (
    "id" UUID NOT NULL,
    "farmId" UUID NOT NULL,
    "animalId" UUID,
    "type" TEXT NOT NULL,
    "severity" "AlertSeverity" NOT NULL DEFAULT 'MEDIUM',
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "isResolved" BOOLEAN NOT NULL DEFAULT false,
    "resolvedById" UUID,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HealthAlert_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "FollowUp" (
    "id" UUID NOT NULL,
    "caseId" UUID,
    "animalId" UUID NOT NULL,
    "farmId" UUID NOT NULL,
    "assignedVetId" UUID NOT NULL,
    "scheduledDate" TIMESTAMP(3) NOT NULL,
    "reason" TEXT NOT NULL,
    "status" "FollowUpStatus" NOT NULL DEFAULT 'PENDING',
    "outcome" TEXT,
    "completedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FollowUp_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "DailyActivityLog" (
    "id" UUID NOT NULL,
    "animalId" UUID NOT NULL,
    "farmId" UUID NOT NULL,
    "recordedById" UUID NOT NULL,
    "activityType" "DailyActivityType" NOT NULL,
    "activityDate" DATE NOT NULL,
    "activityTime" TEXT NOT NULL,
    "session" "ActivitySession" NOT NULL,
    "status" "ActivityStatus" NOT NULL DEFAULT 'COMPLETED',
    "notes" TEXT,
    "feedType" TEXT,
    "feedName" TEXT,
    "quantity" DOUBLE PRECISION,
    "unit" TEXT,
    "feedingMethod" TEXT,
    "weightKg" DOUBLE PRECISION,
    "observation" TEXT,
    "temperature" DOUBLE PRECISION,
    "healthStatus" TEXT,
    "symptoms" TEXT,
    "requiresVet" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "DailyActivityLog_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "FarmTransfer" (
    "id" UUID NOT NULL,
    "animalId" UUID NOT NULL,
    "fromFarmId" UUID NOT NULL,
    "toFarmId" UUID NOT NULL,
    "recordedById" UUID NOT NULL,
    "departureDate" DATE NOT NULL,
    "departureTime" TEXT NOT NULL,
    "expectedArrivalDate" DATE NOT NULL,
    "expectedArrivalTime" TEXT NOT NULL,
    "actualArrivalDate" DATE,
    "actualArrivalTime" TEXT,
    "reason" "FarmTransferReason" NOT NULL,
    "status" "FarmTransferStatus" NOT NULL DEFAULT 'SCHEDULED',
    "vehicleNumber" TEXT,
    "driverName" TEXT,
    "driverContact" TEXT,
    "notes" TEXT,
    "cancelReason" TEXT,
    "healthClearanceId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "FarmTransfer_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Task" (
    "id" UUID NOT NULL,
    "farmId" UUID NOT NULL,
    "assignedToId" UUID NOT NULL,
    "createdById" UUID NOT NULL,
    "completedById" UUID,
    "animalId" UUID,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "priority" "TaskPriority" NOT NULL DEFAULT 'NORMAL',
    "status" "TaskStatus" NOT NULL DEFAULT 'PENDING',
    "category" "TaskCategory" NOT NULL DEFAULT 'GENERAL',
    "startDate" TIMESTAMP(3),
    "dueDate" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "CalendarEvent_farmId_idx" ON "CalendarEvent"("farmId");

CREATE INDEX "CalendarEvent_date_idx" ON "CalendarEvent"("date");

CREATE INDEX "CalendarEvent_animalId_idx" ON "CalendarEvent"("animalId");

CREATE INDEX "Disease_code_idx" ON "Disease"("code");

CREATE INDEX "AnimalDisease_caseId_idx" ON "AnimalDisease"("caseId");

CREATE UNIQUE INDEX "Medication_code_key" ON "Medication"("code");

CREATE UNIQUE INDEX "LabTestCatalog_code_key" ON "LabTestCatalog"("code");

CREATE INDEX "VaccinationProgram_farmId_idx" ON "VaccinationProgram"("farmId");

CREATE INDEX "VaccinationProgram_diseaseId_idx" ON "VaccinationProgram"("diseaseId");

CREATE UNIQUE INDEX "HealthCase_caseNumber_key" ON "HealthCase"("caseNumber");

CREATE INDEX "HealthCase_farmId_idx" ON "HealthCase"("farmId");

CREATE INDEX "HealthCase_animalId_idx" ON "HealthCase"("animalId");

CREATE INDEX "HealthCase_status_idx" ON "HealthCase"("status");

CREATE INDEX "HealthCase_caseNumber_idx" ON "HealthCase"("caseNumber");

CREATE INDEX "ClinicalExamination_caseId_idx" ON "ClinicalExamination"("caseId");

CREATE INDEX "ClinicalExamination_animalId_idx" ON "ClinicalExamination"("animalId");

CREATE INDEX "ClinicalExamination_farmId_idx" ON "ClinicalExamination"("farmId");

CREATE INDEX "ClinicalExamination_examDate_idx" ON "ClinicalExamination"("examDate");

CREATE INDEX "Treatment_caseId_idx" ON "Treatment"("caseId");

CREATE INDEX "WithdrawalPeriod_animalId_idx" ON "WithdrawalPeriod"("animalId");

CREATE INDEX "WithdrawalPeriod_farmId_idx" ON "WithdrawalPeriod"("farmId");

CREATE INDEX "WithdrawalPeriod_status_idx" ON "WithdrawalPeriod"("status");

CREATE INDEX "WithdrawalPeriod_endDate_idx" ON "WithdrawalPeriod"("endDate");

CREATE INDEX "BiosecurityRiskAssessment_caseId_idx" ON "BiosecurityRiskAssessment"("caseId");

CREATE INDEX "BiosecurityRiskAssessment_animalId_idx" ON "BiosecurityRiskAssessment"("animalId");

CREATE INDEX "BiosecurityRiskAssessment_farmId_idx" ON "BiosecurityRiskAssessment"("farmId");

CREATE INDEX "BiosecurityRiskAssessment_riskLevel_idx" ON "BiosecurityRiskAssessment"("riskLevel");

CREATE INDEX "ExposureRecord_farmId_idx" ON "ExposureRecord"("farmId");

CREATE INDEX "ExposureRecord_sourceAnimalId_idx" ON "ExposureRecord"("sourceAnimalId");

CREATE INDEX "ExposureRecord_contactAnimalId_idx" ON "ExposureRecord"("contactAnimalId");

CREATE INDEX "ExposureRecord_riskLevel_idx" ON "ExposureRecord"("riskLevel");

CREATE INDEX "MovementRestriction_animalId_idx" ON "MovementRestriction"("animalId");

CREATE INDEX "MovementRestriction_farmId_idx" ON "MovementRestriction"("farmId");

CREATE INDEX "MovementRestriction_status_idx" ON "MovementRestriction"("status");

CREATE INDEX "QuarantineZone_farmId_idx" ON "QuarantineZone"("farmId");

CREATE INDEX "QuarantineRecord_farmId_idx" ON "QuarantineRecord"("farmId");

CREATE INDEX "QuarantineRecord_animalId_idx" ON "QuarantineRecord"("animalId");

CREATE INDEX "QuarantineRecord_status_idx" ON "QuarantineRecord"("status");

CREATE INDEX "QuarantineRecord_zoneId_idx" ON "QuarantineRecord"("zoneId");

CREATE INDEX "QuarantineRecord_caseId_idx" ON "QuarantineRecord"("caseId");

CREATE UNIQUE INDEX "HealthClearance_permitNo_key" ON "HealthClearance"("permitNo");

CREATE INDEX "HealthClearance_farmId_idx" ON "HealthClearance"("farmId");

CREATE INDEX "HealthClearance_animalId_idx" ON "HealthClearance"("animalId");

CREATE INDEX "HealthClearance_permitNo_idx" ON "HealthClearance"("permitNo");

CREATE INDEX "HealthClearance_status_idx" ON "HealthClearance"("status");

CREATE INDEX "LabResult_farmId_idx" ON "LabResult"("farmId");

CREATE INDEX "LabResult_animalId_idx" ON "LabResult"("animalId");

CREATE INDEX "LabResult_healthRecordId_idx" ON "LabResult"("healthRecordId");

CREATE INDEX "LabResult_status_idx" ON "LabResult"("status");

CREATE INDEX "LabResult_isFlagged_idx" ON "LabResult"("isFlagged");

CREATE UNIQUE INDEX "LabTestRecord_sampleId_key" ON "LabTestRecord"("sampleId");

CREATE INDEX "LabTestRecord_caseId_idx" ON "LabTestRecord"("caseId");

CREATE INDEX "LabTestRecord_animalId_idx" ON "LabTestRecord"("animalId");

CREATE INDEX "LabTestRecord_farmId_idx" ON "LabTestRecord"("farmId");

CREATE INDEX "LabTestRecord_stage_idx" ON "LabTestRecord"("stage");

CREATE INDEX "LabTestRecord_isCritical_idx" ON "LabTestRecord"("isCritical");

CREATE INDEX "HealthAlert_farmId_idx" ON "HealthAlert"("farmId");

CREATE INDEX "HealthAlert_animalId_idx" ON "HealthAlert"("animalId");

CREATE INDEX "HealthAlert_isResolved_idx" ON "HealthAlert"("isResolved");

CREATE INDEX "HealthAlert_severity_idx" ON "HealthAlert"("severity");

CREATE INDEX "FollowUp_farmId_idx" ON "FollowUp"("farmId");

CREATE INDEX "FollowUp_animalId_idx" ON "FollowUp"("animalId");

CREATE INDEX "FollowUp_scheduledDate_idx" ON "FollowUp"("scheduledDate");

CREATE INDEX "FollowUp_status_idx" ON "FollowUp"("status");

CREATE INDEX "DailyActivityLog_animalId_idx" ON "DailyActivityLog"("animalId");

CREATE INDEX "DailyActivityLog_farmId_idx" ON "DailyActivityLog"("farmId");

CREATE INDEX "DailyActivityLog_activityDate_idx" ON "DailyActivityLog"("activityDate");

CREATE INDEX "DailyActivityLog_activityType_idx" ON "DailyActivityLog"("activityType");

CREATE INDEX "DailyActivityLog_session_idx" ON "DailyActivityLog"("session");

CREATE INDEX "DailyActivityLog_status_idx" ON "DailyActivityLog"("status");

CREATE INDEX "DailyActivityLog_recordedById_idx" ON "DailyActivityLog"("recordedById");

CREATE INDEX "DailyActivityLog_deletedAt_idx" ON "DailyActivityLog"("deletedAt");

CREATE INDEX "FarmTransfer_animalId_idx" ON "FarmTransfer"("animalId");

CREATE INDEX "FarmTransfer_fromFarmId_idx" ON "FarmTransfer"("fromFarmId");

CREATE INDEX "FarmTransfer_toFarmId_idx" ON "FarmTransfer"("toFarmId");

CREATE INDEX "FarmTransfer_departureDate_idx" ON "FarmTransfer"("departureDate");

CREATE INDEX "FarmTransfer_status_idx" ON "FarmTransfer"("status");

CREATE INDEX "FarmTransfer_reason_idx" ON "FarmTransfer"("reason");

CREATE INDEX "FarmTransfer_recordedById_idx" ON "FarmTransfer"("recordedById");

CREATE INDEX "FarmTransfer_deletedAt_idx" ON "FarmTransfer"("deletedAt");

CREATE INDEX "Notification_farmId_idx" ON "Notification"("farmId");

CREATE INDEX "Notification_dedupKey_idx" ON "Notification"("dedupKey");

CREATE INDEX "Task_farmId_idx" ON "Task"("farmId");

CREATE INDEX "Task_assignedToId_idx" ON "Task"("assignedToId");

CREATE INDEX "Task_status_idx" ON "Task"("status");

CREATE INDEX "Task_dueDate_idx" ON "Task"("dueDate");

ALTER TABLE "CalendarEvent" ADD CONSTRAINT "CalendarEvent_farmId_fkey" FOREIGN KEY ("farmId") REFERENCES "Farm"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CalendarEvent" ADD CONSTRAINT "CalendarEvent_animalId_fkey" FOREIGN KEY ("animalId") REFERENCES "Animal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "CalendarEvent" ADD CONSTRAINT "CalendarEvent_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "AnimalDisease" ADD CONSTRAINT "AnimalDisease_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "HealthCase"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "VaccinationProgram" ADD CONSTRAINT "VaccinationProgram_farmId_fkey" FOREIGN KEY ("farmId") REFERENCES "Farm"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "VaccinationProgram" ADD CONSTRAINT "VaccinationProgram_diseaseId_fkey" FOREIGN KEY ("diseaseId") REFERENCES "Disease"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "HealthCase" ADD CONSTRAINT "HealthCase_farmId_fkey" FOREIGN KEY ("farmId") REFERENCES "Farm"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "HealthCase" ADD CONSTRAINT "HealthCase_animalId_fkey" FOREIGN KEY ("animalId") REFERENCES "Animal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "HealthCase" ADD CONSTRAINT "HealthCase_veterinarianId_fkey" FOREIGN KEY ("veterinarianId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ClinicalExamination" ADD CONSTRAINT "ClinicalExamination_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "HealthCase"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ClinicalExamination" ADD CONSTRAINT "ClinicalExamination_animalId_fkey" FOREIGN KEY ("animalId") REFERENCES "Animal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ClinicalExamination" ADD CONSTRAINT "ClinicalExamination_farmId_fkey" FOREIGN KEY ("farmId") REFERENCES "Farm"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ClinicalExamination" ADD CONSTRAINT "ClinicalExamination_veterinarianId_fkey" FOREIGN KEY ("veterinarianId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Treatment" ADD CONSTRAINT "Treatment_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "HealthCase"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Treatment" ADD CONSTRAINT "Treatment_medicationId_fkey" FOREIGN KEY ("medicationId") REFERENCES "Medication"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "WithdrawalPeriod" ADD CONSTRAINT "WithdrawalPeriod_treatmentId_fkey" FOREIGN KEY ("treatmentId") REFERENCES "Treatment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "WithdrawalPeriod" ADD CONSTRAINT "WithdrawalPeriod_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "HealthCase"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "WithdrawalPeriod" ADD CONSTRAINT "WithdrawalPeriod_animalId_fkey" FOREIGN KEY ("animalId") REFERENCES "Animal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "WithdrawalPeriod" ADD CONSTRAINT "WithdrawalPeriod_farmId_fkey" FOREIGN KEY ("farmId") REFERENCES "Farm"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "BiosecurityRiskAssessment" ADD CONSTRAINT "BiosecurityRiskAssessment_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "HealthCase"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "BiosecurityRiskAssessment" ADD CONSTRAINT "BiosecurityRiskAssessment_animalId_fkey" FOREIGN KEY ("animalId") REFERENCES "Animal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "BiosecurityRiskAssessment" ADD CONSTRAINT "BiosecurityRiskAssessment_farmId_fkey" FOREIGN KEY ("farmId") REFERENCES "Farm"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "BiosecurityRiskAssessment" ADD CONSTRAINT "BiosecurityRiskAssessment_assessedById_fkey" FOREIGN KEY ("assessedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ExposureRecord" ADD CONSTRAINT "ExposureRecord_farmId_fkey" FOREIGN KEY ("farmId") REFERENCES "Farm"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ExposureRecord" ADD CONSTRAINT "ExposureRecord_sourceAnimalId_fkey" FOREIGN KEY ("sourceAnimalId") REFERENCES "Animal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ExposureRecord" ADD CONSTRAINT "ExposureRecord_contactAnimalId_fkey" FOREIGN KEY ("contactAnimalId") REFERENCES "Animal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "MovementRestriction" ADD CONSTRAINT "MovementRestriction_animalId_fkey" FOREIGN KEY ("animalId") REFERENCES "Animal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "MovementRestriction" ADD CONSTRAINT "MovementRestriction_farmId_fkey" FOREIGN KEY ("farmId") REFERENCES "Farm"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "MovementRestriction" ADD CONSTRAINT "MovementRestriction_imposedById_fkey" FOREIGN KEY ("imposedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "MovementRestriction" ADD CONSTRAINT "MovementRestriction_liftedById_fkey" FOREIGN KEY ("liftedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "QuarantineZone" ADD CONSTRAINT "QuarantineZone_farmId_fkey" FOREIGN KEY ("farmId") REFERENCES "Farm"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "QuarantineRecord" ADD CONSTRAINT "QuarantineRecord_farmId_fkey" FOREIGN KEY ("farmId") REFERENCES "Farm"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "QuarantineRecord" ADD CONSTRAINT "QuarantineRecord_animalId_fkey" FOREIGN KEY ("animalId") REFERENCES "Animal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "QuarantineRecord" ADD CONSTRAINT "QuarantineRecord_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "HealthCase"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "QuarantineRecord" ADD CONSTRAINT "QuarantineRecord_zoneId_fkey" FOREIGN KEY ("zoneId") REFERENCES "QuarantineZone"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "QuarantineRecord" ADD CONSTRAINT "QuarantineRecord_riskAssessmentId_fkey" FOREIGN KEY ("riskAssessmentId") REFERENCES "BiosecurityRiskAssessment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "QuarantineRecord" ADD CONSTRAINT "QuarantineRecord_orderedById_fkey" FOREIGN KEY ("orderedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "QuarantineRecord" ADD CONSTRAINT "QuarantineRecord_releasedById_fkey" FOREIGN KEY ("releasedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "HealthClearance" ADD CONSTRAINT "HealthClearance_farmId_fkey" FOREIGN KEY ("farmId") REFERENCES "Farm"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "HealthClearance" ADD CONSTRAINT "HealthClearance_animalId_fkey" FOREIGN KEY ("animalId") REFERENCES "Animal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "HealthClearance" ADD CONSTRAINT "HealthClearance_issuedById_fkey" FOREIGN KEY ("issuedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "HealthClearance" ADD CONSTRAINT "HealthClearance_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "HealthClearance" ADD CONSTRAINT "HealthClearance_revokedById_fkey" FOREIGN KEY ("revokedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "LabResult" ADD CONSTRAINT "LabResult_farmId_fkey" FOREIGN KEY ("farmId") REFERENCES "Farm"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "LabResult" ADD CONSTRAINT "LabResult_animalId_fkey" FOREIGN KEY ("animalId") REFERENCES "Animal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "LabResult" ADD CONSTRAINT "LabResult_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "LabResult" ADD CONSTRAINT "LabResult_healthRecordId_fkey" FOREIGN KEY ("healthRecordId") REFERENCES "HealthRecord"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "LabTestRecord" ADD CONSTRAINT "LabTestRecord_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "HealthCase"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "LabTestRecord" ADD CONSTRAINT "LabTestRecord_animalId_fkey" FOREIGN KEY ("animalId") REFERENCES "Animal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "LabTestRecord" ADD CONSTRAINT "LabTestRecord_farmId_fkey" FOREIGN KEY ("farmId") REFERENCES "Farm"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "LabTestRecord" ADD CONSTRAINT "LabTestRecord_catalogId_fkey" FOREIGN KEY ("catalogId") REFERENCES "LabTestCatalog"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "LabTestRecord" ADD CONSTRAINT "LabTestRecord_collectedById_fkey" FOREIGN KEY ("collectedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "LabTestRecord" ADD CONSTRAINT "LabTestRecord_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "HealthAlert" ADD CONSTRAINT "HealthAlert_farmId_fkey" FOREIGN KEY ("farmId") REFERENCES "Farm"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "HealthAlert" ADD CONSTRAINT "HealthAlert_animalId_fkey" FOREIGN KEY ("animalId") REFERENCES "Animal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "HealthAlert" ADD CONSTRAINT "HealthAlert_resolvedById_fkey" FOREIGN KEY ("resolvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "FollowUp" ADD CONSTRAINT "FollowUp_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "HealthCase"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "FollowUp" ADD CONSTRAINT "FollowUp_animalId_fkey" FOREIGN KEY ("animalId") REFERENCES "Animal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "FollowUp" ADD CONSTRAINT "FollowUp_farmId_fkey" FOREIGN KEY ("farmId") REFERENCES "Farm"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "FollowUp" ADD CONSTRAINT "FollowUp_assignedVetId_fkey" FOREIGN KEY ("assignedVetId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "DailyActivityLog" ADD CONSTRAINT "DailyActivityLog_animalId_fkey" FOREIGN KEY ("animalId") REFERENCES "Animal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "DailyActivityLog" ADD CONSTRAINT "DailyActivityLog_farmId_fkey" FOREIGN KEY ("farmId") REFERENCES "Farm"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "DailyActivityLog" ADD CONSTRAINT "DailyActivityLog_recordedById_fkey" FOREIGN KEY ("recordedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "FarmTransfer" ADD CONSTRAINT "FarmTransfer_animalId_fkey" FOREIGN KEY ("animalId") REFERENCES "Animal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "FarmTransfer" ADD CONSTRAINT "FarmTransfer_fromFarmId_fkey" FOREIGN KEY ("fromFarmId") REFERENCES "Farm"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "FarmTransfer" ADD CONSTRAINT "FarmTransfer_toFarmId_fkey" FOREIGN KEY ("toFarmId") REFERENCES "Farm"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "FarmTransfer" ADD CONSTRAINT "FarmTransfer_recordedById_fkey" FOREIGN KEY ("recordedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "FarmTransfer" ADD CONSTRAINT "FarmTransfer_healthClearanceId_fkey" FOREIGN KEY ("healthClearanceId") REFERENCES "HealthClearance"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Notification" ADD CONSTRAINT "Notification_farmId_fkey" FOREIGN KEY ("farmId") REFERENCES "Farm"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Task" ADD CONSTRAINT "Task_farmId_fkey" FOREIGN KEY ("farmId") REFERENCES "Farm"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Task" ADD CONSTRAINT "Task_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Task" ADD CONSTRAINT "Task_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Task" ADD CONSTRAINT "Task_completedById_fkey" FOREIGN KEY ("completedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Task" ADD CONSTRAINT "Task_animalId_fkey" FOREIGN KEY ("animalId") REFERENCES "Animal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

