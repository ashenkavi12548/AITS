<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:0f2027,50:203a43,100:2c5364&height=230&section=header&text=AITS&fontSize=90&fontColor=ffffff&animation=fadeIn&fontAlignY=36&desc=Animal%20Identification%20%26%20Traceability%20System&descAlignY=58&descSize=22" alt="AITS banner" width="100%"/>

<a href="https://git.io/typing-svg"><img src="https://readme-typing-svg.demolab.com?font=Fira+Code&weight=600&size=18&duration=3200&pause=900&color=2DD4BF&center=true&vCenter=true&width=720&lines=National-scale+livestock+registry;Lineage+%26+pedigree+tracking;Health%2C+breeding+%26+movement+traceability;Offline-first+field+tools+for+rural+regions" alt="Typing animation"/></a>

<br/>

[![NestJS](https://img.shields.io/badge/NestJS-11.0-E0234E?style=for-the-badge&logo=nestjs&logoColor=white)](https://nestjs.com/)
[![Expo](https://img.shields.io/badge/Expo-SDK_57-000020?style=for-the-badge&logo=expo&logoColor=white)](https://expo.dev/)
[![Next.js](https://img.shields.io/badge/Next.js-16.3-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Prisma](https://img.shields.io/badge/Prisma-7.9-2D3748?style=for-the-badge&logo=prisma&logoColor=white)](https://www.prisma.io/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind](https://img.shields.io/badge/Tailwind-v4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)

![Models](https://img.shields.io/badge/data_models-32-2DD4BF?style=flat-square)
![Roles](https://img.shields.io/badge/user_roles-7-F59E0B?style=flat-square)
![Apps](https://img.shields.io/badge/apps-3-8B5CF6?style=flat-square)
![Offline](https://img.shields.io/badge/offline--first-yes-22C55E?style=flat-square)
![License](https://img.shields.io/badge/license-proprietary-EF4444?style=flat-square)

<br/>

**[✨ Features](#-key-features)** &nbsp;·&nbsp;
**[🏛️ Architecture](#️-system-architecture)** &nbsp;·&nbsp;
**[📁 Monorepo](#-monorepo-structure)** &nbsp;·&nbsp;
**[🚀 Quick Start](#-quick-start)** &nbsp;·&nbsp;
**[🔐 Credentials](#-default-seed-credentials)** &nbsp;·&nbsp;
**[📜 Roles](#-system-roles)**

</div>

<br/>

## 📖 Overview

**AITS** is an end-to-end, enterprise-grade platform that modernizes **national livestock management**: disease monitoring, breeding records, ownership transfer, and biosecurity traceability.

It gives **livestock owners, government officials, veterinarians, AI technicians, and bank / insurance inspectors** real-time web dashboards plus **offline-capable mobile tools** for the field.

<div align="center">

```
                ┌─────────────────────────────────────────────────────┐
                │      🌐  AITS Central Web Portal  (Next.js 16)       │
                │   National dashboards · Farms · Health · Documents   │
                └──────────────────────────┬──────────────────────────┘
                                           │  REST  (JWT + TLS)
                                           ▼
┌────────────────────────────────────────────────────────────────────────────┐
│                     ⚡  AITS Backend Core  (NestJS 11)                      │
│   PostgreSQL 16 via Prisma 7  ·  Unique-Tag & Lineage Engine  ·  Audit Log │
│                    Idempotent Offline Sync Engine                          │
└────────────────────────────────────────────────────────────────────────────┘
                                           ▲
                                           │  REST  (JWT + Offline Queue)
                ┌──────────────────────────┴──────────────────────────┐
                │   📱  AITS Field App  (Expo / React Native 0.86)     │
                │   QR & RFID tagging · Offline SQLite · Sync manager  │
                └─────────────────────────────────────────────────────┘
```

</div>

<br/>

## ✨ Key Features

<table>
<tr>
<td width="50%" valign="top">

### 🆔 Global Identification & Tagging

- **National registry**: globally unique `animalNumber` across every farm and province
- **Multi-tag support**: `QR Code`, `RFID`, `Ear Tag`, `National ID` (primary + secondary)
- **Single-active-QR enforcement** inside DB transactions to stop duplication and fraud

</td>
<td width="50%" valign="top">

### 🌳 Lineage & Pedigree Engine

- **Self-referential genealogy** with mother/father graph for multi-generation trees
- **Calving & genetic history**: offspring counts, birth weights, lineage traits

</td>
</tr>
<tr>
<td valign="top">

### 🩺 Health, Disease & Vaccination

- **Clinical records**: `HEALTHY` · `SICK` · `UNDER_TREATMENT` · `QUARANTINED`
- **Disease severity matrix**: `CRITICAL` · `HIGH` · `MEDIUM`
- **Vaccination schedules** with automated due-date reminders

</td>
<td valign="top">

### 🥛 Production & Feeding Analytics

- **Milk yield**: morning / afternoon / evening, with Fat % and Protein %
- **Feed rations**: `GREEN_FODDER` · `CONCENTRATE` · `SILAGE` · `SUPPLEMENTS`

</td>
</tr>
<tr>
<td valign="top">

### 🧬 AI & Pregnancy Tracking

- **Breeding records** linking females, AI technicians, sire IDs, and dates
- **Expected calving calculator** with pregnancy status progression

</td>
<td valign="top">

### 🚚 Movement & Ownership

- **Inter-farm movement logs** across farms, quarantine zones, and markets
- **Ownership transfers** between users, with document verification

</td>
</tr>
<tr>
<td colspan="2" valign="top">

### 📶 Offline-First Mobile Sync

- **Local SQLite store**: field agents work fully offline in remote regions
- **Idempotent batch syncing**: queued `CREATE` / `UPDATE` operations with conflict resolution

</td>
</tr>
</table>

<br/>

## 🏛️ System Architecture

AITS is a **monorepo** of three decoupled applications:

```mermaid
graph TD
    subgraph Clients["📲 Client Layer"]
        WEB["🌐 Web Portal<br/><b>aits-frontend</b><br/>Next.js 16 + React 19"]
        MOB["📱 Mobile App<br/><b>aits-mobile</b><br/>Expo 57 + RN 0.86"]
    end

    subgraph API["⚙️ API Layer"]
        NEST["⚡ NestJS Server<br/><b>aits-backend</b><br/>REST + JWT"]
        PRISMA["💎 Prisma 7.9<br/>PrismaPg Adapter"]
    end

    subgraph Storage["🗄️ Persistence Layer"]
        PG[("🐘 PostgreSQL 16<br/>Central DB")]
        GCP["☁️ GCP Storage<br/>Official Documents"]
        LDB[("💾 Expo SQLite<br/>Mobile Local DB")]
    end

    WEB -->|HTTPS / REST| NEST
    MOB -->|HTTPS / REST| NEST
    MOB <-->|Offline sync| LDB
    NEST --> PRISMA --> PG
    NEST -->|Bucket uploads| GCP

    style WEB fill:#0f172a,stroke:#2dd4bf,color:#fff
    style MOB fill:#0f172a,stroke:#8b5cf6,color:#fff
    style NEST fill:#0f172a,stroke:#e0234e,color:#fff
    style PRISMA fill:#0f172a,stroke:#94a3b8,color:#fff
    style PG fill:#0f172a,stroke:#4169e1,color:#fff
    style GCP fill:#0f172a,stroke:#f59e0b,color:#fff
    style LDB fill:#0f172a,stroke:#22c55e,color:#fff
```

<br/>

## 📁 Monorepo Structure

```
Animal Identification and Tracking System/
├── 📄 docker-compose.yml      # PostgreSQL + Adminer containers
├── 📄 README.md               # You are here
│
├── ⚡ aits-backend/           # NestJS service
│   ├── prisma/                #   Schema + seed (32 models)
│   ├── src/                   #   Modules: Auth, Animals, Health, QR, Sync…
│   ├── package.json           #   NestJS 11, Prisma 7.9, Pino, Bcrypt
│   └── tsconfig.json          #   NodeNext resolution
│
├── 🌐 aits-frontend/          # Next.js 16 web dashboard
│   ├── src/                   #   React 19 App Router, components, hooks
│   ├── package.json           #   Next 16, Tailwind v4, TanStack Query
│   └── next.config.ts
│
└── 📱 aits-mobile/            # Expo / React Native field app
    ├── src/                   #   Expo Router screens, SQLite schema, scanners
    ├── package.json           #   Expo 57, RN 0.86, SQLite
    └── app.json
```

<br/>

## 🗄️ Database Model Map

**32 normalized models** across **11 domains** in PostgreSQL:

|     | Domain                        | Key Models                                                                           |
| :-: | :---------------------------- | :----------------------------------------------------------------------------------- |
| 🔑  | **Authentication & Access**   | `User` `Role` `Permission` `UserRole` `RolePermission`                               |
| 🏡  | **Farm Infrastructure**       | `Farm` `FarmUser`                                                                    |
| 🐂  | **Animal Registry & Lineage** | `Animal` `AnimalIdentifier` `QRCode`                                                 |
| 🩺  | **Health & Medical**          | `HealthRecord` `Disease` `AnimalDisease` `Treatment` `Vaccination` `VeterinaryVisit` |
| 🌾  | **Feed & Production**         | `FeedType` `FeedingRecord` `MilkProduction`                                          |
| 🧬  | **Reproduction**              | `BreedingRecord` `Pregnancy` `CalvingRecord`                                         |
| 🚚  | **Movement & Ownership**      | `AnimalMovement` `OwnershipTransfer`                                                 |
| 📂  | **Document Vault**            | `DocumentType` `Document`                                                            |
| 🔔  | **Notifications**             | `Notification` `NotificationPreference`                                              |
| 🔄  | **Offline Synchronization**   | `SyncBatch` `SyncRecord`                                                             |
| 🛡️  | **Audit & System**            | `AuditLog` `SystemSetting`                                                           |

<br/>

## 🚀 Quick Start

### 📋 Prerequisites

| Tool                                                                                      | Version                              |
| :---------------------------------------------------------------------------------------- | :----------------------------------- |
| ![Node](https://img.shields.io/badge/Node.js-20%2B-339933?logo=nodedotjs&logoColor=white) | `node -v` → v20.x or higher          |
| ![npm](https://img.shields.io/badge/npm-10%2B-CB3837?logo=npm&logoColor=white)            | `npm -v` → v10.x or higher           |
| ![Docker](https://img.shields.io/badge/Docker-running-2496ED?logo=docker&logoColor=white) | Docker Desktop installed and running |
| ![Git](https://img.shields.io/badge/Git-any-F05032?logo=git&logoColor=white)              | Installed                            |

<br/>

### 1️⃣ Clone & Install

```bash
git clone https://github.com/LaKrUwaNS/Animal-Identification-and-Tracking-System.git
cd "Animal Identification and Tracking System"

# Install all three apps
(cd aits-backend  && npm install)
(cd aits-frontend && npm install)
(cd aits-mobile   && npm install)
```

### 2️⃣ Database & Backend

```bash
cd aits-backend

npm run db:docker                    # PostgreSQL :5432 + Adminer :8080
cp .env.example .env                 # environment file
npx prisma migrate dev --name init   # apply migrations
npm run seed                         # roles, permissions, diseases, admin
npm run start:dev                    # API on :3000
```

> [!TIP]
> **Adminer** is available at **http://localhost:8080**
> Server `postgres` · User `postgres` · Password `postgres` · Database `aits`

### 3️⃣ Web Portal

```bash
cd ../aits-frontend
npm run dev                          # Next.js dev server on :3001
```

> [!NOTE]
> Open the dashboard at **http://localhost:3001**. Backend and web portal both default to `3000`, so run the portal on `3001` to avoid a clash.

### 4️⃣ Mobile App

```bash
cd ../aits-mobile
npm run start                        # Expo Metro bundler
```

> [!TIP]
> Press **`a`** for Android Emulator · **`i`** for iOS Simulator · or scan the QR with **Expo Go**.

<br/>

## 🔐 Default Seed Credentials

Running `npm run seed` populates roles, permissions, disease definitions, document types, and a default **System Administrator**:

| Role                        | Email            | Password      | Environment           |
| :-------------------------- | :--------------- | :------------ | :-------------------- |
| 👑 **System Administrator** | `admin@aits.gov` | `Admin123!@#` | Development / Staging |

> [!CAUTION]
> These credentials are for **development and staging only**. Change or remove them before any production deployment.

<br/>

## 🌐 Network & Ports

| Service                   |  Port  | URL                     | Notes                  |
| :------------------------ | :----: | :---------------------- | :--------------------- |
| ⚡ **NestJS Backend**     | `3000` | `http://localhost:3000` | Main REST API          |
| 🌐 **Next.js Web Portal** | `3001` | `http://localhost:3001` | Admin & farmer web app |
| 📱 **Expo Metro**         | `8081` | Metro / WebSocket       | Mobile development     |
| 🐘 **PostgreSQL**         | `5432` | PostgreSQL protocol     | Central DB             |
| 🧰 **Adminer**            | `8080` | `http://localhost:8080` | DB management UI       |

<br/>

## 📜 System Roles

| Role                        | Scope                     | Responsibilities                                                  |
| :-------------------------- | :------------------------ | :---------------------------------------------------------------- |
| 👑 **`ADMIN`**              | System-wide               | User management, system settings, global audit logs               |
| 🧑‍🌾 **`FARMER`**             | Farm level                | Farm profiles, animal registration, milk yield & feed logging     |
| 🩺 **`VETERINARY_OFFICER`** | Regional / assigned farms | Diagnose diseases, prescribe treatments, administer vaccinations  |
| 🧬 **`AI_TECHNICIAN`**      | Regional                  | Log breeding events, inseminations, pregnancy checks              |
| 🏛️ **`GOVERNMENT_OFFICER`** | National / provincial     | Traceability inspection, movement approvals, disease surveillance |
| 🏦 **`BANK_OFFICER`**       | Inspection scope          | Asset valuation and health validation for agricultural loans      |
| 🛡️ **`INSURANCE_OFFICER`**  | Inspection scope          | Mortality claims and health-history verification                  |

<br/>

## 🧪 Testing & Code Quality

```bash
cd aits-backend
npm test                              # unit tests
npm run lint                          # ESLint
npx prettier --check "src/**/*.ts"    # formatting
```

<br/>

## 🤝 Contributing

Contributions are welcome!

1. 🍴 **Fork** the repository
2. 🌿 Create a branch: `git checkout -b feature/amazing-feature`
3. 💾 Commit: `git commit -m 'feat: add amazing feature'`
4. 🚀 Push: `git push origin feature/amazing-feature`
5. 🔀 Open a **Pull Request**

<br/>

## 📄 License

Licensed under **UNLICENSED / Proprietary**. See individual package files for details.

<div align="center">

<br/>

**Built with ❤️ for modern agricultural tech & national livestock traceability**

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:2c5364,50:203a43,100:0f2027&height=120&section=footer" alt="footer" width="100%"/>

</div>
