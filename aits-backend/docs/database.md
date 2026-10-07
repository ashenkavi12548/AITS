# AITS Database Architecture Reference

This document provides a comprehensive technical overview of the central PostgreSQL database schema for the **Animal Identification & Traceability System (AITS)** managed via Prisma ORM v7.

---

## 1. Overview & Core Design Principles

- **Single Gateway**: PostgreSQL is accessible ONLY through the NestJS REST API. Neither Web nor Mobile frontends connect directly to PostgreSQL.
- **UUID Primary Keys**: Every table uses UUID v4 primary keys (`@db.Uuid`).
- **Global Animal Numbering**: `animalNumber` is enforced as `@unique` globally because AITS acts as a national identification system.
- **Explicit Genealogy Relations**: Self-referencing parental links on `Animal` use explicit, unambiguous relations:
  - `mother`: Dam reference (`SetNull` on delete)
  - `father`: Sire reference (`SetNull` on delete)
  - `childrenAsMother`: Offspring list where animal is the dam
  - `childrenAsFather`: Offspring list where animal is the sire
- **Milk Production Duplicate Protection**: Uniqueness constraint on `@@unique([animalId, productionDate, milkingSession])` prevents duplicate daily session yield entries.
- **Single Active QR & Primary Identifier**:
  - `QRCode`: Historical records retained; service logic enforces only one active QR code (`status = ACTIVE`) per animal inside Prisma transactions.
  - `AnimalIdentifier`: Enforces only one primary identifier (`isPrimary = true`) per animal inside Prisma transactions.
- **Soft Delete Strategy**: Master entities (`User`, `Farm`, `Animal`, `Role`, `Permission`, `Document`, `FeedType`, `Disease`) feature `deletedAt DateTime?`. Traceability records (`AnimalMovement`, `OwnershipTransfer`, `AuditLog`) remain immutable and exempt from physical or soft deletions.
- **Cascade Protections**: Historical traceability data uses `Restrict` or `SetNull` to preserve lineage and audit logs when related entities are modified.
- **Dockerized PostgreSQL**: Standardized `postgres:16-alpine` Docker service with healthcheck and data volume persistence (`postgres_aits_data`), paired with Adminer web UI on port 8080.

---

## 2. Docker Quickstart

```bash
# Start PostgreSQL (port 5432) & Adminer UI (port 8080)
docker compose up -d

# View container status
docker compose ps
```

## 2. Table & Model Summary

### Authentication & Authorization
- `User`: User accounts with bcrypt hashed passwords and RBAC roles.
- `Role`: System roles (`ADMIN`, `FARMER`, `VETERINARY_OFFICER`, `AI_TECHNICIAN`, `GOVERNMENT_OFFICER`, `BANK_OFFICER`, `INSURANCE_OFFICER`).
- `Permission`: Granular system capabilities.
- `UserRole`: Many-to-many user-role assignments (`@@unique([userId, roleId])`).
- `RolePermission`: Many-to-many role-permission mappings (`@@unique([roleId, permissionId])`).

### Farm & Staff Management
- `Farm`: Farm registration (`registrationNumber` unique, GPS coordinates, location metadata).
- `FarmUser`: Staff memberships (`OWNER`, `MANAGER`, `VETERINARIAN`, `WORKER`, `AUDITOR`).

### Animal & Lineage
- `Animal`: Central animal record with explicit genealogy relations and weight/birth tracking.
- `AnimalIdentifier`: Tag registration (`QR`, `RFID`, `EAR_TAG`, `NATIONAL_ID`, `OTHER`).
- `QRCode`: Historical QR records (`qrValue` unique, cloud image URL, status).

### Health & Treatments
- `HealthRecord`: Clinical evaluations and symptoms.
- `Disease`: Master disease catalog with severity ranks.
- `AnimalDisease`: Diagnosed disease occurrences.
- `Treatment`: Prescribed and administered treatment logs.
- `Vaccination`: Vaccination records with `nextDueDate` tracking.
- `VeterinaryVisit`: Vet consultation logs.

### Production & Feeding
- `FeedType`: Feed catalog (`GREEN_FODDER`, `CONCENTRATE`, `SILAGE`, etc.).
- `FeedingRecord`: Logged feeding events with `fedAt DateTime` timestamps.
- `MilkProduction`: Milking yield records (`MORNING`, `AFTERNOON`, `EVENING`) with quality and fat percentage metrics.

### Reproduction & Lineage
- `BreedingRecord`: Artificial insemination / natural breeding events.
- `Pregnancy`: Gestation tracking with expected and actual calving dates.
- `CalvingRecord`: Birth logs (`motherId`, calf count, complications).

### Traceability & Ownership
- `AnimalMovement`: Transport and farm-to-farm movement logs (`fromFarmId`, `toFarmId`).
- `OwnershipTransfer`: Ownership transfer records (`previousOwnerId`, `newOwnerId`).

### Documents & Media
- `DocumentType`: Metadata catalog (`OWNERSHIP_CERTIFICATE`, `HEALTH_CERTIFICATE`, etc.).
- `Document`: File metadata references pointing to Google Cloud Storage object paths (`storagePath`).

### Notifications, Sync & System
- `Notification`: In-app notification messages.
- `NotificationPreference`: User alert channel configurations.
- `SyncBatch`: Mobile offline synchronization execution batches with `idempotencyKey`.
- `SyncRecord`: Sync operation payloads with `clientVersion` and `serverVersion` conflict tracking.
- `AuditLog`: Append-only audit trail (`oldValues` and `newValues` JSONB snapshots).
- `SystemSetting`: Global key-value configurations (`qr_code_prefix`, `sync_max_batch_size`).

---

## 3. Migration & Seeding Instructions

```bash
# Format schema
npx prisma format

# Validate schema
npx prisma validate

# Generate Prisma Client
npx prisma generate

# Create and apply migration
npx prisma migrate dev --name fix_aits_database_structure

# Run seed script
npx prisma db seed
```
