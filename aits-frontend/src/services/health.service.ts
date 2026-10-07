import api from "./api";

// ─── Interfaces ─────────────────────────────────────────────────────────────

export interface HealthOverviewKPI {
  label: string;
  value: string;
  sub: string;
  type: "total" | "healthy" | "treatment" | "quarantine";
}

export interface HealthAlertItem {
  type: "critical" | "warning" | "info" | "success";
  msg: string;
  time: string;
}

export interface HealthOverviewResponse {
  kpis: HealthOverviewKPI[];
  criticalAlertsCount: number;
  totalAnimals?: number;
  healthy?: number;
  underObservation?: number;
  underTreatment?: number;
  quarantined?: number;
  movementRestricted?: number;
  milkWithheld?: number;
  meatWithheld?: number;
  moduleStats: {
    diagnoses: { activeCount: number; badge: string };
    vaccinations: {
      dueCount: number;
      badge: string;
      stats: Array<{ label: string; count: number }>;
    };
    treatments: {
      ongoingCount: number;
      badge: string;
      stats: Array<{ label: string; count: number }>;
    };
    quarantine: {
      isolatedCount: number;
      badge: string;
      stats: Array<{ label: string; count: number }>;
    };
    clearances: {
      issuedThisMonth: number;
      pendingApproval: number;
      expired: number;
      badge: string;
    };
    labResults: { flaggedCount: number; badge: string };
  };
  recentAlerts: HealthAlertItem[];
  outbreakAlerts?: {
    count: number;
    outbreaks: Array<{
      diseaseId: string;
      diseaseName: string;
      farmId: string;
      farmName: string;
      caseCount: number;
      windowDays: number;
      isReportable: boolean;
      isContagious: boolean;
      firstDetected: string;
      lastDetected: string;
    }>;
  };
}

export interface DiseaseMaster {
  id: string;
  code: string | null;
  name: string;
  category: string;
  severity: string;
  contagious: boolean;
  reportable: boolean;
  zoonotic: boolean;
  isolationRequired: boolean;
  incubationPeriodDays: number | null;
  quarantinePeriodDays: number | null;
  description: string | null;
  commonSymptoms: string[];
}

export interface MedicationMaster {
  id: string;
  code: string | null;
  name: string;
  genericName: string | null;
  category: string;
  defaultDose: string | null;
  route: string | null;
  withdrawalPeriodMilkDays: number;
  withdrawalPeriodMeatDays: number;
  isControlled: boolean;
  active: boolean;
}

export interface LabCatalogItem {
  id: string;
  code: string | null;
  name: string;
  category: string;
  sampleType: string;
  turnaroundHours: number | null;
  normalRangeMin: number | null;
  normalRangeMax: number | null;
  unit: string | null;
  targetDisease: string | null;
}

export interface VaccineProgramMaster {
  id: string;
  code: string | null;
  name: string;
  targetDisease: string;
  targetSpecies: string;
  dosesRequired: number;
  boosterIntervalDays: number | null;
  mandatory: boolean;
  active: boolean;
}

export interface ClinicalExamItem {
  id: string;
  caseId?: string | null;
  animalId: string;
  animalTag: string;
  animalName: string;
  examDate: string;
  veterinarian: string;
  temperature: number | null;
  heartRate: number | null;
  respiratoryRate: number | null;
  rumenMotility: number | null;
  bodyConditionScore: number | null;
  mucousMembranes: string | null;
  hydrationStatus: string | null;
  clinicalSigns: string[];
  initialAssessment: string | null;
  certainty: "SUSPECTED" | "PROBABLE" | "CONFIRMED" | "RULED_OUT";
  notes: string | null;
}

export interface CreateClinicalExamInput {
  caseId?: string;
  animalTag: string;
  examDate: string;
  temperature?: number;
  heartRate?: number;
  respiratoryRate?: number;
  rumenMotility?: number;
  bodyConditionScore?: number;
  mucousMembranes?: string;
  hydrationStatus?: string;
  clinicalSigns?: string[];
  initialAssessment?: string;
  certainty?: "SUSPECTED" | "PROBABLE" | "CONFIRMED" | "RULED_OUT";
  notes?: string;
}

export interface HealthCaseItem {
  id: string;
  caseNumber: string;
  animalId: string;
  animalTag: string;
  animalName: string;
  farmName: string;
  veterinarian: string;
  status:
    | "OPEN"
    | "UNDER_INVESTIGATION"
    | "UNDER_TREATMENT"
    | "ISOLATED"
    | "RESOLVED"
    | "CLOSED";
  severity: "MILD" | "MODERATE" | "SEVERE" | "CRITICAL";
  presumptiveDiagnosis: string | null;
  confirmedDisease: string | null;
  openedAt: string;
  closedAt: string | null;
  isContagious: boolean;
  isolationRequired: boolean;
  isReportable: boolean;
}

export interface CreateHealthCaseInput {
  animalTag: string;
  severity?: "MILD" | "MODERATE" | "SEVERE" | "CRITICAL";
  presumptiveDiagnosis?: string;
  diseaseId?: string;
  isContagious?: boolean;
  isolationRequired?: boolean;
  isReportable?: boolean;
  notes?: string;
}

export interface DiagnosisItem {
  id: string;
  animalTag: string;
  animalName: string;
  breed: string;
  species: string;
  imageUrl?: string | null;
  condition: string;
  severity: "critical" | "high" | "moderate" | "low";
  status: string;
  date: string;
  vet: string;
  symptoms: string[];
  notes: string;
  farmName: string;
  labResultRequired?: boolean;
  labResults?: LabResultItem[];
}

export interface CreateDiagnosisInput {
  animalTag: string;
  condition: string;
  diseaseId?: string;
  caseId?: string;
  severity?: string;
  healthStatus?: "HEALTHY" | "UNDER_TREATMENT" | "RECOVERED" | "SICK" | "QUARANTINED";
  symptoms?: string[];
  notes?: string;
  recordDate?: string;
  recommendIsolation?: boolean;
  certainty?: "SUSPECTED" | "PROBABLE" | "CONFIRMED" | "RULED_OUT";
  labResultRequired?: boolean;
}

export interface TreatmentItem {
  id: string;
  animalTag: string;
  animalName: string;
  breed: string;
  species: string;
  imageUrl?: string | null;
  medication: string;
  category: string;
  dose: string;
  duration: number;
  day: number;
  startDate: string;
  endDate: string;
  withdrawalMilk: number;
  withdrawalMeat: number;
  milkWithheld: boolean;
  condition: string;
  prescribedBy: string;
  status: "active" | "completed";
  notes: string;
  farmName: string;
}

export interface CreateTreatmentInput {
  animalTag: string;
  medication: string;
  medicationId?: string;
  healthRecordId?: string;
  caseId?: string;
  category?: string;
  dose?: string;
  duration?: number;
  startDate: string;
  endDate?: string;
  withdrawalMilk?: number;
  withdrawalMeat?: number;
  condition?: string;
  notes?: string;
  followUpDate?: string;
}

export interface WithdrawalPeriodItem {
  id: string;
  animalId: string;
  animalTag: string;
  animalName: string;
  productType: "MILK" | "MEAT";
  treatmentName: string;
  medicationName: string | null;
  startDate: string;
  endDate: string;
  hoursRemaining: number;
  daysRemaining: number;
  status: "ACTIVE" | "EXPIRED" | "OVERRIDDEN";
  notes: string | null;
}

export interface MovementRestrictionItem {
  id: string;
  animalId: string;
  animalTag: string;
  animalName: string;
  restrictionType:
    | "NO_TRANSFER"
    | "NO_SALE"
    | "NO_TRANSPORT"
    | "NO_SLAUGHTER"
    | "TOTAL_CONFINEMENT";
  reason: string;
  imposedAt: string;
  liftedAt: string | null;
  isActive: boolean;
  imposedBy: string;
  liftedBy: string | null;
  notes: string | null;
}

export interface CreateMovementRestrictionInput {
  animalTag: string;
  caseId?: string;
  restrictionType:
    | "NO_TRANSFER"
    | "NO_SALE"
    | "NO_TRANSPORT"
    | "NO_SLAUGHTER"
    | "TOTAL_CONFINEMENT";
  reason: string;
  notes?: string;
}

export interface ExposureRecordItem {
  id: string;
  sourceAnimalId: string;
  sourceTag: string;
  exposedAnimalId: string;
  exposedTag: string;
  exposureType:
    | "DIRECT_CONTACT"
    | "SHARED_PASTURE"
    | "SHARED_WATER"
    | "FOMITE"
    | "AIRBORNE";
  exposureDate: string;
  location: string | null;
  notes: string | null;
}

export interface CreateExposureRecordInput {
  sourceAnimalTag: string;
  exposedAnimalTag: string;
  caseId?: string;
  exposureType:
    | "DIRECT_CONTACT"
    | "SHARED_PASTURE"
    | "SHARED_WATER"
    | "FOMITE"
    | "AIRBORNE";
  exposureDate: string;
  location?: string;
  notes?: string;
}

export interface VaccinationRecordItem {
  id: string;
  animalTag: string;
  animalName: string;
  breed: string;
  species: string;
  imageUrl?: string | null;
  vaccine: string;
  dose: string;
  batchNo: string;
  date: string;
  nextDue: string | null;
  vet: string;
  status: "up_to_date" | "due_soon" | "overdue";
  notes: string;
  farmName: string;
}

export interface VaccineProgramItem {
  name: string;
  abbr: string;
  interval: string;
  color: string;
  light: string;
  text: string;
  border: string;
  covered: number;
  total: number;
}

export interface CreateVaccinationInput {
  animalTag: string;
  vaccineName: string;
  programId?: string;
  dose: string;
  vaccinationDate: string;
  nextDueDate?: string;
  noNextDose?: boolean;
  batchNumber?: string;
  notes?: string;
}

export interface QuarantineZoneItem {
  id: string;
  zone: string;
  capacity: number;
  occupied: number;
  status: string;
  disease: string;
  color: string;
  bg: string;
  border: string;
}

export interface QuarantineRecordItem {
  id: string;
  animalTag: string;
  animalName: string;
  breed: string;
  species: string;
  imageUrl?: string | null;
  zone: string;
  reason: string;
  startDate: string;
  expectedRelease: string;
  status: "active" | "released";
  orderedBy: string;
  govtRef: string;
  contactAnimals: string[];
  notes: string;
  farmName: string;
}

export interface CreateQuarantineInput {
  animalTag: string;
  caseId?: string;
  zoneId?: string;
  zoneName: string;
  reason: string;
  startDate: string;
  expectedRelease: string;
  govtRef?: string;
  contactAnimals?: string[];
  notes?: string;
}

export interface ReleaseQuarantineInput {
  notes?: string;
  labTestRecordId?: string;
  verificationOutcome?: string;
}

export interface HealthClearanceItem {
  id: string;
  animalId?: string;
  permitNo: string;
  animalTag: string;
  animalName: string;
  breed: string;
  purpose: string;
  destination: string;
  issuedBy: string;
  issuedDate: string;
  validUntil: string;
  approvedBy: string;
  status: "approved" | "pending" | "expired" | "rejected" | "revoked";
  conditions: string;
  notes: string;
  farmName: string;
}

export interface CreateClearanceInput {
  animalTag: string;
  purpose: string;
  destination: string;
  validUntil: string;
  conditions?: string;
  notes?: string;
}

export interface LabResultItem {
  id: string;
  animalTag: string;
  animalName: string;
  breed: string;
  species: string;
  imageUrl?: string | null;
  testType: string;
  catalogId?: string | null;
  lab: string;
  sampleDate: string;
  resultDate: string | null;
  status: "pending" | "positive" | "negative" | "flagged";
  stage?: "COLLECTED" | "IN_TRANSIT" | "PROCESSING" | "COMPLETED" | "REJECTED";
  result: string | null;
  flagged: boolean;
  requestedBy: string;
  notes: string;
  documentUrl?: string | null;
  documentUrls?: string[];
  farmName: string;
  healthRecordId?: string | null;
  diagnosisName?: string | null;
}

export interface CreateLabResultInput {
  animalTag: string;
  testType: string;
  catalogId?: string;
  caseId?: string;
  laboratory: string;
  sampleDate: string;
  resultDate?: string;
  status?: string;
  resultText?: string;
  isFlagged?: boolean;
  notes?: string;
  documentUrl?: string;
  documentUrls?: string[];
}

export interface AnimalCompositeHealthState {
  animalId: string;
  animalNumber: string;
  name: string | null;
  species: string;
  breed: string;
  farmId: string;
  primaryHealthState:
    | "HEALTHY"
    | "UNDER_OBSERVATION"
    | "UNDER_TREATMENT"
    | "QUARANTINED"
    | "MOVEMENT_RESTRICTED"
    | "WITHDRAWAL_ACTIVE"
    | "DECEASED";
  flags: {
    inQuarantine: boolean;
    hasActiveTreatment: boolean;
    hasActiveDiagnosis: boolean;
    hasMovementRestriction: boolean;
    hasMilkWithdrawal: boolean;
    hasMeatWithdrawal: boolean;
    hasPendingLabTest: boolean;
    hasCriticalAlert: boolean;
  };
  withdrawals: {
    milk: {
      active: boolean;
      endDate: string | null;
      hoursRemaining: number;
      treatmentName: string | null;
    };
    meat: {
      active: boolean;
      endDate: string | null;
      daysRemaining: number;
      treatmentName: string | null;
    };
  };
  eligibility: {
    canCollectMilk: boolean;
    canSlaughter: boolean;
    canTransfer: boolean;
    canIssueClearance: boolean;
    reasons: string[];
    blockingReasons?: string[];
  };
}

export interface TimelineEventItem {
  id?: string;
  date: string;
  category:
    | "EXAMINATION"
    | "DIAGNOSIS"
    | "TREATMENT"
    | "WITHDRAWAL"
    | "LAB"
    | "VACCINATION"
    | "QUARANTINE"
    | "CLEARANCE"
    | "FOLLOWUP";
  title: string;
  description: string;
  actor: string;
  status?: string;
  data?: Record<string, unknown>;
}

export interface AnimalHealthTimelineResponse {
  animal: {
    id: string;
    tag: string;
    name: string | null;
    species: string;
    breed: string;
    farmName: string;
  };
  compositeState: AnimalCompositeHealthState;
  timeline: TimelineEventItem[];
}

export interface PaginatedList<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// ─── Service Methods ─────────────────────────────────────────────────────────

export const healthService = {
  // 1. Overview
  getOverview: async (farmId?: string): Promise<HealthOverviewResponse> => {
    const res = await api.get<HealthOverviewResponse>("/api/v1/health/stats", {
      params: farmId ? { farmId } : undefined,
    });
    return res.data;
  },

  getHealthOverview: async (
    farmId?: string,
  ): Promise<HealthOverviewResponse> => {
    return healthService.getOverview(farmId);
  },

  // 2. Master Catalogs
  getDiseases: async (params?: {
    search?: string;
    category?: string;
    contagious?: boolean;
  }): Promise<DiseaseMaster[]> => {
    const res = await api.get<DiseaseMaster[]>(
      "/api/v1/health/masters/diseases",
      { params },
    );
    return res.data;
  },

  getMedications: async (params?: {
    search?: string;
    category?: string;
  }): Promise<MedicationMaster[]> => {
    const res = await api.get<MedicationMaster[]>(
      "/api/v1/health/masters/medications",
      { params },
    );
    return res.data;
  },

  getLabCatalogs: async (params?: {
    search?: string;
    sampleType?: string;
  }): Promise<LabCatalogItem[]> => {
    const res = await api.get<LabCatalogItem[]>(
      "/api/v1/health/masters/lab-tests",
      { params },
    );
    return res.data;
  },

  getVaccinationProgramMasters: async (params?: {
    farmId?: string;
    activeOnly?: boolean;
  }): Promise<VaccineProgramMaster[]> => {
    const res = await api.get<VaccineProgramMaster[]>(
      "/api/v1/health/masters/vaccine-programs",
      { params },
    );
    return res.data;
  },

  // 3. Clinical Examinations
  getClinicalExaminations: async (params?: {
    farmId?: string;
    animalId?: string;
    caseId?: string;
    page?: number;
    limit?: number;
  }) => {
    const res = await api.get("/api/v1/health/clinical-exams", { params });
    return res.data;
  },

  createClinicalExamination: async (data: CreateClinicalExamInput) => {
    const res = await api.post("/api/v1/health/clinical-exams", data);
    return res.data;
  },

  // 4. Health Cases
  getCases: async (params?: {
    farmId?: string;
    animalId?: string;
    status?: string;
    severity?: string;
    page?: number;
    limit?: number;
  }) => {
    const res = await api.get("/api/v1/health/cases", { params });
    return res.data;
  },

  getCase: async (id: string) => {
    const res = await api.get(`/api/v1/health/cases/${id}`);
    return res.data;
  },

  createCase: async (data: CreateHealthCaseInput) => {
    const res = await api.post("/api/v1/health/cases", data);
    return res.data;
  },

  // 5. Diagnoses
  getDiagnoses: async (params?: {
    search?: string;
    severity?: string;
    status?: string;
    page?: number;
    limit?: number;
    farmId?: string;
  }): Promise<PaginatedList<DiagnosisItem>> => {
    const res = await api.get<PaginatedList<DiagnosisItem>>(
      "/api/v1/health/diagnoses",
      { params },
    );
    return res.data;
  },

  createDiagnosis: async (data: CreateDiagnosisInput) => {
    const payload: Record<string, unknown> = {
      animalTag: data.animalTag.trim(),
      condition: data.condition.trim(),
    };
    if (data.severity) payload.severity = data.severity;
    if (data.healthStatus) payload.healthStatus = data.healthStatus;
    if (data.symptoms && data.symptoms.length > 0)
      payload.symptoms = data.symptoms;
    if (data.notes) payload.notes = data.notes;
    if (data.recordDate) payload.recordDate = data.recordDate;
    if (data.recommendIsolation !== undefined)
      payload.recommendIsolation = Boolean(data.recommendIsolation);
    if (data.diseaseId) payload.diseaseId = data.diseaseId;
    if (data.caseId) payload.caseId = data.caseId;
    if (data.certainty) payload.certainty = data.certainty;
    if (data.labResultRequired !== undefined) payload.labResultRequired = data.labResultRequired;

    const res = await api.post("/api/v1/health/diagnoses", payload);
    return res.data;
  },

  updateDiagnosis: async (id: string, data: Partial<CreateDiagnosisInput>) => {
    const payload: Record<string, unknown> = {};
    if (data.condition) payload.condition = data.condition.trim();
    if (data.severity) payload.severity = data.severity;
    if (data.healthStatus) payload.healthStatus = data.healthStatus;
    if (data.symptoms) payload.symptoms = data.symptoms;
    if (data.notes) payload.notes = data.notes;

    const res = await api.patch(`/api/v1/health/diagnoses/${id}`, payload);
    return res.data;
  },

  resolveDiagnosis: async (id: string) => {
    const res = await api.patch(`/api/v1/health/diagnoses/${id}/resolve`);
    return res.data;
  },

  deleteDiagnosis: async (id: string) => {
    const res = await api.delete(`/api/v1/health/diagnoses/${id}`);
    return res.data;
  },


  // 6. Treatments & Withdrawals
  getTreatments: async (params?: {
    search?: string;
    category?: string;
    status?: string;
    page?: number;
    limit?: number;
    farmId?: string;
  }): Promise<PaginatedList<TreatmentItem>> => {
    const res = await api.get<PaginatedList<TreatmentItem>>(
      "/api/v1/health/treatments",
      { params },
    );
    return res.data;
  },

  getActiveWithdrawals: async (
    farmId?: string,
  ): Promise<WithdrawalPeriodItem[]> => {
    const res = await api.get<WithdrawalPeriodItem[]>(
      "/api/v1/health/withdrawals/active",
      {
        params: farmId ? { farmId } : undefined,
      },
    );
    return res.data;
  },

  createTreatment: async (data: CreateTreatmentInput) => {
    const res = await api.post("/api/v1/health/treatments", data);
    return res.data;
  },

  completeTreatment: async (id: string) => {
    const res = await api.patch(`/api/v1/health/treatments/${id}/complete`);
    return res.data;
  },

  updateTreatment: async (id: string, data: Partial<CreateTreatmentInput>) => {
    const res = await api.put(`/api/v1/health/treatments/${id}`, data);
    return res.data;
  },

  voidTreatment: async (id: string, reason: string) => {
    const res = await api.post(`/api/v1/health/treatments/${id}/void`, {
      reason,
    });
    return res.data;
  },

  // 7. Vaccinations
  getVaccinations: async (params?: {
    search?: string;
    status?: string;
    page?: number;
    limit?: number;
    farmId?: string;
  }): Promise<PaginatedList<VaccinationRecordItem>> => {
    const res = await api.get<PaginatedList<VaccinationRecordItem>>(
      "/api/v1/health/vaccinations",
      { params },
    );
    return res.data;
  },

  getVaccinePrograms: async (
    farmId?: string,
  ): Promise<VaccineProgramItem[]> => {
    const res = await api.get<VaccineProgramItem[]>(
      "/api/v1/health/vaccinations/programs",
      { params: farmId ? { farmId } : undefined },
    );
    return res.data;
  },

  createVaccination: async (data: CreateVaccinationInput) => {
    const res = await api.post("/api/v1/health/vaccinations", data);
    return res.data;
  },

  updateVaccination: async (id: string, data: Partial<CreateVaccinationInput>) => {
    const res = await api.patch(`/api/v1/health/vaccinations/${id}`, data);
    return res.data;
  },

  // 8. Quarantine
  getQuarantineData: async (params?: {
    status?: string;
    farmId?: string;
  }): Promise<{
    zones: QuarantineZoneItem[];
    records: QuarantineRecordItem[];
  }> => {
    const res = await api.get<{
      zones: QuarantineZoneItem[];
      records: QuarantineRecordItem[];
    }>("/api/v1/health/quarantine", { params });
    return res.data;
  },

  createQuarantine: async (data: CreateQuarantineInput) => {
    const res = await api.post("/api/v1/health/quarantine", data);
    return res.data;
  },

  releaseQuarantine: async (id: string, data?: ReleaseQuarantineInput) => {
    const res = await api.patch(
      `/api/v1/health/quarantine/${id}/release`,
      data || {},
    );
    return res.data;
  },

  extendQuarantine: async (id: string, expectedRelease: string) => {
    const res = await api.patch(`/api/v1/health/quarantine/${id}/extend`, {
      expectedRelease,
    });
    return res.data;
  },

  deleteQuarantine: async (id: string) => {
    const res = await api.delete(`/api/v1/health/quarantine/${id}`);
    return res.data;
  },

  // 9. Health Clearances
  getClearances: async (params?: {
    search?: string;
    status?: string;
    page?: number;
    limit?: number;
    farmId?: string;
  }): Promise<PaginatedList<HealthClearanceItem>> => {
    const res = await api.get<PaginatedList<HealthClearanceItem>>(
      "/api/v1/health/clearances",
      { params },
    );
    return res.data;
  },

  createClearance: async (data: CreateClearanceInput) => {
    const res = await api.post("/api/v1/health/clearances", data);
    return res.data;
  },

  updateClearance: async (id: string, data: Partial<CreateClearanceInput>) => {
    const res = await api.patch(`/api/v1/health/clearances/${id}`, data);
    return res.data;
  },

  approveClearance: async (id: string) => {
    const res = await api.patch(`/api/v1/health/clearances/${id}/approve`);
    return res.data;
  },

  revokeClearance: async (id: string, reason: string) => {
    const res = await api.patch(`/api/v1/health/clearances/${id}/revoke`, {
      revocationReason: reason,
    });
    return res.data;
  },

  // 10. Lab Results
  getLabResults: async (params?: {
    search?: string;
    status?: string;
    page?: number;
    limit?: number;
    farmId?: string;
  }): Promise<PaginatedList<LabResultItem>> => {
    const res = await api.get<PaginatedList<LabResultItem>>(
      "/api/v1/health/lab-results",
      { params },
    );
    return res.data;
  },

  createLabResult: async (data: CreateLabResultInput) => {
    const res = await api.post("/api/v1/health/lab-results", data);
    return res.data;
  },

  updateLabResult: async (
    id: string,
    data: {
      status?: string;
      resultText?: string;
      isFlagged?: boolean;
      notes?: string;
      documentUrls?: string[];
    },
  ) => {
    const res = await api.patch(`/api/v1/health/lab-results/${id}`, data);
    return res.data;
  },

  // 11. Biosecurity, Contact Tracing, and Movement Restrictions
  getMovementRestrictions: async (params?: {
    farmId?: string;
    activeOnly?: boolean;
  }) => {
    const res = await api.get("/api/v1/health/movement-restrictions", {
      params,
    });
    return res.data;
  },

  createMovementRestriction: async (data: CreateMovementRestrictionInput) => {
    const res = await api.post("/api/v1/health/movement-restrictions", data);
    return res.data;
  },

  liftMovementRestriction: async (
    id: string,
    data: { liftReason: string; notes?: string },
  ) => {
    const res = await api.patch(
      `/api/v1/health/movement-restrictions/${id}/lift`,
      data,
    );
    return res.data;
  },

  getOutbreaks: async (farmId?: string) => {
    const res = await api.get("/api/v1/health/surveillance/outbreaks", {
      params: farmId ? { farmId } : undefined,
    });
    return res.data;
  },

  // 12. Unified Animal Medical Timeline & Authoritative Eligibility
  getAnimalTimeline: async (
    tagOrId: string,
  ): Promise<AnimalHealthTimelineResponse> => {
    const res = await api.get<AnimalHealthTimelineResponse>(
      `/api/v1/health/animals/${tagOrId}/timeline`,
    );
    return res.data;
  },

  getAnimalEligibility: async (
    tagOrId: string,
  ): Promise<AnimalCompositeHealthState> => {
    const res = await api.get<AnimalCompositeHealthState>(
      `/api/v1/health/animals/${tagOrId}/eligibility`,
    );
    return res.data;
  },
};
