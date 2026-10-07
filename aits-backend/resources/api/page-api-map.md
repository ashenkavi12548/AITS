# Page -> API -> Backend Module Mapping

This table maps every Web Frontend Page and Mobile Screen to its required API endpoints, responsible NestJS backend modules, database models, and current status.

| Target UI Screen / Page | API Endpoint | HTTP Method | Backend Module | Database Models | Status |
|---|---|---|---|---|---|
| Web: Login | `/api/v1/auth/login` | POST | `auth` | `User`, `Role` | Planned |
| Web: Forgot Password | `/api/v1/auth/forgot-password` | POST | `auth` | `User` | Planned |
| Web: Reset Password | `/api/v1/auth/reset-password` | POST | `auth` | `User` | Planned |
| Web: Dashboard Summary | `/api/dashboard/summary` | GET | `dashboard` | `Animal`, `MilkProduction` | Implemented |
| Web: Dashboard Milk Trends | `/api/dashboard/milk-trends` | GET | `dashboard` | `MilkProduction` | Implemented |
| Web: Dashboard Animal Status | `/api/dashboard/animal-status` | GET | `dashboard` | `Animal` | Implemented |
| Web: Dashboard Upcoming Events | `/api/dashboard/upcoming-events` | GET | `dashboard` | `Vaccination`, `Pregnancy` | Implemented |
| Web: Dashboard Attention List | `/api/dashboard/animals-attention` | GET | `dashboard` | `Animal`, `Vaccination` | Implemented |
| Web: Animals List | `/api/v1/animals` | GET | `animals` | `Animal`, `QRCode` | Planned |
| Web: Animal Details | `/api/v1/animals/:id` | GET | `animals` | `Animal`, `HealthRecord` | Planned |
| Web: Register Animal | `/api/v1/animals` | POST | `animals` | `Animal`, `AnimalIdentifier` | Planned |
| Web: Edit Animal | `/api/v1/animals/:id` | PATCH | `animals` | `Animal` | Planned |
| Web: QR Management | `/api/v1/animals/:id/qr` | POST | `qr` | `QRCode`, `Animal` | Planned |
| Web: Farms List | `/api/v1/farms` | GET | `farms` | `Farm`, `FarmUser` | Planned |
| Web: Farm Details | `/api/v1/farms/:id` | GET | `farms` | `Farm`, `User` | Planned |
| Web: Health Records | `/api/v1/health` | GET/POST | `health` | `HealthRecord` | Planned |
| Web: Vaccinations | `/api/v1/vaccinations` | GET/POST | `vaccinations` | `Vaccination` | Planned |
| Web: Treatments | `/api/v1/treatments` | GET/POST | `treatments` | `Treatment` | Planned |
| Web: Vet Visits | `/api/v1/veterinary-visits` | GET/POST | `veterinary` | `VeterinaryVisit` | Planned |
| Web: Milk Production | `/api/v1/milk-production` | GET/POST | `milk-production` | `MilkProduction` | Planned |
| Web: Feeding Records | `/api/v1/feeding` | GET/POST | `feeding` | `FeedingRecord` | Planned |
| Web: Breeding Records | `/api/v1/breeding` | GET/POST | `breeding` | `BreedingRecord` | Planned |
| Web: Pregnancy Records | `/api/v1/pregnancy` | GET/POST | `pregnancy` | `Pregnancy` | Planned |
| Web: Calving Records | `/api/v1/calving` | GET/POST | `calving` | `CalvingRecord` | Planned |
| Web: Movements List | `/api/v1/movements` | GET/POST | `movements` | `AnimalMovement` | Planned |
| Web: Ownership Transfer | `/api/v1/ownership/transfers` | GET/POST | `ownership` | `OwnershipTransfer` | Planned |
| Web: Documents List | `/api/v1/documents` | GET/POST | `documents` | `Document` | Planned |
| Web: Notifications | `/api/v1/notifications` | GET/PATCH | `notifications` | `Notification` | Planned |
| Web: Reports | `/api/v1/reports/generate` | POST | `reports` | `MilkProduction`, `Farm` | Planned |
| Web: Analytics | `/api/v1/analytics/overview` | GET | `analytics` | `Animal`, `MilkProduction` | Planned |
| Mobile: Login Screen | `/api/v1/auth/login` | POST | `auth` | `User` | Planned |
| Mobile: Home Screen | `/api/dashboard/summary` | GET | `dashboard` | `Animal`, `MilkProduction` | Implemented |
| Mobile: Animals List | `/api/v1/animals` | GET | `animals` | `Animal` | Planned |
| Mobile: Animal Details | `/api/v1/animals/:id` | GET | `animals` | `Animal` | Planned |
| Mobile: Scan QR Animal | `/api/v1/animals/by-qr/:code` | GET | `qr` | `QRCode`, `Animal` | Planned |
| Mobile: Register Animal | `/api/v1/animals` | POST | `animals` | `Animal` | Planned |
| Mobile: Health Entry | `/api/v1/health` | POST | `health` | `HealthRecord` | Planned |
| Mobile: Milk Entry | `/api/v1/milk-production` | POST | `milk-production` | `MilkProduction` | Planned |
| Mobile: Offline Sync | `/api/v1/sync` | POST | `synchronization` | `SyncBatch`, `SyncRecord` | Planned |
