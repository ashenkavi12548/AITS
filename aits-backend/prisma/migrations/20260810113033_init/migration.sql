-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED', 'PENDING');

-- CreateEnum
CREATE TYPE "RoleName" AS ENUM ('ADMIN', 'FARMER', 'VETERINARY_OFFICER', 'AI_TECHNICIAN', 'GOVERNMENT_OFFICER', 'BANK_OFFICER', 'INSURANCE_OFFICER');

-- CreateEnum
CREATE TYPE "AnimalGender" AS ENUM ('MALE', 'FEMALE');

-- CreateEnum
CREATE TYPE "AnimalStatus" AS ENUM ('ACTIVE', 'SOLD', 'TRANSFERRED', 'DECEASED', 'MISSING', 'QUARANTINED');

-- CreateEnum
CREATE TYPE "IdentifierType" AS ENUM ('QR', 'RFID', 'EAR_TAG', 'NATIONAL_ID', 'OTHER');

-- CreateEnum
CREATE TYPE "HealthStatus" AS ENUM ('HEALTHY', 'SICK', 'UNDER_TREATMENT', 'RECOVERED', 'QUARANTINED');

-- CreateEnum
CREATE TYPE "VaccinationStatus" AS ENUM ('SCHEDULED', 'COMPLETED', 'MISSED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "BreedingStatus" AS ENUM ('PLANNED', 'COMPLETED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PregnancyStatus" AS ENUM ('PENDING', 'CONFIRMED', 'COMPLETED', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "MovementType" AS ENUM ('TRANSFER', 'SALE', 'PURCHASE', 'TEMPORARY', 'VETERINARY', 'QUARANTINE', 'OTHER');

-- CreateEnum
CREATE TYPE "DocumentStatus" AS ENUM ('ACTIVE', 'EXPIRED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "SyncStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'PARTIALLY_COMPLETED', 'FAILED', 'CONFLICTED');

-- CreateEnum
CREATE TYPE "SyncOperation" AS ENUM ('CREATE', 'UPDATE', 'DELETE');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('VACCINATION', 'HEALTH', 'FEEDING', 'DOCUMENT_EXPIRY', 'SYNC', 'BREEDING', 'MOVEMENT', 'SYSTEM');

-- CreateEnum
CREATE TYPE "MilkingSession" AS ENUM ('MORNING', 'AFTERNOON', 'EVENING');

-- CreateEnum
CREATE TYPE "QRCodeStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'REVOKED', 'REPLACED');

-- CreateEnum
CREATE TYPE "FarmStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED', 'PENDING');

-- CreateEnum
CREATE TYPE "FarmUserRole" AS ENUM ('OWNER', 'MANAGER', 'VETERINARIAN', 'WORKER', 'AUDITOR');

-- CreateEnum
CREATE TYPE "FarmUserStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'PENDING');

-- CreateEnum
CREATE TYPE "DiseaseStatus" AS ENUM ('ACTIVE', 'RECOVERED', 'CHRONIC');

-- CreateEnum
CREATE TYPE "TreatmentStatus" AS ENUM ('IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "BreedingMethod" AS ENUM ('ARTIFICIAL_INSEMINATION', 'NATURAL');

-- CreateEnum
CREATE TYPE "TransferStatus" AS ENUM ('PENDING', 'APPROVED', 'COMPLETED', 'REJECTED', 'CANCELLED');

-- CreateTable
CREATE TABLE "User" (
    "id" UUID NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "passwordHash" TEXT NOT NULL,
    "profileImageUrl" TEXT,
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "lastLoginAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Role" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Permission" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Permission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserRole" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "roleId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserRole_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RolePermission" (
    "id" UUID NOT NULL,
    "roleId" UUID NOT NULL,
    "permissionId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RolePermission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Farm" (
    "id" UUID NOT NULL,
    "ownerId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "registrationNumber" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "province" TEXT NOT NULL,
    "district" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "contactNumber" TEXT NOT NULL,
    "farmType" TEXT NOT NULL,
    "status" "FarmStatus" NOT NULL DEFAULT 'ACTIVE',
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Farm_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FarmUser" (
    "id" UUID NOT NULL,
    "farmId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "role" "FarmUserRole" NOT NULL DEFAULT 'WORKER',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "FarmUserStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FarmUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Animal" (
    "id" UUID NOT NULL,
    "farmId" UUID NOT NULL,
    "animalNumber" TEXT NOT NULL,
    "name" TEXT,
    "species" TEXT NOT NULL,
    "breed" TEXT NOT NULL,
    "gender" "AnimalGender" NOT NULL,
    "dateOfBirth" TIMESTAMP(3) NOT NULL,
    "color" TEXT,
    "weight" DOUBLE PRECISION,
    "motherId" UUID,
    "fatherId" UUID,
    "status" "AnimalStatus" NOT NULL DEFAULT 'ACTIVE',
    "registrationDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Animal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnimalIdentifier" (
    "id" UUID NOT NULL,
    "animalId" UUID NOT NULL,
    "identifierType" "IdentifierType" NOT NULL,
    "identifierValue" TEXT NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AnimalIdentifier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QRCode" (
    "id" UUID NOT NULL,
    "animalId" UUID NOT NULL,
    "qrValue" TEXT NOT NULL,
    "qrImageUrl" TEXT NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "activatedAt" TIMESTAMP(3),
    "status" "QRCodeStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QRCode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HealthRecord" (
    "id" UUID NOT NULL,
    "animalId" UUID NOT NULL,
    "recordedById" UUID NOT NULL,
    "recordDate" TIMESTAMP(3) NOT NULL,
    "healthStatus" "HealthStatus" NOT NULL,
    "symptoms" TEXT,
    "diagnosis" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HealthRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Disease" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "severity" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Disease_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnimalDisease" (
    "id" UUID NOT NULL,
    "animalId" UUID NOT NULL,
    "diseaseId" UUID NOT NULL,
    "diagnosedById" UUID NOT NULL,
    "diagnosedDate" TIMESTAMP(3) NOT NULL,
    "recoveryDate" TIMESTAMP(3),
    "status" "DiseaseStatus" NOT NULL DEFAULT 'ACTIVE',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AnimalDisease_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Treatment" (
    "id" UUID NOT NULL,
    "animalId" UUID NOT NULL,
    "healthRecordId" UUID,
    "veterinarianId" UUID NOT NULL,
    "treatmentName" TEXT NOT NULL,
    "description" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "status" "TreatmentStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Treatment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vaccination" (
    "id" UUID NOT NULL,
    "animalId" UUID NOT NULL,
    "administeredById" UUID NOT NULL,
    "vaccineName" TEXT NOT NULL,
    "dose" TEXT NOT NULL,
    "vaccinationDate" TIMESTAMP(3) NOT NULL,
    "nextDueDate" TIMESTAMP(3),
    "batchNumber" TEXT,
    "notes" TEXT,
    "status" "VaccinationStatus" NOT NULL DEFAULT 'COMPLETED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Vaccination_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VeterinaryVisit" (
    "id" UUID NOT NULL,
    "animalId" UUID NOT NULL,
    "veterinarianId" UUID NOT NULL,
    "visitDate" TIMESTAMP(3) NOT NULL,
    "reason" TEXT NOT NULL,
    "findings" TEXT,
    "recommendations" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VeterinaryVisit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeedType" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "unit" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FeedType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeedingRecord" (
    "id" UUID NOT NULL,
    "animalId" UUID NOT NULL,
    "feedTypeId" UUID NOT NULL,
    "recordedById" UUID NOT NULL,
    "fedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "quantity" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FeedingRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MilkProduction" (
    "id" UUID NOT NULL,
    "animalId" UUID NOT NULL,
    "farmId" UUID NOT NULL,
    "recordedById" UUID NOT NULL,
    "productionDate" TIMESTAMP(3) NOT NULL,
    "milkingSession" "MilkingSession" NOT NULL,
    "quantityLiters" DOUBLE PRECISION NOT NULL,
    "milkQuality" TEXT,
    "fatPercentage" DOUBLE PRECISION,
    "proteinPercentage" DOUBLE PRECISION,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MilkProduction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BreedingRecord" (
    "id" UUID NOT NULL,
    "femaleAnimalId" UUID NOT NULL,
    "maleAnimalId" UUID,
    "breedingDate" TIMESTAMP(3) NOT NULL,
    "breedingMethod" "BreedingMethod" NOT NULL DEFAULT 'ARTIFICIAL_INSEMINATION',
    "technicianId" UUID NOT NULL,
    "status" "BreedingStatus" NOT NULL DEFAULT 'COMPLETED',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BreedingRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pregnancy" (
    "id" UUID NOT NULL,
    "animalId" UUID NOT NULL,
    "breedingRecordId" UUID NOT NULL,
    "pregnancyDate" TIMESTAMP(3) NOT NULL,
    "expectedCalvingDate" TIMESTAMP(3) NOT NULL,
    "actualCalvingDate" TIMESTAMP(3),
    "status" "PregnancyStatus" NOT NULL DEFAULT 'CONFIRMED',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Pregnancy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CalvingRecord" (
    "id" UUID NOT NULL,
    "motherId" UUID NOT NULL,
    "pregnancyId" UUID,
    "calvingDate" TIMESTAMP(3) NOT NULL,
    "calfCount" INTEGER NOT NULL DEFAULT 1,
    "calvingType" TEXT NOT NULL,
    "complications" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CalvingRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnimalMovement" (
    "id" UUID NOT NULL,
    "animalId" UUID NOT NULL,
    "fromFarmId" UUID,
    "toFarmId" UUID,
    "movementType" "MovementType" NOT NULL,
    "movementDate" TIMESTAMP(3) NOT NULL,
    "reason" TEXT,
    "transportMethod" TEXT,
    "recordedById" UUID NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AnimalMovement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OwnershipTransfer" (
    "id" UUID NOT NULL,
    "animalId" UUID NOT NULL,
    "previousOwnerId" UUID NOT NULL,
    "newOwnerId" UUID NOT NULL,
    "transferDate" TIMESTAMP(3) NOT NULL,
    "reason" TEXT,
    "documentId" UUID,
    "status" "TransferStatus" NOT NULL DEFAULT 'COMPLETED',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OwnershipTransfer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentType" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DocumentType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Document" (
    "id" UUID NOT NULL,
    "animalId" UUID,
    "farmId" UUID,
    "uploadedById" UUID NOT NULL,
    "documentTypeId" UUID NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "storagePath" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "status" "DocumentStatus" NOT NULL DEFAULT 'ACTIVE',
    "issueDate" TIMESTAMP(3),
    "expiryDate" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "notificationType" "NotificationType" NOT NULL,
    "referenceType" TEXT,
    "referenceId" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationPreference" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "vaccinationNotifications" BOOLEAN NOT NULL DEFAULT true,
    "feedingNotifications" BOOLEAN NOT NULL DEFAULT true,
    "healthNotifications" BOOLEAN NOT NULL DEFAULT true,
    "documentNotifications" BOOLEAN NOT NULL DEFAULT true,
    "syncNotifications" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NotificationPreference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SyncBatch" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "deviceId" TEXT NOT NULL,
    "idempotencyKey" TEXT,
    "clientCreatedAt" TIMESTAMP(3),
    "serverProcessedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "totalRecords" INTEGER NOT NULL DEFAULT 0,
    "successfulRecords" INTEGER NOT NULL DEFAULT 0,
    "failedRecords" INTEGER NOT NULL DEFAULT 0,
    "status" "SyncStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SyncBatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SyncRecord" (
    "id" UUID NOT NULL,
    "syncBatchId" UUID NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "operation" "SyncOperation" NOT NULL,
    "payload" JSONB NOT NULL,
    "clientVersion" INTEGER NOT NULL DEFAULT 1,
    "serverVersion" INTEGER NOT NULL DEFAULT 1,
    "status" "SyncStatus" NOT NULL DEFAULT 'PENDING',
    "errorMessage" TEXT,
    "clientCreatedAt" TIMESTAMP(3),
    "clientUpdatedAt" TIMESTAMP(3),
    "serverProcessedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "syncedAt" TIMESTAMP(3),

    CONSTRAINT "SyncRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" UUID NOT NULL,
    "userId" UUID,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "oldValues" JSONB,
    "newValues" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SystemSetting" (
    "id" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "description" TEXT,
    "updatedById" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SystemSetting_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_deletedAt_idx" ON "User"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Role_name_key" ON "Role"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Permission_name_key" ON "Permission"("name");

-- CreateIndex
CREATE INDEX "UserRole_userId_idx" ON "UserRole"("userId");

-- CreateIndex
CREATE INDEX "UserRole_roleId_idx" ON "UserRole"("roleId");

-- CreateIndex
CREATE UNIQUE INDEX "UserRole_userId_roleId_key" ON "UserRole"("userId", "roleId");

-- CreateIndex
CREATE INDEX "RolePermission_roleId_idx" ON "RolePermission"("roleId");

-- CreateIndex
CREATE INDEX "RolePermission_permissionId_idx" ON "RolePermission"("permissionId");

-- CreateIndex
CREATE UNIQUE INDEX "RolePermission_roleId_permissionId_key" ON "RolePermission"("roleId", "permissionId");

-- CreateIndex
CREATE UNIQUE INDEX "Farm_registrationNumber_key" ON "Farm"("registrationNumber");

-- CreateIndex
CREATE INDEX "Farm_registrationNumber_idx" ON "Farm"("registrationNumber");

-- CreateIndex
CREATE INDEX "Farm_ownerId_idx" ON "Farm"("ownerId");

-- CreateIndex
CREATE INDEX "Farm_deletedAt_idx" ON "Farm"("deletedAt");

-- CreateIndex
CREATE INDEX "FarmUser_farmId_idx" ON "FarmUser"("farmId");

-- CreateIndex
CREATE INDEX "FarmUser_userId_idx" ON "FarmUser"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "FarmUser_farmId_userId_key" ON "FarmUser"("farmId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "Animal_animalNumber_key" ON "Animal"("animalNumber");

-- CreateIndex
CREATE INDEX "Animal_animalNumber_idx" ON "Animal"("animalNumber");

-- CreateIndex
CREATE INDEX "Animal_farmId_idx" ON "Animal"("farmId");

-- CreateIndex
CREATE INDEX "Animal_status_idx" ON "Animal"("status");

-- CreateIndex
CREATE INDEX "Animal_dateOfBirth_idx" ON "Animal"("dateOfBirth");

-- CreateIndex
CREATE INDEX "Animal_motherId_idx" ON "Animal"("motherId");

-- CreateIndex
CREATE INDEX "Animal_fatherId_idx" ON "Animal"("fatherId");

-- CreateIndex
CREATE INDEX "Animal_deletedAt_idx" ON "Animal"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "AnimalIdentifier_identifierValue_key" ON "AnimalIdentifier"("identifierValue");

-- CreateIndex
CREATE INDEX "AnimalIdentifier_identifierValue_idx" ON "AnimalIdentifier"("identifierValue");

-- CreateIndex
CREATE INDEX "AnimalIdentifier_animalId_idx" ON "AnimalIdentifier"("animalId");

-- CreateIndex
CREATE UNIQUE INDEX "QRCode_qrValue_key" ON "QRCode"("qrValue");

-- CreateIndex
CREATE INDEX "QRCode_qrValue_idx" ON "QRCode"("qrValue");

-- CreateIndex
CREATE INDEX "QRCode_animalId_idx" ON "QRCode"("animalId");

-- CreateIndex
CREATE INDEX "HealthRecord_animalId_idx" ON "HealthRecord"("animalId");

-- CreateIndex
CREATE INDEX "HealthRecord_recordedById_idx" ON "HealthRecord"("recordedById");

-- CreateIndex
CREATE UNIQUE INDEX "Disease_name_key" ON "Disease"("name");

-- CreateIndex
CREATE INDEX "AnimalDisease_animalId_idx" ON "AnimalDisease"("animalId");

-- CreateIndex
CREATE INDEX "AnimalDisease_diseaseId_idx" ON "AnimalDisease"("diseaseId");

-- CreateIndex
CREATE INDEX "Treatment_animalId_idx" ON "Treatment"("animalId");

-- CreateIndex
CREATE INDEX "Treatment_veterinarianId_idx" ON "Treatment"("veterinarianId");

-- CreateIndex
CREATE INDEX "Vaccination_animalId_idx" ON "Vaccination"("animalId");

-- CreateIndex
CREATE INDEX "Vaccination_nextDueDate_idx" ON "Vaccination"("nextDueDate");

-- CreateIndex
CREATE INDEX "Vaccination_administeredById_idx" ON "Vaccination"("administeredById");

-- CreateIndex
CREATE INDEX "VeterinaryVisit_animalId_idx" ON "VeterinaryVisit"("animalId");

-- CreateIndex
CREATE INDEX "VeterinaryVisit_veterinarianId_idx" ON "VeterinaryVisit"("veterinarianId");

-- CreateIndex
CREATE UNIQUE INDEX "FeedType_name_key" ON "FeedType"("name");

-- CreateIndex
CREATE INDEX "FeedingRecord_animalId_idx" ON "FeedingRecord"("animalId");

-- CreateIndex
CREATE INDEX "FeedingRecord_feedTypeId_idx" ON "FeedingRecord"("feedTypeId");

-- CreateIndex
CREATE INDEX "FeedingRecord_fedAt_idx" ON "FeedingRecord"("fedAt");

-- CreateIndex
CREATE INDEX "MilkProduction_animalId_idx" ON "MilkProduction"("animalId");

-- CreateIndex
CREATE INDEX "MilkProduction_productionDate_idx" ON "MilkProduction"("productionDate");

-- CreateIndex
CREATE INDEX "MilkProduction_farmId_idx" ON "MilkProduction"("farmId");

-- CreateIndex
CREATE UNIQUE INDEX "MilkProduction_animalId_productionDate_milkingSession_key" ON "MilkProduction"("animalId", "productionDate", "milkingSession");

-- CreateIndex
CREATE INDEX "BreedingRecord_femaleAnimalId_idx" ON "BreedingRecord"("femaleAnimalId");

-- CreateIndex
CREATE INDEX "BreedingRecord_maleAnimalId_idx" ON "BreedingRecord"("maleAnimalId");

-- CreateIndex
CREATE INDEX "BreedingRecord_technicianId_idx" ON "BreedingRecord"("technicianId");

-- CreateIndex
CREATE INDEX "Pregnancy_animalId_idx" ON "Pregnancy"("animalId");

-- CreateIndex
CREATE INDEX "Pregnancy_breedingRecordId_idx" ON "Pregnancy"("breedingRecordId");

-- CreateIndex
CREATE INDEX "CalvingRecord_motherId_idx" ON "CalvingRecord"("motherId");

-- CreateIndex
CREATE INDEX "CalvingRecord_pregnancyId_idx" ON "CalvingRecord"("pregnancyId");

-- CreateIndex
CREATE INDEX "AnimalMovement_animalId_idx" ON "AnimalMovement"("animalId");

-- CreateIndex
CREATE INDEX "AnimalMovement_movementDate_idx" ON "AnimalMovement"("movementDate");

-- CreateIndex
CREATE INDEX "AnimalMovement_fromFarmId_idx" ON "AnimalMovement"("fromFarmId");

-- CreateIndex
CREATE INDEX "AnimalMovement_toFarmId_idx" ON "AnimalMovement"("toFarmId");

-- CreateIndex
CREATE INDEX "OwnershipTransfer_animalId_idx" ON "OwnershipTransfer"("animalId");

-- CreateIndex
CREATE INDEX "OwnershipTransfer_previousOwnerId_idx" ON "OwnershipTransfer"("previousOwnerId");

-- CreateIndex
CREATE INDEX "OwnershipTransfer_newOwnerId_idx" ON "OwnershipTransfer"("newOwnerId");

-- CreateIndex
CREATE UNIQUE INDEX "DocumentType_name_key" ON "DocumentType"("name");

-- CreateIndex
CREATE INDEX "Document_animalId_idx" ON "Document"("animalId");

-- CreateIndex
CREATE INDEX "Document_farmId_idx" ON "Document"("farmId");

-- CreateIndex
CREATE INDEX "Document_expiryDate_idx" ON "Document"("expiryDate");

-- CreateIndex
CREATE INDEX "Document_uploadedById_idx" ON "Document"("uploadedById");

-- CreateIndex
CREATE INDEX "Document_deletedAt_idx" ON "Document"("deletedAt");

-- CreateIndex
CREATE INDEX "Notification_userId_idx" ON "Notification"("userId");

-- CreateIndex
CREATE INDEX "Notification_isRead_idx" ON "Notification"("isRead");

-- CreateIndex
CREATE INDEX "Notification_createdAt_idx" ON "Notification"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "NotificationPreference_userId_key" ON "NotificationPreference"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "SyncBatch_idempotencyKey_key" ON "SyncBatch"("idempotencyKey");

-- CreateIndex
CREATE INDEX "SyncBatch_userId_idx" ON "SyncBatch"("userId");

-- CreateIndex
CREATE INDEX "SyncBatch_status_idx" ON "SyncBatch"("status");

-- CreateIndex
CREATE INDEX "SyncBatch_idempotencyKey_idx" ON "SyncBatch"("idempotencyKey");

-- CreateIndex
CREATE INDEX "SyncRecord_syncBatchId_idx" ON "SyncRecord"("syncBatchId");

-- CreateIndex
CREATE INDEX "SyncRecord_entityType_idx" ON "SyncRecord"("entityType");

-- CreateIndex
CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_idx" ON "AuditLog"("entityType");

-- CreateIndex
CREATE INDEX "AuditLog_entityId_idx" ON "AuditLog"("entityId");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "SystemSetting_key_key" ON "SystemSetting"("key");

-- AddForeignKey
ALTER TABLE "UserRole" ADD CONSTRAINT "UserRole_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserRole" ADD CONSTRAINT "UserRole_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "Permission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Farm" ADD CONSTRAINT "Farm_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FarmUser" ADD CONSTRAINT "FarmUser_farmId_fkey" FOREIGN KEY ("farmId") REFERENCES "Farm"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FarmUser" ADD CONSTRAINT "FarmUser_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Animal" ADD CONSTRAINT "Animal_motherId_fkey" FOREIGN KEY ("motherId") REFERENCES "Animal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Animal" ADD CONSTRAINT "Animal_fatherId_fkey" FOREIGN KEY ("fatherId") REFERENCES "Animal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Animal" ADD CONSTRAINT "Animal_farmId_fkey" FOREIGN KEY ("farmId") REFERENCES "Farm"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnimalIdentifier" ADD CONSTRAINT "AnimalIdentifier_animalId_fkey" FOREIGN KEY ("animalId") REFERENCES "Animal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QRCode" ADD CONSTRAINT "QRCode_animalId_fkey" FOREIGN KEY ("animalId") REFERENCES "Animal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthRecord" ADD CONSTRAINT "HealthRecord_animalId_fkey" FOREIGN KEY ("animalId") REFERENCES "Animal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthRecord" ADD CONSTRAINT "HealthRecord_recordedById_fkey" FOREIGN KEY ("recordedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnimalDisease" ADD CONSTRAINT "AnimalDisease_animalId_fkey" FOREIGN KEY ("animalId") REFERENCES "Animal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnimalDisease" ADD CONSTRAINT "AnimalDisease_diseaseId_fkey" FOREIGN KEY ("diseaseId") REFERENCES "Disease"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnimalDisease" ADD CONSTRAINT "AnimalDisease_diagnosedById_fkey" FOREIGN KEY ("diagnosedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Treatment" ADD CONSTRAINT "Treatment_animalId_fkey" FOREIGN KEY ("animalId") REFERENCES "Animal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Treatment" ADD CONSTRAINT "Treatment_healthRecordId_fkey" FOREIGN KEY ("healthRecordId") REFERENCES "HealthRecord"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Treatment" ADD CONSTRAINT "Treatment_veterinarianId_fkey" FOREIGN KEY ("veterinarianId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vaccination" ADD CONSTRAINT "Vaccination_animalId_fkey" FOREIGN KEY ("animalId") REFERENCES "Animal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vaccination" ADD CONSTRAINT "Vaccination_administeredById_fkey" FOREIGN KEY ("administeredById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VeterinaryVisit" ADD CONSTRAINT "VeterinaryVisit_animalId_fkey" FOREIGN KEY ("animalId") REFERENCES "Animal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VeterinaryVisit" ADD CONSTRAINT "VeterinaryVisit_veterinarianId_fkey" FOREIGN KEY ("veterinarianId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeedingRecord" ADD CONSTRAINT "FeedingRecord_animalId_fkey" FOREIGN KEY ("animalId") REFERENCES "Animal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeedingRecord" ADD CONSTRAINT "FeedingRecord_feedTypeId_fkey" FOREIGN KEY ("feedTypeId") REFERENCES "FeedType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeedingRecord" ADD CONSTRAINT "FeedingRecord_recordedById_fkey" FOREIGN KEY ("recordedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MilkProduction" ADD CONSTRAINT "MilkProduction_animalId_fkey" FOREIGN KEY ("animalId") REFERENCES "Animal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MilkProduction" ADD CONSTRAINT "MilkProduction_farmId_fkey" FOREIGN KEY ("farmId") REFERENCES "Farm"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MilkProduction" ADD CONSTRAINT "MilkProduction_recordedById_fkey" FOREIGN KEY ("recordedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BreedingRecord" ADD CONSTRAINT "BreedingRecord_femaleAnimalId_fkey" FOREIGN KEY ("femaleAnimalId") REFERENCES "Animal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BreedingRecord" ADD CONSTRAINT "BreedingRecord_maleAnimalId_fkey" FOREIGN KEY ("maleAnimalId") REFERENCES "Animal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BreedingRecord" ADD CONSTRAINT "BreedingRecord_technicianId_fkey" FOREIGN KEY ("technicianId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pregnancy" ADD CONSTRAINT "Pregnancy_animalId_fkey" FOREIGN KEY ("animalId") REFERENCES "Animal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pregnancy" ADD CONSTRAINT "Pregnancy_breedingRecordId_fkey" FOREIGN KEY ("breedingRecordId") REFERENCES "BreedingRecord"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalvingRecord" ADD CONSTRAINT "CalvingRecord_motherId_fkey" FOREIGN KEY ("motherId") REFERENCES "Animal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalvingRecord" ADD CONSTRAINT "CalvingRecord_pregnancyId_fkey" FOREIGN KEY ("pregnancyId") REFERENCES "Pregnancy"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnimalMovement" ADD CONSTRAINT "AnimalMovement_animalId_fkey" FOREIGN KEY ("animalId") REFERENCES "Animal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnimalMovement" ADD CONSTRAINT "AnimalMovement_fromFarmId_fkey" FOREIGN KEY ("fromFarmId") REFERENCES "Farm"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnimalMovement" ADD CONSTRAINT "AnimalMovement_toFarmId_fkey" FOREIGN KEY ("toFarmId") REFERENCES "Farm"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnimalMovement" ADD CONSTRAINT "AnimalMovement_recordedById_fkey" FOREIGN KEY ("recordedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OwnershipTransfer" ADD CONSTRAINT "OwnershipTransfer_animalId_fkey" FOREIGN KEY ("animalId") REFERENCES "Animal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OwnershipTransfer" ADD CONSTRAINT "OwnershipTransfer_previousOwnerId_fkey" FOREIGN KEY ("previousOwnerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OwnershipTransfer" ADD CONSTRAINT "OwnershipTransfer_newOwnerId_fkey" FOREIGN KEY ("newOwnerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OwnershipTransfer" ADD CONSTRAINT "OwnershipTransfer_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_animalId_fkey" FOREIGN KEY ("animalId") REFERENCES "Animal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_farmId_fkey" FOREIGN KEY ("farmId") REFERENCES "Farm"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_documentTypeId_fkey" FOREIGN KEY ("documentTypeId") REFERENCES "DocumentType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationPreference" ADD CONSTRAINT "NotificationPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SyncBatch" ADD CONSTRAINT "SyncBatch_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SyncRecord" ADD CONSTRAINT "SyncRecord_syncBatchId_fkey" FOREIGN KEY ("syncBatchId") REFERENCES "SyncBatch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SystemSetting" ADD CONSTRAINT "SystemSetting_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
