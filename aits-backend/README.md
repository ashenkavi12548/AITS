# Animal Identification & Traceability System (AITS) - Backend API

The central backend API and database system for the **Animal Identification & Traceability System (AITS)**.

Built with **NestJS**, **TypeScript**, **PostgreSQL**, and **Prisma ORM (v7.9.1)**.

---

## 🏗️ 1. Architecture Overview

```
+--------------------------+       +--------------------------+
|  Next.js Web Application |       | React Native / Expo App  |
|     (aits-frontend)      |       |      (aits-mobile)       |
+--------------------------+       +--------------------------+
             |                                  |
             +----------------+-----------------+
                              |
                              | REST API (HTTPS + JWT)
                              v
             +----------------------------------+
             |          NestJS Backend          |
             |          (aits-backend)          |
             |                                  |
             |  +----------------------------+  |
             |  | Global PrismaService       |  |
             |  +----------------------------+  |
             +----------------------------------+
                              |
                              | Prisma ORM v7
                              v
             +----------------------------------+
             |       PostgreSQL Database        |
             |          (Central DB)            |
             +----------------------------------+
```

The PostgreSQL database acts as the **CENTRAL DATABASE** for the entire AITS ecosystem. The NestJS API is the sole application permitted to directly connect to PostgreSQL. Both Web and Mobile applications communicate exclusively via REST endpoints.

---

## 🗄️ 2. PostgreSQL Database Models (32 Models)

The system features 32 normalized models and 23 enums:

- **Authentication & RBAC**: `User`, `Role`, `Permission`, `UserRole`, `RolePermission`
- **Farm Management**: `Farm`, `FarmUser`
- **Animal & Lineage**: `Animal` (Explicit genealogy self-relations: `mother`, `father`, `childrenAsMother`, `childrenAsFather`), `AnimalIdentifier`, `QRCode`
- **Health Management**: `HealthRecord`, `Disease`, `AnimalDisease`, `Treatment`, `Vaccination`, `VeterinaryVisit`
- **Feeding & Production**: `FeedType`, `FeedingRecord` (`fedAt`), `MilkProduction` (`@@unique([animalId, productionDate, milkingSession])`)
- **Reproduction**: `BreedingRecord`, `Pregnancy`, `CalvingRecord`
- **Movement & Ownership**: `AnimalMovement`, `OwnershipTransfer`
- **Document Management**: `DocumentType`, `Document` (Google Cloud Storage metadata references)
- **Notifications & Preferences**: `Notification`, `NotificationPreference`
- **Offline Synchronization**: `SyncBatch` (`idempotencyKey`, `deviceId`), `SyncRecord` (`clientVersion`, `serverVersion`, `CONFLICTED` status)
- **Audit & Settings**: `AuditLog` (Append-only), `SystemSetting`

---

## 🎯 3. Key Design Decisions

### A. Global Animal Identification Number (`animalNumber @unique`)
In accordance with national traceability requirements, `animalNumber` is enforced as `@unique` globally across the database. AITS serves as a national registry where each registered animal possesses an unambiguous, nationwide identifier.

### B. Single Active QR Code & Primary Identifier Constraints
- **QR Codes**: An animal can maintain historical QR records (`ACTIVE`, `REPLACED`, `REVOKED`). The `QrService` enforces inside a Prisma transaction that only ONE QR code remains `ACTIVE` for any given animal.
- **Identifiers**: An animal can have multiple identifiers (`QR`, `RFID`, `EAR_TAG`, `NATIONAL_ID`, `OTHER`). The `IdentifiersService` enforces inside a Prisma transaction that only ONE identifier has `isPrimary = true`.

### C. Soft Deletion & Cascade Protections
- Master entities (`User`, `Farm`, `Animal`, `Role`, `Permission`, `Document`, `FeedType`, `Disease`) use soft deletion (`deletedAt DateTime?`).
- Critical historical traceability records (`AnimalMovement`, `OwnershipTransfer`, `AuditLog`, `HealthRecord`, `Vaccination`, `MilkProduction`) are immutable and protected with `Restrict` or `SetNull` foreign key constraints to prevent historical data loss.

### D. Ownership Model
Currently, `OwnershipTransfer` tracks transfers between system `User` accounts (`previousOwnerId` -> `newOwnerId`). In future system iterations requiring corporate, farm, bank, or institutional ownership, a dedicated `Owner` entity can be introduced without disrupting existing movement history.

---

## 🛠️ 4. Setup & Environment Configuration

### Environment File (`.env`)

Copy `.env.example` to `.env` and fill in credentials:

```bash
cp .env.example .env
```

Key environment variables:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/aits?schema=public"
JWT_SECRET="super-secret-jwt-key"
JWT_EXPIRES_IN="7d"
GOOGLE_CLOUD_PROJECT_ID="aits-gcp-project"
GOOGLE_CLOUD_STORAGE_BUCKET="aits-documents-bucket"
FIREBASE_PROJECT_ID="aits-firebase-app"
```

---

## 🐳 5. Docker PostgreSQL & Adminer Setup

A pre-configured Docker Compose environment is provided for local development.

### Start Containers
```bash
# Start PostgreSQL (port 5432) & Adminer (port 8080)
npm run db:docker
# OR: docker compose up -d
```

### Stop Containers
```bash
npm run db:docker:down
```

### Database Management UI (Adminer)
Open [http://localhost:8080](http://localhost:8080) in your browser:
- **System**: PostgreSQL
- **Server**: `postgres` (or `localhost`)
- **Username**: `postgres`
- **Password**: `postgres`
- **Database**: `aits`

---

## 🚀 6. Database Migration & Seed Instructions

```bash
# 1. Format Prisma Schema
npx prisma format

# 2. Validate Prisma Schema
npx prisma validate

# 3. Generate Prisma Client
npx prisma generate

# 4. Create and Apply Database Migration
npx prisma migrate dev --name fix_aits_database_structure

# 5. Execute Database Seed
npx prisma db seed

# 6. Build NestJS Application
npm run build

# 7. Start Development Server
npm run start:dev
```

---

## 📁 6. Extended Documentation Suite

For detailed technical specifications, refer to the documentation in `docs/`:

- [docs/database.md](file:///c:/Users/Lenovo/Documents/Work%20Hub/Web%20Projects/Animal%20Identification%20and%20Tracking%20System/aits-backend/docs/database.md): Complete Data Dictionary, Indexes & Referential Integrity Rules
- [docs/architecture.md](file:///c:/Users/Lenovo/Documents/Work%20Hub/Web%20Projects/Animal%20Identification%20and%20Tracking%20System/aits-backend/docs/architecture.md): System Architecture, NestJS Global Prisma Module, GCP Document Storage
- [docs/synchronization.md](file:///c:/Users/Lenovo/Documents/Work%20Hub/Web%20Projects/Animal%20Identification%20and%20Tracking%20System/aits-backend/docs/synchronization.md): Mobile Offline Synchronization, Idempotency & Conflict Handling
- [docs/resources.md](file:///c:/Users/Lenovo/Documents/Work%20Hub/Web%20Projects/Animal%20Identification%20and%20Tracking%20System/aits-backend/docs/resources.md): Web (`aits-frontend`) & Mobile (`aits-mobile`) Asset Isolation & Naming Rules
