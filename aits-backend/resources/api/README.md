# AITS API Map

Master API Endpoints Catalog for the Animal Identification & Traceability System (AITS).

---

## 1. Authentication (`src/auth/`)
| Endpoint | Method | Description | Status |
|---|---|---|---|
| `/api/v1/auth/login` | POST | User login & JWT issuance | `TO BE IMPLEMENTED` |
| `/api/v1/auth/register` | POST | Register new user | `TO BE IMPLEMENTED` |
| `/api/v1/auth/refresh` | POST | Refresh JWT tokens | `TO BE IMPLEMENTED` |
| `/api/v1/auth/logout` | POST | Invalidate current session | `TO BE IMPLEMENTED` |
| `/api/v1/auth/forgot-password` | POST | Request password reset | `TO BE IMPLEMENTED` |
| `/api/v1/auth/reset-password` | POST | Reset password with token | `TO BE IMPLEMENTED` |

---

## 2. Dashboard (`src/dashboard/`) & Analytics (`src/analytics/`)
| Endpoint | Method | Description | Status |
|---|---|---|---|
| `/api/dashboard/summary` | GET | High-level summary metrics | `IMPLEMENTED` |
| `/api/dashboard/milk-trends` | GET | Milk yield time series trends | `IMPLEMENTED` |
| `/api/dashboard/animal-status` | GET | Animal status distribution | `IMPLEMENTED` |
| `/api/dashboard/upcoming-events` | GET | Scheduled health/calving events | `IMPLEMENTED` |
| `/api/dashboard/animals-attention` | GET | Animals needing attention | `IMPLEMENTED` |
| `/api/v1/analytics/overview` | GET | Advanced herd analytics | `TO BE IMPLEMENTED` |

---

## 3. Animals (`src/animals/`)
| Endpoint | Method | Description | Status |
|---|---|---|---|
| `/api/v1/animals` | GET | List animals (paginated, filtered) | `TO BE IMPLEMENTED` |
| `/api/v1/animals/:id` | GET | Get animal details | `TO BE IMPLEMENTED` |
| `/api/v1/animals` | POST | Register new animal | `TO BE IMPLEMENTED` |
| `/api/v1/animals/:id` | PATCH | Update animal details | `TO BE IMPLEMENTED` |
| `/api/v1/animals/:id` | DELETE | Soft delete animal | `TO BE IMPLEMENTED` |

---

## 4. Identifiers & QR Codes (`src/identifiers/`, `src/qr/`)
| Endpoint | Method | Description | Status |
|---|---|---|---|
| `/api/v1/animals/:id/identifiers` | GET | Get animal tags | `TO BE IMPLEMENTED` |
| `/api/v1/animals/:id/identifiers` | POST | Attach new ear tag / RFID | `TO BE IMPLEMENTED` |
| `/api/v1/animals/:id/qr` | GET | Get assigned QR code | `TO BE IMPLEMENTED` |
| `/api/v1/animals/:id/qr` | POST | Generate new QR code | `TO BE IMPLEMENTED` |
| `/api/v1/animals/by-qr/:code` | GET | Lookup animal by QR code | `TO BE IMPLEMENTED` |

---

## 5. Health, Vaccinations & Treatments (`src/health/`, `src/vaccinations/`, `src/treatments/`, `src/veterinary/`)
| Endpoint | Method | Description | Status |
|---|---|---|---|
| `/api/v1/health` | GET | List health records | `TO BE IMPLEMENTED` |
| `/api/v1/health` | POST | Log health evaluation | `TO BE IMPLEMENTED` |
| `/api/v1/vaccinations` | GET | List vaccination records | `TO BE IMPLEMENTED` |
| `/api/v1/vaccinations` | POST | Log vaccination entry | `TO BE IMPLEMENTED` |
| `/api/v1/treatments` | GET | List medical treatments | `TO BE IMPLEMENTED` |
| `/api/v1/treatments` | POST | Add treatment record | `TO BE IMPLEMENTED` |
| `/api/v1/veterinary-visits` | GET | List vet visit reports | `TO BE IMPLEMENTED` |
| `/api/v1/veterinary-visits` | POST | Log vet visit entry | `TO BE IMPLEMENTED` |

---

## 6. Production & Feeding (`src/milk-production/`, `src/feeding/`)
| Endpoint | Method | Description | Status |
|---|---|---|---|
| `/api/v1/milk-production` | GET | List milk yield logs | `TO BE IMPLEMENTED` |
| `/api/v1/milk-production` | POST | Log milk production | `TO BE IMPLEMENTED` |
| `/api/v1/feeding` | GET | List feed records | `TO BE IMPLEMENTED` |
| `/api/v1/feeding` | POST | Log feed consumption | `TO BE IMPLEMENTED` |

---

## 7. Breeding, Pregnancy & Calving (`src/breeding/`, `src/pregnancy/`, `src/calving/`)
| Endpoint | Method | Description | Status |
|---|---|---|---|
| `/api/v1/breeding` | GET | List breeding records | `TO BE IMPLEMENTED` |
| `/api/v1/breeding` | POST | Log insemination service | `TO BE IMPLEMENTED` |
| `/api/v1/pregnancy` | GET | List pregnancy records | `TO BE IMPLEMENTED` |
| `/api/v1/pregnancy` | POST | Confirm pregnancy | `TO BE IMPLEMENTED` |
| `/api/v1/calving` | GET | List calving events | `TO BE IMPLEMENTED` |
| `/api/v1/calving` | POST | Log calving record | `TO BE IMPLEMENTED` |

---

## 8. Traceability & Movements (`src/movements/`, `src/ownership/`)
| Endpoint | Method | Description | Status |
|---|---|---|---|
| `/api/v1/movements` | GET | List movement permits | `TO BE IMPLEMENTED` |
| `/api/v1/movements` | POST | Issue movement permit | `TO BE IMPLEMENTED` |
| `/api/v1/ownership/transfers` | GET | Ownership transfer history | `TO BE IMPLEMENTED` |
| `/api/v1/ownership/transfers` | POST | Transfer animal ownership | `TO BE IMPLEMENTED` |

---

## 9. Synchronization & Offline Sync (`src/synchronization/`)
| Endpoint | Method | Description | Status |
|---|---|---|---|
| `/api/v1/sync` | POST | Bidirectional mobile offline sync | `TO BE IMPLEMENTED` |
| `/api/v1/sync/status` | GET | Check device sync status | `TO BE IMPLEMENTED` |

---

## 10. Documents & Notifications (`src/documents/`, `src/notifications/`)
| Endpoint | Method | Description | Status |
|---|---|---|---|
| `/api/v1/documents` | GET | List digital documents | `TO BE IMPLEMENTED` |
| `/api/v1/documents` | POST | Upload document attachment | `TO BE IMPLEMENTED` |
| `/api/v1/notifications` | GET | List user notifications | `TO BE IMPLEMENTED` |
| `/api/v1/notifications/:id/read` | PATCH | Mark notification read | `TO BE IMPLEMENTED` |
