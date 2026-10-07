# Dashboard Page Resource

## Purpose
Displays high-level operational overview metrics for farm management, milk production trends, animal health/status distributions, upcoming calendar events, and animals requiring immediate attention.

## Backend Module
`dashboard` (`src/dashboard/`)

## Required Permission
`dashboard:read` / `analytics:read`

## APIs

### 1. Get Dashboard Summary Metrics
**GET** `/api/dashboard/summary`

#### Status
`IMPLEMENTED`

#### Response Structure
```json
{
  "totalAnimals": 120,
  "healthyAnimals": 115,
  "milkProductionToday": 450.5,
  "pregnantAnimals": 14,
  "expectedBirths": 3
}
```

---

### 2. Get Milk Production Trends
**GET** `/api/dashboard/milk-trends`

#### Status
`IMPLEMENTED`

#### Query Parameters
- `period` (optional): `'daily' | 'weekly' | 'monthly'` (Default: `'daily'`)

#### Response Structure
```json
[
  {
    "date": "2026-08-14",
    "label": "Fri, Aug 14",
    "quantityLiters": 450.5
  }
]
```

---

### 3. Get Animal Status Distribution
**GET** `/api/dashboard/animal-status`

#### Status
`IMPLEMENTED`

#### Response Structure
```json
[
  {
    "status": "ACTIVE",
    "label": "ACTIVE",
    "count": 110,
    "percentage": 92
  },
  {
    "status": "QUARANTINED",
    "label": "QUARANTINED",
    "count": 5,
    "percentage": 4
  }
]
```

---

### 4. Get Upcoming Events
**GET** `/api/dashboard/upcoming-events`

#### Status
`IMPLEMENTED`

#### Response Structure
```json
[
  {
    "id": "vax-123",
    "title": "Vaccination: FMD Vaccine",
    "type": "Vaccination Due",
    "date": "2026-08-20T10:00:00.000Z",
    "animalId": "anim-456",
    "animalNumber": "COW-001",
    "status": "PENDING"
  }
]
```

---

### 5. Get Animals Requiring Attention
**GET** `/api/dashboard/animals-attention`

#### Status
`IMPLEMENTED`

#### Response Structure
```json
{
  "items": [
    {
      "id": "a-123",
      "animalId": "a-123",
      "animalNumber": "COW-001",
      "name": "Bessie",
      "issue": "Quarantined / Critical Health",
      "priority": "High"
    }
  ],
  "summary": {
    "high": 1,
    "medium": 2,
    "low": 0
  }
}
```

## Related Models
- `Animal`
- `MilkProduction`
- `Vaccination`
- `Pregnancy`
- `Farm`

## Frontend States
- **Loading:** Card and chart skeletons rendered across widget slots.
- **Empty:** Zero state banners ("No animal records found", "No upcoming events scheduled").
- **Error:** Metric card retry button or error fallback toast.

## Pagination & Filtering Requirements
- `period` query parameter for milk trends filter.

## Related Backend
`src/dashboard/`
