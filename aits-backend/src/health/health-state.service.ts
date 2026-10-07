import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

export interface AnimalHealthState {
  animalId: string;
  animalNumber: string;
  name: string | null;
  species: string;
  breed: string;
  farmId: string;
  primaryHealthState:
    | 'HEALTHY'
    | 'UNDER_OBSERVATION'
    | 'UNDER_TREATMENT'
    | 'QUARANTINED'
    | 'MOVEMENT_RESTRICTED'
    | 'WITHDRAWAL_ACTIVE'
    | 'DECEASED';
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
    canSale: boolean;
    canExport: boolean;
    canIssueClearance: boolean;
    blockingReasons: string[];
    reasons: string[];
  };
  openCasesCount: number;
}

@Injectable()
export class HealthStateService {
  private readonly logger = new Logger(HealthStateService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Authoritatively evaluates the multi-factor health state of an animal.
   */
  async evaluateAnimalHealthState(
    animalId: string,
  ): Promise<AnimalHealthState> {
    const animal = await this.prisma.animal.findUnique({
      where: { id: animalId },
      include: {
        healthCases: {
          where: { status: { notIn: ['RESOLVED', 'CLOSED'] } },
          select: { id: true, caseNumber: true, title: true, status: true },
        },
        treatments: {
          where: { status: 'IN_PROGRESS' },
          select: {
            id: true,
            treatmentName: true,
            startDate: true,
            withdrawalMilk: true,
            withdrawalMeat: true,
          },
        },
        quarantineRecords: {
          where: { status: 'ACTIVE' },
          select: {
            id: true,
            zoneName: true,
            reason: true,
            startDate: true,
            expectedRelease: true,
          },
        },
        movementRestrictions: {
          where: { status: 'ACTIVE' },
          select: {
            id: true,
            reason: true,
            restrictionType: true,
            startDate: true,
            endDate: true,
          },
        },
        withdrawals: {
          where: { status: 'ACTIVE' },
          include: { treatment: { select: { treatmentName: true } } },
        },
        labTestRecords: {
          where: {
            stage: {
              in: ['REQUESTED', 'COLLECTED', 'SUBMITTED', 'IN_TESTING'],
            },
          },
          select: { id: true, sampleId: true, sampleType: true, stage: true },
        },
        diseases: {
          where: { status: 'ACTIVE' },
          include: {
            disease: {
              select: { name: true, contagious: true, reportable: true },
            },
          },
        },
      },
    });

    if (!animal) {
      throw new Error(`The requested animal profile could not be found.`);
    }

    const now = new Date();

    // 1. Evaluate Milk Withdrawal
    const activeMilkWithdrawal = animal.withdrawals.find(
      (w) =>
        w.productType === 'MILK' && w.endDate > now && w.status === 'ACTIVE',
    );
    const milkHoursRemaining = activeMilkWithdrawal
      ? Math.max(
          0,
          Math.ceil(
            (activeMilkWithdrawal.endDate.getTime() - now.getTime()) /
              (1000 * 60 * 60),
          ),
        )
      : 0;

    // 2. Evaluate Meat Withdrawal
    const activeMeatWithdrawal = animal.withdrawals.find(
      (w) =>
        w.productType === 'MEAT' && w.endDate > now && w.status === 'ACTIVE',
    );
    const meatDaysRemaining = activeMeatWithdrawal
      ? Math.max(
          0,
          Math.ceil(
            (activeMeatWithdrawal.endDate.getTime() - now.getTime()) /
              (1000 * 60 * 60 * 24),
          ),
        )
      : 0;

    // 3. Flags
    const inQuarantine = animal.quarantineRecords.length > 0;
    const hasActiveTreatment = animal.treatments.length > 0;
    const hasActiveDiagnosis = animal.diseases.length > 0;
    const hasMovementRestriction = animal.movementRestrictions.length > 0;
    const hasSlaughterRestriction = animal.movementRestrictions.some(
      (mr) =>
        mr.restrictionType === 'SLAUGHTER' || mr.restrictionType === 'ALL',
    );
    const hasSaleRestriction = animal.movementRestrictions.some(
      (mr) => mr.restrictionType === 'SALE' || mr.restrictionType === 'ALL',
    );
    const hasTransitRestriction = animal.movementRestrictions.some(
      (mr) =>
        mr.restrictionType === 'TRANSFER' ||
        mr.restrictionType === 'TRANSPORT' ||
        mr.restrictionType === 'ALL',
    );
    const hasExportRestriction = animal.movementRestrictions.some(
      (mr) =>
        mr.restrictionType === 'SALE' ||
        mr.restrictionType === 'TRANSFER' ||
        mr.restrictionType === 'TRANSPORT' ||
        mr.restrictionType === 'ALL',
    );
    const hasMilkWithdrawal = milkHoursRemaining > 0;
    const hasMeatWithdrawal = meatDaysRemaining > 0;
    const hasPendingLabTest = animal.labTestRecords.length > 0;

    // 4. Blocking Reasons & Eligibility
    const blockingReasons: string[] = [];

    if (inQuarantine) {
      blockingReasons.push(
        `Quarantined in ${animal.quarantineRecords[0].zoneName} (${animal.quarantineRecords[0].reason})`,
      );
    }
    if (hasMovementRestriction) {
      blockingReasons.push(
        `Active Movement Restriction: ${animal.movementRestrictions[0].reason}`,
      );
    }
    if (hasMilkWithdrawal) {
      blockingReasons.push(
        `Active Milk Withdrawal: ${milkHoursRemaining} hours remaining (${activeMilkWithdrawal?.treatment?.treatmentName || 'Medication withholding'})`,
      );
    }
    if (hasMeatWithdrawal) {
      blockingReasons.push(
        `Active Meat / Slaughter Withdrawal: ${meatDaysRemaining} days remaining (${activeMeatWithdrawal?.treatment?.treatmentName || 'Medication withholding'})`,
      );
    }
    const contagiousDiseases = animal.diseases.filter(
      (d) => d.disease.contagious,
    );
    if (contagiousDiseases.length > 0) {
      blockingReasons.push(
        `Active Contagious Disease: ${contagiousDiseases.map((d) => d.disease.name).join(', ')}`,
      );
    }

    const canCollectMilk =
      !inQuarantine && !hasMilkWithdrawal && contagiousDiseases.length === 0;
    const canSlaughter =
      !inQuarantine && !hasSlaughterRestriction && !hasMeatWithdrawal;
    const canTransfer = !inQuarantine && !hasTransitRestriction;
    const canSale = !inQuarantine && !hasSaleRestriction;
    const canExport = !inQuarantine && !hasExportRestriction;

    // 5. Authoritative Primary State Determination
    let primaryHealthState: AnimalHealthState['primaryHealthState'] = 'HEALTHY';
    if (animal.status === 'DECEASED') {
      primaryHealthState = 'DECEASED';
    } else if (inQuarantine) {
      primaryHealthState = 'QUARANTINED';
    } else if (hasMovementRestriction) {
      primaryHealthState = 'MOVEMENT_RESTRICTED';
    } else if (hasActiveTreatment) {
      primaryHealthState = 'UNDER_TREATMENT';
    } else if (hasActiveDiagnosis || animal.healthCases.length > 0) {
      primaryHealthState = 'UNDER_OBSERVATION';
    } else if (hasMilkWithdrawal || hasMeatWithdrawal) {
      primaryHealthState = 'WITHDRAWAL_ACTIVE';
    }

    return {
      animalId: animal.id,
      animalNumber: animal.animalNumber,
      name: animal.name,
      species: animal.species,
      breed: animal.breed,
      farmId: animal.farmId,
      primaryHealthState,
      flags: {
        inQuarantine,
        hasActiveTreatment,
        hasActiveDiagnosis,
        hasMovementRestriction,
        hasMilkWithdrawal,
        hasMeatWithdrawal,
        hasPendingLabTest,
        hasCriticalAlert: inQuarantine || hasMovementRestriction,
      },
      withdrawals: {
        milk: {
          active: hasMilkWithdrawal,
          endDate: activeMilkWithdrawal
            ? activeMilkWithdrawal.endDate.toISOString()
            : null,
          hoursRemaining: milkHoursRemaining,
          treatmentName: activeMilkWithdrawal?.treatment?.treatmentName || null,
        },
        meat: {
          active: hasMeatWithdrawal,
          endDate: activeMeatWithdrawal
            ? activeMeatWithdrawal.endDate.toISOString()
            : null,
          daysRemaining: meatDaysRemaining,
          treatmentName: activeMeatWithdrawal?.treatment?.treatmentName || null,
        },
      },
      eligibility: {
        canCollectMilk,
        canSlaughter,
        canTransfer,
        canSale,
        canExport,
        canIssueClearance:
          canTransfer &&
          !hasActiveTreatment &&
          !inQuarantine &&
          !hasActiveDiagnosis,
        blockingReasons,
        reasons: blockingReasons,
      },
      openCasesCount: animal.healthCases.length,
    };
  }

  /**
   * Strict validation helper that asserts an animal can be cleared or transferred.
   * Throws Error if animal is ineligible.
   */
  async assertClearanceEligibility(
    animalId: string,
    clearanceType: string,
  ): Promise<AnimalHealthState> {
    const state = await this.evaluateAnimalHealthState(animalId);

    if (!state.eligibility.canIssueClearance) {
      throw new Error(
        `Animal ${state.animalNumber} is ineligible for any health clearance. Reasons: ${state.eligibility.blockingReasons.join('; ')}`,
      );
    }

    if (clearanceType === 'SLAUGHTER' && !state.eligibility.canSlaughter) {
      throw new Error(
        `Animal ${state.animalNumber} is ineligible for slaughter clearance. Reasons: ${state.eligibility.blockingReasons.join('; ')}`,
      );
    }

    if (clearanceType === 'LIVE_SALE' && !state.eligibility.canSale) {
      throw new Error(
        `Animal ${state.animalNumber} is ineligible for live sale clearance. Reasons: ${state.eligibility.blockingReasons.join('; ')}`,
      );
    }

    if (clearanceType === 'EXPORT' && !state.eligibility.canExport) {
      throw new Error(
        `Animal ${state.animalNumber} is ineligible for export clearance. Reasons: ${state.eligibility.blockingReasons.join('; ')}`,
      );
    }

    if (clearanceType === 'TRANSIT' && !state.eligibility.canTransfer) {
      throw new Error(
        `Animal ${state.animalNumber} is ineligible for transit clearance. Reasons: ${state.eligibility.blockingReasons.join('; ')}`,
      );
    }

    return state;
  }
}
