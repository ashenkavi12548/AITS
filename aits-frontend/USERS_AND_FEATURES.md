# 👥 AITS User Accounts & Role-Based Feature Matrix

This document details all pre-configured test users, their login credentials, and the specific capabilities and operational features associated with each role in the **Animal Identification & Traceability System (AITS)**.

---

## 🔑 1. Pre-Configured Test Accounts

| Role Type | Full Name | Email / Username | Password | Assigned Facility / Scope |
| :--- | :--- | :--- | :--- | :--- |
| **System Administrator** | System Administrator | `admin@aits.gov` | `Admin123!@#` | 🌐 Global (System-Wide Access) |
| **Farm Owner (`FARMER`)** | Sunil Bandara | `farmer.owner@aits.lk` | `Password123!` | 🏡 **Highland Dairy Farm** (Owner) |
| **Farm Manager** | Kasun Wijesinghe | `manager.kasun@aits.lk` | `Password123!` | 🏡 **Highland Dairy Farm** (Manager) |
| **Farm Worker** | Samantha Kumara | `worker.sam@aits.lk` | `Password123!` | 🏡 **Highland Dairy Farm** (Worker) |
| **Veterinary Officer** | Dr. Nimal Jayawardena | `vet.officer@aits.lk` | `Password123!` | 🩺 Health & Clinical Authority |
| **AI Technician** | Roshan Silva | `ai.tech@aits.lk` | `Password123!` | 🧬 Breeding & Insemination Specialist |
| **Government Officer** | Anura Dissanayake | `gov.officer@aits.lk` | `Password123!` | 🏛️ Traceability, Quarantine & Compliance |

---

## 📊 2. Feature Access Matrix by Role

| Feature Module | Farm Owner | Farm Manager | Farm Worker | Veterinary Officer | AI Technician | Government Officer | System Admin |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Dashboard KPIs & Charts** | ✅ Full | ✅ Full | ✅ View Only | ✅ Health Focus | ✅ Breeding Focus | ✅ Traceability Focus | ✅ Full System |
| **Animal Registration & QR Tags** | ✅ Create/Edit | ✅ Create/Edit | ✅ Quick Add | 👁️ View/Tag Check | 👁️ View/Tag Check | 👁️ View/Verify | ✅ Full Control |
| **Farm Facility Overview** | ✅ Manage | ✅ Manage | 👁️ View | 👁️ View | 👁️ View | 👁️ Inspect | ✅ Multi-Facility |
| **Staff & Worker Delegation** | ✅ Add/Edit/Reset | ✅ Edit/Manage | ❌ None | ❌ None | ❌ None | ❌ None | ✅ System-wide |
| **Milk Production Yield Logging** | ✅ Full | ✅ Full | ✅ Daily Log | ❌ None | ❌ None | 👁️ Audit View | ✅ Full |
| **Feeding & Ration Scheduling** | ✅ Full | ✅ Full | ✅ Daily Log | 👁️ Dietary Advice | ❌ None | 👁️ Audit View | ✅ Full |
| **Clinical Diagnosis & Diseases** | 👁️ View Alerts | 👁️ View Alerts | 👁️ View Alerts | ✅ Full Medical | ❌ None | 👁️ Disease Surveillance | ✅ Full |
| **Vaccinations & Treatments** | 👁️ View Records | 👁️ View Records | ❌ None | ✅ Prescribe & Log | ❌ None | 👁️ Health Clearance | ✅ Full |
| **Breeding & Artificial Insemination**| ✅ Full | ✅ Full | ❌ None | 👁️ Reproductive Health | ✅ Log AI & Semen | 👁️ Pedigree Audit | ✅ Full |
| **Calving & Pregnancy Diagnosis (PD)**| ✅ Full | ✅ Full | ❌ None | ✅ Medical PD | ✅ PD & Calving Alert | 👁️ Lineage Audit | ✅ Full |
| **Animal Movement & Transport Permits**| ✅ Request Permit | ✅ Request Permit| ❌ None | ✅ Health Clearance | ❌ None | ✅ Approve & Enforce | ✅ Full |
| **Quarantine & Disease Containment** | 👁️ View Status | 👁️ View Status | ❌ None | ✅ Recommend Quarantine | ❌ None | ✅ Issue Quarantine Order | ✅ Full |
| **System Settings & Audit Trail** | ❌ None | ❌ None | ❌ None | ❌ None | ❌ None | 👁️ Audit Logs | ✅ Full System |

---

## 🎯 3. Role-Specific Profiles & Capabilities

### 👨‍🌾 1. Farm Owner (`FARMER` / `OWNER`)
- **Primary Goal**: Complete managerial, operational, and financial control over the farm facility.
- **Key Features**:
  - **Farm Facility Administration**: Update farm profile, address, capacity, and facility details.
  - **Team Delegation**: Add new employees, assign roles (`MANAGER`, `WORKER`, `VETERINARIAN`, `AUDITOR`), toggle active/inactive status, and reset employee passwords.
  - **Ownership Transfer**: Transactionally transfer farm ownership to another verified user account.
  - **Full Production & Animal Records**: Register cattle, print QR tags, review daily milk logs (Morning, Afternoon, Evening yields), and feed rations.
  - **Analytics & Reporting**: Download CSV/Excel summary reports and yield trends.

---

### 👨‍💼 2. Farm Manager (`MANAGER`)
- **Primary Goal**: Supervise daily farm operations and manage on-site field staff.
- **Key Features**:
  - Coordinate daily animal health checks, milking sessions, and feed distribution.
  - Register new newborn calves or incoming animals with instant QR code generation.
  - Oversee farm workers and update operational task permissions.
  - Request animal movement permits for livestock transportation.

---

### 🧑‍🌾 3. Farm Worker (`WORKER`)
- **Primary Goal**: Fast and accurate daily data capture in the barn and milking parlor.
- **Key Features**:
  - **Quick Add Animal**: Rapidly record tag number, name, breed, and gender from mobile/desktop.
  - **Daily Milk Logging**: Enter session liters per animal for morning, afternoon, and evening milkings.
  - **Daily Feeding Log**: Enter daily feed intake (green fodder, concentrate, silage, mineral mixture).
  - **Observation Alerts**: Flag animals needing attention (sickness symptoms, heat behavior, injury).

---

### 🩺 4. Veterinary Officer (`VETERINARY_OFFICER`)
- **Primary Goal**: Ensure animal health, disease control, vaccination compliance, and veterinary treatments.
- **Key Features**:
  - **Clinical Diagnoses**: Record diagnosed conditions with severity ratings (*Foot and Mouth Disease*, *Mastitis*, *Brucellosis*, *Anthrax*, *Lumpy Skin Disease*, *Blackleg*).
  - **Treatment Prescriptions**: Prescribe medications, dosage, withdrawal periods, and follow-up schedules.
  - **Vaccination Logs**: Administer and record scheduled vaccinations (FMD, Anthrax, Blackleg).
  - **Health Clearances**: Issue veterinary health clearance certifications for animal transit and trade.

---

### 🧬 5. AI Technician (`AI_TECHNICIAN`)
- **Primary Goal**: Manage artificial insemination, genetic pedigree tracking, and reproductive cycles.
- **Key Features**:
  - **Insemination Logging**: Log AI services with sire registration, breed, straw batch number, and technician ID.
  - **Pregnancy Diagnosis (PD)**: Record 60-day/90-day pregnancy confirmation results.
  - **Calving Date Forecast**: Automated calculation of expected calving dates and dry-off reminders.
  - **Sire & Semen Inventory**: Track semen straw stock and breed genetics.

---

### 🏛️ 6. Government / DAPH Officer (`GOVERNMENT_OFFICER`)
- **Primary Goal**: National traceability, livestock movement regulation, and disease outbreak containment.
- **Key Features**:
  - **Traceability Timeline**: Inspect the complete lifecycle chain of custody for any animal by QR code.
  - **Movement Permits**: Approve or reject cross-district/cross-province livestock transport applications.
  - **Quarantine Enforcement**: Impose biosecurity quarantine restrictions on farms during disease outbreaks.
  - **Official Attestations**: Verify and stamp official transit and trade documents.

---

### 🛡️ 7. System Administrator (`ADMIN`)
- **Primary Goal**: System health, global user role management, and biosecurity compliance oversight.
- **Key Features**:
  - Global user account provisioning, role assignment, and security status.
  - System-wide audit log inspection (`AuditLog`) tracking all critical transactions and changes.
  - Global system settings (QR code prefixes, batch sync sizes, localization).

---

## 🚀 4. How to Test

1. Launch the web application: **`http://localhost:3000/login`**
2. Enter the email and password for the role you want to inspect (e.g. `farmer.owner@aits.lk` / `Password123!`).
3. Notice how the top header greeting, user profile initials, accessible navigation items, and facility statistics adapt to the user's role.
