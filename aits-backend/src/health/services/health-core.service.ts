import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import {
  Prisma,
  HealthStatus,
  TreatmentStatus,
  QuarantineStatus,
  ClearanceStatus,
  AnimalStatus,
  HealthCaseStatus,
  ClinicalCertainty,
  MovementRestrictionType,
  FollowUpStatus,
} from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { FarmAccessService } from '../../auth/services/farm-access.service';
import { HealthStateService, AnimalHealthState } from '../health-state.service';
import { SurveillanceService } from '../surveillance.service';
import { AnimalBusinessRulesService } from '../../common/business-rules/animal-business-rules.service';
import {
  HealthQueryDto,
  CreateClinicalExamDto,
  CreateRiskAssessmentDto,
  CreateExposureRecordDto,
  CreateMovementRestrictionDto,
  LiftMovementRestrictionDto,
  CreateFollowUpDto,
  CompleteFollowUpDto,
} from '../dto';

export interface PaginatedResult<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface TimelineEvent {
  id?: string;
  date: string;
  category:
    | 'EXAMINATION'
    | 'DIAGNOSIS'
    | 'TREATMENT'
    | 'WITHDRAWAL'
    | 'LAB'
    | 'VACCINATION'
    | 'QUARANTINE'
    | 'CLEARANCE'
    | 'FOLLOWUP';
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
  compositeState: AnimalHealthState;
  timeline: TimelineEvent[];
}

@Injectable()
export class HealthCoreService {
  private readonly logger = new Logger(HealthCoreService.name);
  constructor(
    private readonly prisma: PrismaService,
    private readonly farmAccessService: FarmAccessService,
    private readonly animalBusinessRulesService: AnimalBusinessRulesService,
    private readonly healthStateService: HealthStateService,
    private readonly surveillanceService: SurveillanceService,
  ) {}

  /**
   * Helper to verify and find animal by UUID or Tag Number scoped to user authorization.
   */
  private async findAuthorizedAnimal(
    animalTagOrId: string,
    farmScope: { farmIds: string[] },
  ) {
    const animal = await this.prisma.animal.findFirst({
      where: {
        OR: [
          { animalNumber: animalTagOrId },
          { id: animalTagOrId.length === 36 ? animalTagOrId : undefined },
        ],
        deletedAt: null,
      },
      include: { farm: true },
    });
    if (!animal) {
      throw new NotFoundException(
        `Animal '${animalTagOrId}' not found in registry`,
      );
    }

    if (!farmScope.farmIds.includes(animal.farmId)) {
      throw new ForbiddenException(
        `Access denied for animal '${animal.animalNumber}' on farm '${animal.farm.name}'`,
      );
    }

    if (animal.status === 'SOLD') {
      throw new BadRequestException(
        `Animal '${animal.animalNumber}' has been sold and is no longer available for farm processes.`,
      );
    }

    return animal;
  }

  async getHealthOverview(userId: string, farmId?: string) {
    const scope = await this.farmAccessService.resolveUserAccessibleFarms(
      userId,
      ['health:read'],
    );
    const farmFilter: Prisma.AnimalWhereInput = {
      deletedAt: null,
      ...(farmId ? { farmId } : { farmId: { in: scope.farmIds } }),
    };
    const targetFarmIds = farmId ? [farmId] : scope.farmIds;
    const [totalAnimals, quarantinedCount] = await Promise.all([
      this.prisma.animal.count({ where: farmFilter }),
      this.prisma.quarantineRecord.count({
        where: {
          status: QuarantineStatus.ACTIVE,
          ...(targetFarmIds ? { farmId: { in: targetFarmIds } } : {}),
        },
      }),
    ]);
    const activeTreatmentsCount = await this.prisma.treatment.count({
      where: {
        status: TreatmentStatus.IN_PROGRESS,
        animal: farmFilter,
      },
    });
    const healthyCount = Math.max(
      0,
      totalAnimals - (quarantinedCount + activeTreatmentsCount),
    );
    const criticalDiagnosesCount = await this.prisma.healthRecord.count({
      where: {
        severity: 'critical',
        animal: farmFilter,
      },
    });
    const now = new Date();
    const overdueVaccinationsCount = await this.prisma.vaccination.count({
      where: {
        nextDueDate: { lt: now },
        animal: farmFilter,
      },
    });
    const flaggedLabCount = await this.prisma.labResult.count({
      where: {
        isFlagged: true,
        ...(targetFarmIds ? { farmId: { in: targetFarmIds } } : {}),
      },
    });
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const [issuedThisMonth, pendingClearances, expiredClearances] =
      await Promise.all([
        this.prisma.healthClearance.count({
          where: {
            issuedDate: { gte: startOfMonth },
            ...(targetFarmIds ? { farmId: { in: targetFarmIds } } : {}),
          },
        }),
        this.prisma.healthClearance.count({
          where: {
            status: ClearanceStatus.PENDING,
            ...(targetFarmIds ? { farmId: { in: targetFarmIds } } : {}),
          },
        }),
        this.prisma.healthClearance.count({
          where: {
            status: ClearanceStatus.EXPIRED,
            ...(targetFarmIds ? { farmId: { in: targetFarmIds } } : {}),
          },
        }),
      ]);
    const [treatmentCategories, vaccineStats, quarantineZones] =
      await Promise.all([
        this.prisma.treatment.groupBy({
          by: ['category'],
          where: { status: TreatmentStatus.IN_PROGRESS, animal: farmFilter },
          _count: { id: true },
        }),
        this.prisma.vaccination.groupBy({
          by: ['vaccineName'],
          where: { animal: farmFilter },
          _count: { id: true },
        }),
        this.prisma.quarantineZone.findMany({
          where: targetFarmIds ? { farmId: { in: targetFarmIds } } : {},
          include: {
            _count: {
              select: {
                quarantineRecords: {
                  where: { status: QuarantineStatus.ACTIVE },
                },
              },
            },
          },
        }),
      ]);
    const recentQuarantines = await this.prisma.quarantineRecord.findMany({
      where: {
        status: QuarantineStatus.ACTIVE,
        ...(targetFarmIds ? { farmId: { in: targetFarmIds } } : {}),
      },
      include: { animal: true },
      orderBy: { createdAt: 'desc' },
      take: 2,
    });
    const recentTreatments = await this.prisma.treatment.findMany({
      where: {
        status: TreatmentStatus.IN_PROGRESS,
        animal: farmFilter,
      },
      include: { animal: true },
      orderBy: { createdAt: 'desc' },
      take: 2,
    });
    const recentLabAlerts = await this.prisma.labResult.findMany({
      where: {
        isFlagged: true,
        ...(targetFarmIds ? { farmId: { in: targetFarmIds } } : {}),
      },
      include: { animal: true },
      orderBy: { createdAt: 'desc' },
      take: 2,
    });
    const recentAlerts = [
      ...recentQuarantines.map((q) => ({
        type: 'critical',
        msg: `Animal ${q.animal.animalNumber} under quarantine in ${q.zoneName} — ${q.reason}`,
        time: q.createdAt.toISOString(),
      })),
      ...recentTreatments.map((t) => ({
        type: t.withdrawalMilk > 0 ? 'warning' : 'info',
        msg: `${t.animal.animalNumber} prescribed ${t.treatmentName}${t.withdrawalMilk > 0 ? ` (Milk withdrawal: ${t.withdrawalMilk} days)` : ''}`,
        time: t.createdAt.toISOString(),
      })),
      ...recentLabAlerts.map((l) => ({
        type: 'critical',
        msg: `Lab Alert: ${l.animal.animalNumber} flagged in ${l.testType}`,
        time: l.createdAt.toISOString(),
      })),
    ].slice(0, 5);
    return {
      kpis: [
        {
          label: 'Total Animals',
          value: totalAnimals.toString(),
          sub: `${totalAnimals} registered`,
          type: 'total',
        },
        {
          label: 'Healthy Animals',
          value: healthyCount.toString(),
          sub: `${totalAnimals > 0 ? Math.round((healthyCount / totalAnimals) * 100) : 100}% of herd`,
          type: 'healthy',
        },
        {
          label: 'Under Treatment',
          value: activeTreatmentsCount.toString(),
          sub: `${activeTreatmentsCount} active courses`,
          type: 'treatment',
        },
        {
          label: 'In Quarantine',
          value: quarantinedCount.toString(),
          sub: `${quarantinedCount} in isolation`,
          type: 'quarantine',
        },
      ],
      criticalAlertsCount:
        criticalDiagnosesCount + overdueVaccinationsCount + flaggedLabCount,
      moduleStats: {
        diagnoses: {
          activeCount: criticalDiagnosesCount,
          badge: `${criticalDiagnosesCount} Critical`,
        },
        vaccinations: {
          dueCount: overdueVaccinationsCount,
          badge: `${overdueVaccinationsCount} Due / Overdue`,
          stats: vaccineStats.slice(0, 3).map((v) => ({
            label: v.vaccineName,
            count: v._count.id,
          })),
        },
        treatments: {
          ongoingCount: activeTreatmentsCount,
          badge: `${activeTreatmentsCount} Ongoing`,
          stats: treatmentCategories.slice(0, 3).map((c) => ({
            label: c.category || 'Medication',
            count: c._count.id,
          })),
        },
        quarantine: {
          isolatedCount: quarantinedCount,
          badge: `${quarantinedCount} Isolated`,
          stats: quarantineZones.map((z) => ({
            label: z.name.split('—')[0].trim(),
            count: z._count.quarantineRecords,
          })),
        },
        clearances: {
          issuedThisMonth,
          pendingApproval: pendingClearances,
          expired: expiredClearances,
          badge: `${pendingClearances} Pending`,
        },
        labResults: {
          flaggedCount: flaggedLabCount,
          badge: `${flaggedLabCount} Flagged`,
        },
      },
      recentAlerts,
    };
  }

  async getDiagnoses(
    query: HealthQueryDto,
    userId: string,
  ): Promise<PaginatedResult<unknown>> {
    const scope = await this.farmAccessService.resolveUserAccessibleFarms(
      userId,
      ['health:read'],
    );
    const {
      page = 1,
      limit = 20,
      search,
      severity,
      status,
      farmId,
      animalId,
    } = query;
    const skip = (page - 1) * limit;
    const where: Prisma.HealthRecordWhereInput = {
      ...(farmId
        ? { animal: { farmId } }
        : { animal: { farmId: { in: scope.farmIds } } }),
      ...(animalId ? { animalId } : {}),
      ...(severity ? { severity } : {}),
      ...(status ? { healthStatus: status as HealthStatus } : {}),
      ...(search
        ? {
            OR: [
              { diagnosis: { contains: search, mode: 'insensitive' } },
              { symptoms: { contains: search, mode: 'insensitive' } },
              { notes: { contains: search, mode: 'insensitive' } },
              {
                animal: {
                  animalNumber: { contains: search, mode: 'insensitive' },
                },
              },
              {
                animal: {
                  name: { contains: search, mode: 'insensitive' },
                },
              },
            ],
          }
        : {}),
    };
    const [total, records] = await Promise.all([
      this.prisma.healthRecord.count({ where }),
      this.prisma.healthRecord.findMany({
        where,
        include: {
          animal: {
            select: {
              id: true,
              animalNumber: true,
              name: true,
              breed: true,
              species: true,
              farm: { select: { id: true, name: true } },
            },
          },
          recordedBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
        orderBy: { recordDate: 'desc' },
        skip,
        take: limit,
      }),
    ]);
    const formatted = records.map((r) => {
      let parsedSymptoms: string[] = [];
      if (r.symptoms) {
        try {
          const parsed = JSON.parse(r.symptoms) as unknown;
          if (Array.isArray(parsed)) {
            parsedSymptoms = parsed.map(String);
          }
        } catch {
          parsedSymptoms = r.symptoms.split(',').map((s) => s.trim());
        }
      }

      return {
        id: r.id,
        animalTag: r.animal.animalNumber,
        animalName: r.animal.name || 'Unnamed',
        breed: r.animal.breed,
        species: r.animal.species,
        condition: r.diagnosis || 'Unspecified Condition',
        severity: r.severity || 'moderate',
        status: r.healthStatus,
        date: r.recordDate.toISOString().split('T')[0],
        vet: `${r.recordedBy.firstName} ${r.recordedBy.lastName}`,
        symptoms: parsedSymptoms,
        notes: r.notes || '',
        farmName: r.animal.farm.name,
      };
    });
    return {
      data: formatted,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async createClinicalExam(dto: CreateClinicalExamDto, userId: string) {
    const scope = await this.farmAccessService.resolveUserAccessibleFarms(
      userId,
      ['health:record'],
    );
    const animal = await this.findAuthorizedAnimal(dto.animalTag, scope);
    return this.prisma.$transaction(async (tx) => {
      // 1. Get or create open health case
      let caseId = dto.caseId;
      if (!caseId) {
        const existingCase = await tx.healthCase.findFirst({
          where: {
            animalId: animal.id,
            status: {
              notIn: [HealthCaseStatus.RESOLVED, HealthCaseStatus.CLOSED],
            },
          },
        });

        if (existingCase) {
          caseId = existingCase.id;
        } else {
          const newCase = await tx.healthCase.create({
            data: {
              caseNumber: `CASE-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`,
              farmId: animal.farmId,
              animalId: animal.id,
              veterinarianId: userId,
              title:
                dto.initialAssessment ||
                `Clinical Exam: ${animal.animalNumber}`,
              chiefComplaint:
                dto.clinicalSigns?.join(', ') || 'Clinical examination',
              status: HealthCaseStatus.DIAGNOSED,
            },
          });
          caseId = newCase.id;
        }
      }

      // 2. Create Clinical Examination
      const exam = await tx.clinicalExamination.create({
        data: {
          caseId,
          animalId: animal.id,
          farmId: animal.farmId,
          veterinarianId: userId,
          examDate: dto.examDate ? new Date(dto.examDate) : new Date(),
          temperature: dto.temperature,
          heartRate: dto.heartRate,
          respiratoryRate: dto.respiratoryRate,
          rumenMotility: dto.rumenMotility,
          mucousMembranes: dto.mucousMembranes,
          bodyConditionScore: dto.bodyConditionScore,
          clinicalSigns: dto.clinicalSigns || [],
          initialAssessment: dto.initialAssessment,
          certainty: dto.certainty || ClinicalCertainty.SUSPECTED,
          notes: dto.notes,
        },
        include: {
          veterinarian: { select: { firstName: true, lastName: true } },
          animal: { select: { animalNumber: true, name: true, breed: true } },
        },
      });

      // 3. If diseaseCode provided, link disease and handle biosecurity triggers
      if (dto.diseaseCode) {
        const disease = await tx.disease.findFirst({
          where: { OR: [{ code: dto.diseaseCode }, { name: dto.diseaseCode }] },
        });

        if (disease) {
          await tx.animalDisease.create({
            data: {
              animalId: animal.id,
              diseaseId: disease.id,
              caseId,
              diagnosedById: userId,
              diagnosedDate: dto.examDate ? new Date(dto.examDate) : new Date(),
              notes: dto.notes,
            },
          });

          // Biosecurity triggers: quarantine / movement restrictions if required
          if (disease.quarantineRequired) {
            await tx.animal.update({
              where: { id: animal.id },
              data: { status: AnimalStatus.QUARANTINED },
            });

            const defaultZone = await tx.quarantineZone.findFirst({
              where: { farmId: animal.farmId },
            });

            const quarantineStart = dto.examDate
              ? new Date(dto.examDate)
              : new Date();
            await tx.quarantineRecord.create({
              data: {
                farmId: animal.farmId,
                animalId: animal.id,
                caseId,
                zoneId: defaultZone?.id,
                zoneName: defaultZone?.name || 'Isolation Zone A',
                reason: `Mandatory containment for ${disease.name}`,
                startDate: quarantineStart,
                expectedRelease: new Date(
                  quarantineStart.getTime() +
                    (disease.defaultWithdrawalDays || 21) * 24 * 60 * 60 * 1000,
                ),
                orderedById: userId,
              },
            });
          }

          if (disease.movementRestrictionRequired) {
            await tx.movementRestriction.create({
              data: {
                animalId: animal.id,
                farmId: animal.farmId,
                imposedById: userId,
                reason: `Mandatory movement restriction for notifiable disease: ${disease.name}`,
                restrictionType: MovementRestrictionType.ALL,
                startDate: new Date(),
                endDate: new Date(
                  Date.now() +
                    (disease.defaultWithdrawalDays || 21) * 24 * 60 * 60 * 1000,
                ),
                status: 'ACTIVE',
              },
            });
          }
        }
      }

      await tx.auditLog.create({
        data: {
          userId,
          action: 'CLINICAL_EXAMINATION_CREATE',
          entityType: 'ClinicalExamination',
          entityId: exam.id,
          newValues: {
            animalNumber: animal.animalNumber,
            temp: dto.temperature,
            assessment: dto.initialAssessment,
          },
        },
      });

      return exam;
    });
  }

  async getClinicalExams(query: HealthQueryDto, userId: string) {
    const scope = await this.farmAccessService.resolveUserAccessibleFarms(
      userId,
      ['health:read'],
    );
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const skip = (page - 1) * limit;
    const where: Prisma.ClinicalExaminationWhereInput = {
      ...(query.farmId
        ? { farmId: query.farmId }
        : { farmId: { in: scope.farmIds } }),
      ...(query.search
        ? {
            OR: [
              {
                initialAssessment: {
                  contains: query.search,
                  mode: 'insensitive',
                },
              },
              {
                animal: {
                  animalNumber: { contains: query.search, mode: 'insensitive' },
                },
              },
              {
                animal: {
                  name: { contains: query.search, mode: 'insensitive' },
                },
              },
            ],
          }
        : {}),
    };
    const [total, exams] = await Promise.all([
      this.prisma.clinicalExamination.count({ where }),
      this.prisma.clinicalExamination.findMany({
        where,
        include: {
          animal: {
            select: { id: true, animalNumber: true, name: true, breed: true },
          },
          veterinarian: { select: { firstName: true, lastName: true } },
          case: { select: { id: true, caseNumber: true, status: true } },
        },
        orderBy: { examDate: 'desc' },
        skip,
        take: limit,
      }),
    ]);
    return {
      data: exams,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async createRiskAssessment(dto: CreateRiskAssessmentDto, userId: string) {
    const scope = await this.farmAccessService.resolveUserAccessibleFarms(
      userId,
      ['health:record'],
    );
    const animal = await this.findAuthorizedAnimal(dto.animalTag, scope);
    return this.prisma.biosecurityRiskAssessment.create({
      data: {
        caseId: dto.caseId,
        animalId: animal.id,
        farmId: animal.farmId,
        assessedById: userId,
        riskLevel: dto.riskLevel,
        contagiousnessScore: dto.contagiousnessScore || 1,
        clinicalSeverity: dto.clinicalSeverity,
        exposureScore: dto.exposureScore || 1,
        containmentRecommendation: dto.containmentRecommendation,
        notes: dto.notes,
      },
      include: {
        animal: { select: { animalNumber: true, name: true } },
        assessedBy: { select: { firstName: true, lastName: true } },
      },
    });
  }

  async getRiskAssessments(query: HealthQueryDto, userId: string) {
    const scope = await this.farmAccessService.resolveUserAccessibleFarms(
      userId,
      ['health:read'],
    );
    const where: Prisma.BiosecurityRiskAssessmentWhereInput = {
      ...(query.farmId
        ? { farmId: query.farmId }
        : { farmId: { in: scope.farmIds } }),
    };
    return this.prisma.biosecurityRiskAssessment.findMany({
      where,
      include: {
        animal: { select: { animalNumber: true, name: true, breed: true } },
        assessedBy: { select: { firstName: true, lastName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createExposureRecord(dto: CreateExposureRecordDto, userId: string) {
    const scope = await this.farmAccessService.resolveUserAccessibleFarms(
      userId,
      ['health:record'],
    );
    await this.findAuthorizedAnimal(dto.sourceAnimalTag, scope);
    return this.surveillanceService.createExposureRecord(dto);
  }

  async getExposureGraph(farmId: string, userId: string) {
    const scope = await this.farmAccessService.resolveUserAccessibleFarms(
      userId,
      ['health:read'],
    );
    if (!scope.farmIds.includes(farmId)) {
      throw new ForbiddenException(
        'Unauthorized access to farm contact tracing',
      );
    }

    return this.surveillanceService.getFarmExposureGraph(farmId);
  }

  async createMovementRestriction(
    dto: CreateMovementRestrictionDto,
    userId: string,
  ) {
    const scope = await this.farmAccessService.resolveUserAccessibleFarms(
      userId,
      ['health:record'],
    );
    const animal = await this.findAuthorizedAnimal(dto.animalTag, scope);
    return this.prisma.movementRestriction.create({
      data: {
        animalId: animal.id,
        farmId: animal.farmId,
        imposedById: userId,
        reason: dto.reason,
        restrictionType: dto.restrictionType || MovementRestrictionType.ALL,
        startDate: new Date(),
        endDate: dto.endDate ? new Date(dto.endDate) : null,
        status: 'ACTIVE',
        notes: dto.notes,
      },
      include: {
        animal: { select: { animalNumber: true, name: true } },
        imposedBy: { select: { firstName: true, lastName: true } },
      },
    });
  }

  async liftMovementRestriction(
    id: string,
    dto: LiftMovementRestrictionDto,
    userId: string,
  ) {
    const scope = await this.farmAccessService.resolveUserAccessibleFarms(
      userId,
      ['health:read'],
    );
    const mr = await this.prisma.movementRestriction.findUnique({
      where: { id },
    });
    if (!mr)
      throw new NotFoundException(
        'The movement restriction record could not be found.',
      );
    if (!scope.farmIds.includes(mr.farmId)) {
      throw new ForbiddenException(
        'You do not have permission to lift this movement restriction.',
      );
    }

    return this.prisma.movementRestriction.update({
      where: { id },
      data: {
        status: 'LIFTED',
        liftedById: userId,
        liftedReason: dto.liftedReason,
        liftedAt: new Date(),
      },
    });
  }

  async getMovementRestrictions(query: HealthQueryDto, userId: string) {
    const scope = await this.farmAccessService.resolveUserAccessibleFarms(
      userId,
      ['health:read'],
    );
    const where: Prisma.MovementRestrictionWhereInput = {
      ...(query.farmId
        ? { farmId: query.farmId }
        : { farmId: { in: scope.farmIds } }),
      ...(query.status ? { status: query.status } : {}),
    };
    return this.prisma.movementRestriction.findMany({
      where,
      include: {
        animal: { select: { animalNumber: true, name: true, breed: true } },
        imposedBy: { select: { firstName: true, lastName: true } },
        liftedBy: { select: { firstName: true, lastName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getAnimalHealthTimeline(
    animalTagOrId: string,
    userId: string,
  ): Promise<AnimalHealthTimelineResponse> {
    const scope = await this.farmAccessService.resolveUserAccessibleFarms(
      userId,
      ['health:read'],
    );
    const animal = await this.findAuthorizedAnimal(animalTagOrId, scope);
    const [
      exams,
      diagnoses,
      treatments,
      withdrawals,
      labTests,
      vaccinations,
      quarantines,
      clearances,
      followUps,
      healthRecords,
    ] = await Promise.all([
      this.prisma.clinicalExamination.findMany({
        where: { animalId: animal.id },
        include: {
          veterinarian: { select: { firstName: true, lastName: true } },
        },
        orderBy: { examDate: 'desc' },
      }),
      this.prisma.animalDisease.findMany({
        where: { animalId: animal.id },
        include: {
          disease: true,
          diagnosedBy: { select: { firstName: true, lastName: true } },
        },
        orderBy: { diagnosedDate: 'desc' },
      }),
      this.prisma.treatment.findMany({
        where: { animalId: animal.id },
        include: {
          veterinarian: { select: { firstName: true, lastName: true } },
        },
        orderBy: { startDate: 'desc' },
      }),
      this.prisma.withdrawalPeriod.findMany({
        where: { animalId: animal.id },
        orderBy: { startDate: 'desc' },
      }),
      this.prisma.labTestRecord.findMany({
        where: { animalId: animal.id },
        include: { catalog: true },
        orderBy: { collectionDate: 'desc' },
      }),
      this.prisma.vaccination.findMany({
        where: { animalId: animal.id },
        include: {
          administeredBy: { select: { firstName: true, lastName: true } },
        },
        orderBy: { vaccinationDate: 'desc' },
      }),
      this.prisma.quarantineRecord.findMany({
        where: { animalId: animal.id },
        include: { orderedBy: { select: { firstName: true, lastName: true } } },
        orderBy: { startDate: 'desc' },
      }),
      this.prisma.healthClearance.findMany({
        where: { animalId: animal.id },
        include: { issuedBy: { select: { firstName: true, lastName: true } } },
        orderBy: { issuedDate: 'desc' },
      }),
      this.prisma.followUp.findMany({
        where: { animalId: animal.id },
        include: {
          assignedVet: { select: { firstName: true, lastName: true } },
        },
        orderBy: { scheduledDate: 'desc' },
      }),
      this.prisma.healthRecord.findMany({
        where: { animalId: animal.id },
        include: {
          recordedBy: { select: { firstName: true, lastName: true } },
        },
        orderBy: { recordDate: 'desc' },
      }),
    ]);
    const events: TimelineEvent[] = [];
    exams.forEach((e) => {
      events.push({
        date: e.examDate.toISOString(),
        category: 'EXAMINATION',
        title: `Clinical Exam: ${e.initialAssessment || 'Routine'}`,
        description: `Temp: ${e.temperature ?? '—'}°C, Pulse: ${e.heartRate ?? '—'} BPM, Resp: ${e.respiratoryRate ?? '—'}, Rumen: ${e.rumenMotility ?? '—'} /2m. Signs: ${e.clinicalSigns.join(', ') || 'None'}`,
        actor: `Dr. ${e.veterinarian.firstName} ${e.veterinarian.lastName}`,
        status: e.certainty,
      });
    });
    diagnoses.forEach((d) => {
      events.push({
        date: d.diagnosedDate.toISOString(),
        category: 'DIAGNOSIS',
        title: `Diagnosed: ${d.disease.name}`,
        description:
          d.notes || d.disease.description || 'Clinical diagnosis recorded',
        actor: `${d.diagnosedBy.firstName} ${d.diagnosedBy.lastName}`,
        status: d.status,
      });
    });
    treatments.forEach((t) => {
      events.push({
        date: t.startDate.toISOString(),
        category: 'TREATMENT',
        title: `Prescription: ${t.treatmentName}`,
        description: `Dose: ${t.dose || 'Standard'}, Category: ${t.category}. Milk with: ${t.withdrawalMilk}d, Meat with: ${t.withdrawalMeat}d`,
        actor: `Dr. ${t.veterinarian.firstName} ${t.veterinarian.lastName}`,
        status: t.status,
      });
    });
    withdrawals.forEach((w) => {
      events.push({
        id: w.id,
        date: w.startDate.toISOString(),
        category: 'WITHDRAWAL',
        title: `${w.productType} Withdrawal Imposed`,
        description: `Active until ${w.endDate.toISOString().split('T')[0]}. ${w.notes || ''}`,
        actor: 'Automated Food Safety Protocol',
        status: w.status,
      });
    });
    labTests.forEach((l) => {
      events.push({
        id: l.id,
        date: l.collectionDate.toISOString(),
        category: 'LAB',
        title: `Laboratory Sample: ${l.catalog?.name || l.sampleType}`,
        description: `Lab: ${l.laboratory}. Result: ${l.resultValue || l.resultInterpretation || 'Pending'}. Abnormal: ${l.isAbnormal ? 'YES' : 'NO'}`,
        actor: 'Diagnostic Lab',
        status: l.stage,
      });
    });
    vaccinations.forEach((v) => {
      events.push({
        id: v.id,
        date: v.vaccinationDate.toISOString(),
        category: 'VACCINATION',
        title: `Vaccinated: ${v.vaccineName}`,
        description: `Dose: ${v.dose}. Next Booster Due: ${v.nextDueDate ? v.nextDueDate.toISOString().split('T')[0] : 'None'}`,
        actor: `${v.administeredBy.firstName} ${v.administeredBy.lastName}`,
        status: v.status,
      });
    });
    quarantines.forEach((q) => {
      events.push({
        date: q.startDate.toISOString(),
        category: 'QUARANTINE',
        title: `Biosecurity Isolation: ${q.zoneName}`,
        description: `Reason: ${q.reason}. Expected Release: ${q.expectedRelease.toISOString().split('T')[0]}`,
        actor: `${q.orderedBy.firstName} ${q.orderedBy.lastName}`,
        status: q.status,
      });
    });
    clearances.forEach((c) => {
      events.push({
        date: c.issuedDate.toISOString(),
        category: 'CLEARANCE',
        title: `Health Clearance: ${c.permitNo}`,
        description: `Purpose: ${c.purpose} → Destination: ${c.destination}. Valid until: ${c.validUntil.toISOString().split('T')[0]}`,
        actor: `${c.issuedBy.firstName} ${c.issuedBy.lastName}`,
        status: c.status,
      });
    });
    followUps.forEach((f) => {
      events.push({
        date: f.scheduledDate.toISOString(),
        category: 'FOLLOWUP',
        title: `Clinical Follow-up: ${f.reason}`,
        description: f.outcome || 'Pending clinical evaluation',
        actor: `Dr. ${f.assignedVet.firstName} ${f.assignedVet.lastName}`,
        status: f.status,
      });
    });
    healthRecords.forEach((hr) => {
      let symptomsText = '';
      if (hr.symptoms) {
        try {
          const parsed = JSON.parse(hr.symptoms) as unknown;
          if (Array.isArray(parsed)) {
            symptomsText = parsed.join(', ');
          } else {
            symptomsText = String(hr.symptoms);
          }
        } catch {
          symptomsText = hr.symptoms;
        }
      }

      events.push({
        date: hr.recordDate.toISOString(),
        category: 'DIAGNOSIS',
        title: `Health Check: ${hr.diagnosis || 'Clinical Examination'}`,
        description: `Status: ${hr.healthStatus}${hr.severity ? ` (${hr.severity})` : ''}.${symptomsText ? ` Symptoms: ${symptomsText}.` : ''}${hr.notes ? ` Notes: ${hr.notes}` : ''}`,
        actor: `${hr.recordedBy.firstName} ${hr.recordedBy.lastName}`,
        status: hr.healthStatus,
      });
    });
    events.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );
    const compositeState =
      await this.healthStateService.evaluateAnimalHealthState(animal.id);
    return {
      animal: {
        id: animal.id,
        tag: animal.animalNumber,
        name: animal.name,
        species: animal.species,
        breed: animal.breed,
        farmName: animal.farm.name,
      },
      compositeState,
      timeline: events,
    };
  }

  async getAnimalEligibility(animalTagOrId: string, userId: string) {
    const scope = await this.farmAccessService.resolveUserAccessibleFarms(
      userId,
      ['health:read'],
    );
    const animal = await this.findAuthorizedAnimal(animalTagOrId, scope);
    return this.healthStateService.evaluateAnimalHealthState(animal.id);
  }

  async getOutbreakSurveillance(userId: string, farmId?: string) {
    const scope = await this.farmAccessService.resolveUserAccessibleFarms(
      userId,
      ['health:read'],
    );
    const targetFarmId = farmId || scope.farmIds[0];
    return this.surveillanceService.detectOutbreaks(targetFarmId);
  }

  async getHealthAlerts(userId: string, farmId?: string) {
    const scope = await this.farmAccessService.resolveUserAccessibleFarms(
      userId,
      ['health:read'],
    );
    const targetFarmIds = farmId ? [farmId] : scope.farmIds;
    return this.prisma.healthAlert.findMany({
      where: {
        isResolved: false,
        ...(targetFarmIds ? { farmId: { in: targetFarmIds } } : {}),
      },
      include: {
        farm: { select: { name: true } },
        animal: { select: { animalNumber: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
  }

  async resolveHealthAlert(id: string, userId: string) {
    const alert = await this.prisma.healthAlert.findUnique({ where: { id } });
    if (!alert)
      throw new NotFoundException('The health alert could not be found.');
    return this.prisma.healthAlert.update({
      where: { id },
      data: {
        isResolved: true,
        resolvedById: userId,
        resolvedAt: new Date(),
      },
    });
  }

  async getFollowUps(userId: string, farmId?: string) {
    const scope = await this.farmAccessService.resolveUserAccessibleFarms(
      userId,
      ['health:read'],
    );
    const targetFarmIds = farmId ? [farmId] : scope.farmIds;
    return this.prisma.followUp.findMany({
      where: {
        ...(targetFarmIds ? { farmId: { in: targetFarmIds } } : {}),
      },
      include: {
        animal: { select: { animalNumber: true, name: true, breed: true } },
        assignedVet: { select: { firstName: true, lastName: true } },
        case: { select: { caseNumber: true, title: true } },
      },
      orderBy: { scheduledDate: 'asc' },
    });
  }

  async createFollowUp(dto: CreateFollowUpDto, userId: string) {
    const scope = await this.farmAccessService.resolveUserAccessibleFarms(
      userId,
      ['health:record'],
    );
    const animal = await this.findAuthorizedAnimal(dto.animalTag, scope);
    return this.prisma.followUp.create({
      data: {
        caseId: dto.caseId,
        animalId: animal.id,
        farmId: animal.farmId,
        assignedVetId: dto.assignedVetId || userId,
        scheduledDate: new Date(dto.scheduledDate),
        reason: dto.reason,
        notes: dto.notes,
      },
      include: {
        animal: { select: { animalNumber: true, name: true } },
        assignedVet: { select: { firstName: true, lastName: true } },
      },
    });
  }

  async completeFollowUp(id: string, dto: CompleteFollowUpDto, userId: string) {
    const scope = await this.farmAccessService.resolveUserAccessibleFarms(
      userId,
      ['health:record'],
    );
    const fu = await this.prisma.followUp.findUnique({ where: { id } });
    if (!fu)
      throw new NotFoundException('The follow-up record could not be found.');
    if (!scope.farmIds.includes(fu.farmId)) {
      throw new ForbiddenException('Unauthorized access to follow-up record');
    }

    return this.prisma.followUp.update({
      where: { id },
      data: {
        status: dto.status || FollowUpStatus.COMPLETED,
        outcome: dto.outcome,
        completedAt: new Date(),
        notes: dto.notes
          ? `${fu.notes || ''}\nOutcome: ${dto.notes}`
          : fu.notes,
      },
    });
  }
}
