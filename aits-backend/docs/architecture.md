# AITS System Architecture & Technical Specifications

This document outlines the system topology, component responsibilities, database layer access patterns, media storage architecture, and ownership model evolution for the **Animal Identification & Traceability System (AITS)**.

---

## 1. System Topology

```
+-----------------------------------+        +-----------------------------------+
|      Next.js Web Application      |        |   React Native / Expo Mobile App  |
|          (aits-frontend)          |        |           (aits-mobile)           |
+-----------------------------------+        +-----------------------------------+
                  |                                            |
                  | REST API / HTTPS                           | REST API / HTTPS
                  v                                            v
+--------------------------------------------------------------------------------+
|                             NestJS Backend API                                 |
|                               (aits-backend)                                   |
|                                                                                |
|  +--------------------------------------------------------------------------+  |
|  |                Global PrismaModule & PrismaService                       |  |
|  +--------------------------------------------------------------------------+  |
+--------------------------------------------------------------------------------+
                                       |
                                       | Prisma ORM (v7.9.1)
                                       v
                     +-----------------------------------+
                     |        PostgreSQL Database        |
                     |         (Central DB)              |
                     +-----------------------------------+
```

---

## 2. Key Architectural Rules

1. **Centralized Database**: PostgreSQL is the CENTRAL DATABASE for the entire ecosystem. Direct database connections from Next.js or React Native are strictly prohibited.
2. **Single Prisma Client Instance**: NestJS uses a single, globally exported `PrismaService` (`@Global()` in `src/database/prisma.module.ts`) extending `PrismaClient`. Individual services inject `PrismaService` rather than instantiating `PrismaClient`.
3. **Stateless REST & JWT**: Authentication uses JWT tokens signed with `JWT_SECRET`. Passport.js guards enforce Role-Based Access Control (RBAC).

---

## 3. Google Cloud Storage Document & File Architecture

- **No Binary Data in PostgreSQL**: PostgreSQL never stores file blobs.
- **Metadata Storage**: The `Document` table stores metadata: `fileName`, `storagePath`, `fileSize`, `mimeType`, `issueDate`, `expiryDate`, `uploadedById`, `animalId`, `farmId`.
- **GCP Object Keys**: `storagePath` acts as the authoritative reference inside Google Cloud Storage buckets.
- **Signed URLs**: The NestJS backend generates short-lived, signed URLs for secure document downloading and image rendering.

---

## 4. Ownership Model Notes & Future Evolution

- **Current Scope**: Ownership transfers (`OwnershipTransfer`) link `previousOwnerId` and `newOwnerId` to system `User` records.
- **System Limitation**: A system `User` represents a individual account holder. In future enterprise releases of AITS, legal ownership may be held by corporate entities, cooperatives, banks, or state institutions.
- **Future Upgrade Path**: When organizational ownership is required, a dedicated `Owner` entity (with polymorphic links to `User`, `Company`, `Bank`, or `GovernmentBody`) will be introduced via a dedicated database migration without breaking existing transfer history.
