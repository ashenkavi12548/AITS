import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { Prisma } from '@prisma/client';
import {
  ReportFilterDto,
  ReportDownloadRequestDto,
} from '../dto/report-query.dto';
import { ReportPreviewData, ReportSummaryItem } from '../types/dashboard.types';
import { DashboardHelpersService } from './dashboard-helpers.service';
import { DashboardAnalyticsService } from './dashboard-analytics.service';
import { DashboardOperationsService } from './dashboard-operations.service';

@Injectable()
export class DashboardExportService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly helpers: DashboardHelpersService,
    private readonly analytics: DashboardAnalyticsService,
    private readonly operations: DashboardOperationsService,
  ) {}

  async getFiltersMeta(userId?: string) {
    const { farmIds } = await this.helpers.resolveAuthorizedFarms(userId);
    const farmWhere: Prisma.FarmWhereInput = { deletedAt: null };
    if (farmIds.length > 0) {
      farmWhere.id = { in: farmIds };
    }

    const farms = await this.prisma.farm.findMany({
      where: farmWhere,
      select: { id: true, name: true, registrationNumber: true },
      orderBy: { name: 'asc' },
    });

    const distinctBreeds = await this.prisma.animal.findMany({
      where: { deletedAt: null },
      select: { breed: true },
      distinct: ['breed'],
    });

    const breeds = Array.from(
      new Set(
        distinctBreeds
          .map((b) => b.breed?.trim())
          .filter((b): b is string => Boolean(b)),
      ),
    );

    const distinctDiagnoses = await this.prisma.healthRecord.findMany({
      select: { diagnosis: true },
      distinct: ['diagnosis'],
    });

    const diagnoses = Array.from(
      new Set(
        distinctDiagnoses
          .map((d) => d.diagnosis?.trim())
          .filter((d): d is string => Boolean(d)),
      ),
    );

    return {
      farms: [
        { id: 'ALL', name: 'All Assigned Farms' },
        ...farms.map((f) => ({
          id: f.id,
          name: `${f.name} (${f.registrationNumber || 'Accredited'})`,
        })),
      ],
      breeds: [
        'All Breeds',
        ...(breeds.length > 0 ? breeds.sort((a, b) => a.localeCompare(b)) : []),
      ],
      statuses: [
        'All Statuses',
        'ACTIVE',
        'SICK',
        'QUARANTINED',
        'TRANSFERRED',
        'DECEASED',
        'SOLD',
      ],
      diagnoses: [
        'All Diagnoses',
        ...(diagnoses.length > 0
          ? diagnoses.sort((a, b) => a.localeCompare(b))
          : []),
      ],
      pregnancyStatuses: [
        'All Statuses',
        'PENDING',
        'CONFIRMED',
        'COMPLETED',
        'FAILED',
        'CANCELLED',
      ],
    };
  }

  // ===========================================================================
  // 8. REPORT PREVIEW & EXPORT
  // ===========================================================================
  async generateReportPreview(
    dto: ReportDownloadRequestDto,
    userId?: string,
  ): Promise<ReportPreviewData> {
    const user = await this.operations.getCurrentUser(userId);
    const filterDto: ReportFilterDto = {
      farmId: dto.farmId,
      startDate: dto.startDate,
      endDate: dto.endDate,
      status: dto.status || dto.animalStatus,
      breed: dto.breed,
      searchQuery: dto.searchQuery,
      limit: 500,
    };

    let title = 'Executive Operational & Herd Inventory Overview';
    let summaryItems: ReportSummaryItem[] = [];
    let sampleRows: Record<string, unknown>[] = [];
    let chartSummary: Array<{ title: string; dataPointsCount: number }> = [];

    if (dto.reportType === 'PRODUCTION') {
      title = 'Milk Production & Quality Performance Report';
      const data = await this.analytics.getProductionAnalytics(
        filterDto,
        userId,
      );
      summaryItems = data.summary;
      sampleRows = data.tableData.data;
      chartSummary = [
        { title: 'Daily Yield Trend', dataPointsCount: data.dailyTrend.length },
        {
          title: 'Top Producing Animals',
          dataPointsCount: data.topProducingAnimals.length,
        },
      ];
    } else if (dto.reportType === 'HEALTH') {
      title = 'Herd Health & Clinical Surveillance Audit';
      const data = await this.analytics.getHealthAnalytics(filterDto, userId);
      summaryItems = data.summary;
      sampleRows = data.tableData.data;
      chartSummary = [
        {
          title: 'Cases by Diagnosis',
          dataPointsCount: data.casesByDiagnosis.length,
        },
        {
          title: 'Treatment Status',
          dataPointsCount: data.treatmentStatusDistribution.length,
        },
      ];
    } else if (dto.reportType === 'FEEDING') {
      title = 'Feed Utilization & Nutrition Intake Ledger';
      const data = await this.analytics.getFeedingAnalytics(filterDto, userId);
      summaryItems = data.summary;
      sampleRows = data.tableData.data;
      chartSummary = [
        {
          title: 'Consumption by Type',
          dataPointsCount: data.feedConsumptionByType.length,
        },
      ];
    } else if (dto.reportType === 'BREEDING') {
      title = 'Breeding, AI & Calving Lifecycle Report';
      const data = await this.analytics.getBreedingAnalytics(filterDto, userId);
      summaryItems = data.summary;
      sampleRows = data.tableData.data;
      chartSummary = [
        {
          title: 'Pregnancy Distribution',
          dataPointsCount: data.pregnancyStatusDistribution.length,
        },
      ];
    } else if (dto.reportType === 'TRACEABILITY') {
      title = 'National Traceability & Movement Manifest';
      const data = await this.analytics.getTraceabilityAnalytics(
        filterDto,
        userId,
      );
      summaryItems = data.summary;
      sampleRows = data.tableData.data;
      chartSummary = [
        {
          title: 'Movement Reasons',
          dataPointsCount: data.movementReasons.length,
        },
        {
          title: 'Transfer Status',
          dataPointsCount: data.statusDistribution.length,
        },
      ];
    } else if (dto.reportType === 'ANIMAL_LIFETIME') {
      title = 'Individual Animal Pedigree & Lifetime Traceability Dossier';
      const { farmIds } = await this.helpers.resolveAuthorizedFarms(
        userId,
        dto.farmId,
      );

      const animalWhere: Prisma.AnimalWhereInput = { deletedAt: null };
      if (farmIds.length > 0) {
        animalWhere.farmId = { in: farmIds };
      }
      if (dto.animalId) {
        animalWhere.id = dto.animalId;
      } else if (dto.searchQuery) {
        const q = dto.searchQuery.trim();
        animalWhere.OR = [
          { animalNumber: { contains: q, mode: 'insensitive' } },
          { name: { contains: q, mode: 'insensitive' } },
        ];
      }

      const animal = await this.prisma.animal.findFirst({
        where: animalWhere,
        include: {
          farm: {
            select: {
              id: true,
              name: true,
              registrationNumber: true,
              owner: {
                select: { firstName: true, lastName: true, email: true },
              },
            },
          },
          identifiers: { where: { isPrimary: true }, take: 1 },
          mother: { select: { animalNumber: true, breed: true, name: true } },
          father: { select: { animalNumber: true, breed: true, name: true } },
          milkProduction: {
            orderBy: { productionDate: 'desc' },
            select: {
              id: true,
              productionDate: true,
              quantityLiters: true,
              milkQuality: true,
              milkingSession: true,
            },
          },
          healthRecords: {
            orderBy: { recordDate: 'desc' },
            select: {
              id: true,
              recordDate: true,
              diagnosis: true,
              healthStatus: true,
              severity: true,
              symptoms: true,
              notes: true,
              recordedBy: { select: { firstName: true, lastName: true } },
            },
          },
          vaccinations: {
            orderBy: { vaccinationDate: 'desc' },
            select: {
              id: true,
              vaccinationDate: true,
              vaccineName: true,
              dose: true,
              batchNumber: true,
              status: true,
              administeredBy: { select: { firstName: true, lastName: true } },
            },
          },
          femaleBreedingRecords: {
            orderBy: { breedingDate: 'desc' },
            include: {
              maleAnimal: { select: { animalNumber: true, breed: true } },
              technician: { select: { firstName: true, lastName: true } },
            },
          },
          pregnancies: {
            orderBy: { pregnancyDate: 'desc' },
            select: {
              id: true,
              pregnancyDate: true,
              expectedCalvingDate: true,
              actualCalvingDate: true,
              status: true,
              notes: true,
            },
          },
          farmTransfers: {
            orderBy: { departureDate: 'desc' },
            include: {
              fromFarm: { select: { name: true } },
              toFarm: { select: { name: true } },
              recordedBy: { select: { firstName: true, lastName: true } },
            },
          },
          calvingRecords: {
            orderBy: { calvingDate: 'desc' },
            select: {
              id: true,
              calvingDate: true,
              calfCount: true,
              calvingType: true,
              complications: true,
              notes: true,
            },
          },
        },
      });

      if (animal) {
        const lifetimeMilk = animal.milkProduction.reduce(
          (sum, m) => sum + m.quantityLiters,
          0,
        );
        const healthInterventions =
          animal.healthRecords.length + animal.vaccinations.length;
        const totalTransfers = animal.farmTransfers.length;
        const calvingsCount = animal.calvingRecords.length;
        const breedingCount = animal.femaleBreedingRecords.length;

        summaryItems = [
          this.helpers.createSummaryItem({
            id: 'animal-identity',
            label: `Animal #${animal.animalNumber}`,
            value: animal.name || animal.breed,
            description: `Breed: ${animal.breed} • Status: ${animal.status} • Sex: ${animal.gender}`,
            iconName: 'BadgeCheck',
          }),
          this.helpers.createSummaryItem({
            id: 'lifetime-milk',
            label: 'Lifetime Milk Output',
            value: Number(lifetimeMilk.toFixed(1)),
            unit: 'L',
            description: `Accumulated across ${animal.milkProduction.length} recorded milking shifts`,
            iconName: 'Milk',
          }),
          this.helpers.createSummaryItem({
            id: 'health-interventions',
            label: 'Veterinary Interventions',
            value: healthInterventions,
            description: `${animal.healthRecords.length} clinical exams & ${animal.vaccinations.length} vaccines`,
            iconName: 'HeartPulse',
          }),
          this.helpers.createSummaryItem({
            id: 'breeding-inseminations',
            label: 'Breeding Inseminations',
            value: breedingCount,
            description: 'Documented AI straws & natural mating services',
            iconName: 'Dna',
          }),
          this.helpers.createSummaryItem({
            id: 'calving-parity',
            label: 'Calving Records',
            value: calvingsCount,
            description: 'Documented offspring & calving history',
            iconName: 'GitBranch',
          }),
          this.helpers.createSummaryItem({
            id: 'movement-history',
            label: 'Farm Transfers',
            value: totalTransfers,
            description: 'Approved inter-facility relocations',
            iconName: 'Truck',
          }),
        ];

        // Construct Chronological Milestone Events Timeline
        interface MilestoneEntry {
          rawDate: Date;
          dateTime: string;
          milestoneCategory: string;
          milestoneTitle: string;
          milestoneDetails: string;
          farmLocation: string;
          recordedBy: string;
          status: string;
        }

        const milestones: MilestoneEntry[] = [];

        // 1. Birth Registration
        milestones.push({
          rawDate: animal.dateOfBirth,
          dateTime: animal.dateOfBirth.toISOString().slice(0, 10),
          milestoneCategory: 'REGISTRATION',
          milestoneTitle: 'Animal Birth Registered',
          milestoneDetails: `Dam: ${animal.mother?.animalNumber || 'Unknown'} • Sire: ${animal.father?.animalNumber || 'Unknown'} • Color: ${animal.color || 'Standard'}`,
          farmLocation: animal.farm?.name || 'Primary Farm',
          recordedBy: animal.farm?.owner
            ? `${animal.farm.owner.firstName} ${animal.farm.owner.lastName}`
            : 'System Admin',
          status: 'VERIFIED',
        });

        // 2. Health Records
        animal.healthRecords.forEach((h) => {
          milestones.push({
            rawDate: h.recordDate,
            dateTime: h.recordDate.toISOString().slice(0, 10),
            milestoneCategory: 'HEALTH',
            milestoneTitle: `Clinical Diagnosis: ${h.diagnosis || 'Health Examination'}`,
            milestoneDetails:
              [
                h.severity ? `Severity: ${h.severity}` : null,
                h.symptoms ? `Symptoms: ${h.symptoms}` : null,
                h.notes ? `Notes: ${h.notes}` : null,
              ]
                .filter(Boolean)
                .join(' • ') || 'Clinical evaluation performed',
            farmLocation: animal.farm?.name || '',
            recordedBy: h.recordedBy
              ? `${h.recordedBy.firstName} ${h.recordedBy.lastName}`
              : 'Attending Vet',
            status: h.healthStatus || 'RECORDED',
          });
        });

        // 3. Vaccinations
        animal.vaccinations.forEach((v) => {
          milestones.push({
            rawDate: v.vaccinationDate,
            dateTime: v.vaccinationDate.toISOString().slice(0, 10),
            milestoneCategory: 'VACCINATION',
            milestoneTitle: `Immunization: ${v.vaccineName}`,
            milestoneDetails: `Dose: ${v.dose} • Batch: ${v.batchNumber || 'Official Standard'}`,
            farmLocation: animal.farm?.name || '',
            recordedBy: v.administeredBy
              ? `${v.administeredBy.firstName} ${v.administeredBy.lastName}`
              : 'Veterinarian',
            status: v.status || 'ADMINISTERED',
          });
        });

        // 4. Breeding & Inseminations
        animal.femaleBreedingRecords.forEach((b) => {
          const sire = b.maleAnimal
            ? `${b.maleAnimal.animalNumber} (${b.maleAnimal.breed})`
            : 'AI Straw Semen Batch';
          milestones.push({
            rawDate: b.breedingDate,
            dateTime: b.breedingDate.toISOString().slice(0, 10),
            milestoneCategory: 'BREEDING',
            milestoneTitle: `Service: ${b.breedingMethod.replace(/_/g, ' ')}`,
            milestoneDetails: `Sire: ${sire} • Method: ${b.breedingMethod}${b.notes ? ` • ${b.notes}` : ''}`,
            farmLocation: animal.farm?.name || '',
            recordedBy: b.technician
              ? `${b.technician.firstName} ${b.technician.lastName}`
              : 'AI Technician',
            status: b.status || 'COMPLETED',
          });
        });

        // 5. Pregnancies & Gestations
        animal.pregnancies.forEach((p) => {
          milestones.push({
            rawDate: p.pregnancyDate,
            dateTime: p.pregnancyDate.toISOString().slice(0, 10),
            milestoneCategory: 'PREGNANCY',
            milestoneTitle: `Gestation: ${p.status}`,
            milestoneDetails: `Expected Calving: ${p.expectedCalvingDate.toISOString().slice(0, 10)}${p.notes ? ` • ${p.notes}` : ''}`,
            farmLocation: animal.farm?.name || '',
            recordedBy: 'Veterinary Specialist',
            status: p.status,
          });
        });

        // 6. Calving Records
        animal.calvingRecords.forEach((c) => {
          milestones.push({
            rawDate: c.calvingDate,
            dateTime: c.calvingDate.toISOString().slice(0, 10),
            milestoneCategory: 'CALVING',
            milestoneTitle: `Calving Event: ${c.calvingType}`,
            milestoneDetails: `Calf Count: ${c.calfCount}${c.complications ? ` • Complications: ${c.complications}` : ' • Normal delivery'}${c.notes ? ` • ${c.notes}` : ''}`,
            farmLocation: animal.farm?.name || '',
            recordedBy: 'Attending Specialist',
            status: 'COMPLETED',
          });
        });

        // 5. Farm Transfers
        animal.farmTransfers.forEach((t) => {
          const transport = [
            t.vehicleNumber ? `Veh: ${t.vehicleNumber}` : null,
            t.driverName ? `Driver: ${t.driverName}` : null,
          ]
            .filter(Boolean)
            .join(' • ');

          milestones.push({
            rawDate: t.departureDate,
            dateTime:
              `${t.departureDate.toISOString().slice(0, 10)} ${t.departureTime || ''}`.trim(),
            milestoneCategory: 'MOVEMENT',
            milestoneTitle: `Transfer: ${t.reason.replace(/_/g, ' ')}`,
            milestoneDetails: `Dispatched from ${t.fromFarm.name} to ${t.toFarm.name}. ${transport}`,
            farmLocation: `${t.fromFarm.name} -> ${t.toFarm.name}`,
            recordedBy: t.recordedBy
              ? `${t.recordedBy.firstName} ${t.recordedBy.lastName}`
              : 'Transit Officer',
            status: t.status,
          });
        });

        // Sort descending by rawDate
        milestones.sort((a, b) => b.rawDate.getTime() - a.rawDate.getTime());

        sampleRows = milestones.map((m) => ({
          dateTime: m.dateTime,
          milestoneCategory: m.milestoneCategory,
          milestoneTitle: m.milestoneTitle,
          milestoneDetails: m.milestoneDetails,
          farmLocation: m.farmLocation,
          recordedBy: m.recordedBy,
          status: m.status,
        }));

        chartSummary = [
          {
            title: 'Lifetime Milestone Events',
            dataPointsCount: sampleRows.length,
          },
          {
            title: 'Milking Records Logged',
            dataPointsCount: animal.milkProduction.length,
          },
        ];
      } else {
        summaryItems = [
          this.helpers.createSummaryItem({
            id: 'lifetime-milk',
            label: 'Lifetime Milk Output',
            value: 0,
            unit: 'L',
            description: 'No matching animal record found in authorized scope',
            iconName: 'Milk',
          }),
        ];
        sampleRows = [];
        chartSummary = [{ title: 'Milestone Events', dataPointsCount: 0 }];
      }
    } else {
      title = 'Executive Operational & Herd Inventory Overview';
      const data = await this.analytics.getOverviewAnalytics(filterDto, userId);
      summaryItems = data.summary;
      sampleRows = data.tableData?.data || [];
      chartSummary = [
        {
          title: 'Animal Status Distribution',
          dataPointsCount: data.animalStatusDistribution.length,
        },
        {
          title: 'Milk Trend',
          dataPointsCount: data.milkProductionTrend.length,
        },
      ];
    }

    return {
      title,
      systemName: 'AITS National Livestock System',
      farmName:
        dto.farmId && dto.farmId !== 'ALL'
          ? 'Target Facility'
          : 'All Accredited Facilities',
      dateRange: `${dto.startDate || 'Last 30 Days'} to ${dto.endDate || 'Today'}`,
      generatedAt: new Date().toLocaleString(),
      generatedBy: user
        ? `${user.firstName} ${user.lastName}`
        : 'Authorized Officer',
      referenceNumber: `AITS-${dto.reportType}-${Date.now().toString().slice(-6)}`,
      appliedFilters: {
        Scope: dto.farmId || 'ALL',
        Format: dto.fileFormat || 'PDF',
      },
      summaryItems,
      chartSummary,
      recordsCount: sampleRows.length,
      sampleRows,
    };
  }

  async exportReportData(
    dto: ReportDownloadRequestDto,
    userId?: string,
  ): Promise<{ filename: string; content: string }> {
    const preview = await this.generateReportPreview(dto, userId);

    const csvRows: string[][] = [
      ['AITS NATIONAL LIVESTOCK DATABASE EXPORT'],
      [`Report: ${preview.title}`],
      [`Reference: ${preview.referenceNumber}`],
      [`Date Range: ${preview.dateRange}`],
      [`Generated: ${preview.generatedAt} by ${preview.generatedBy}`],
      [],
      ['KPI SUMMARY METRICS'],
      ['Metric', 'Value', 'Unit', 'Description'],
      ...preview.summaryItems.map((item) => [
        item.label,
        String(item.value),
        item.unit || '',
        item.description,
      ]),
      [],
    ];

    if (preview.sampleRows && preview.sampleRows.length > 0) {
      const keys = Object.keys(preview.sampleRows[0]).filter((k) => k !== 'id');
      const headerMap: Record<string, string> = {
        animalTag: 'Animal Tag',
        animalName: 'Animal Name',
        species: 'Species',
        breed: 'Breed',
        gender: 'Gender',
        status: 'Status',
        farmName: 'Farm Location',
        registeredDate: 'Registration Date',
        date: 'Date',
        morningYield: 'Morning Yield (L)',
        eveningYield: 'Evening Yield (L)',
        totalYield: 'Total Yield (L)',
        qualityStatus: 'Quality Status',
        recordedBy: 'Recorded By',
        caseDate: 'Case Date',
        diagnosis: 'Diagnosis / Condition',
        severity: 'Severity',
        treatmentStatus: 'Treatment Status',
        treatment: 'Treatment / Medication',
        treatmentStartDate: 'Treatment Start Date',
        treatmentEndDate: 'Treatment End Date',
        veterinarian: 'Attending Veterinarian',
        clinicalRemarks: 'Clinical Remarks / Notes',
        feedingSession: 'Feeding Session',
        feedCategory: 'Feed Category',
        feedType: 'Feed Type',
        actualQuantity: 'Actual Quantity (kg)',
        unit: 'Unit',
        milkYield: 'Milk Yield (L)',
        feedEfficiency: 'Feed Efficiency Ratio (L/kg)',
        remarks: 'Remarks',
        serviceDate: 'Service Date',
        breedingMethod: 'Breeding Method',
        technician: 'Technician',
        sireInfo: 'Sire / Semen Batch',
        pregnancyStatus: 'Pregnancy Status',
        expectedCalvingDate: 'Expected Calving Date',
        calvingOutcome: 'Calving Outcome',
        calvingStatus: 'Calving Status',
        departureDateTime: 'Departure Date & Time',
        arrivalDateTime: 'Arrival Date & Time',
        originFarm: 'Origin Farm',
        destinationFarm: 'Destination Farm',
        movementReason: 'Movement Reason',
        transportInfo: 'Transport & Vehicle Info',
        movementStatus: 'Movement Status',
        authorizedBy: 'Authorized By',
        dateTime: 'Date & Time',
        milestoneCategory: 'Milestone Category',
        milestoneTitle: 'Milestone Title',
        milestoneDetails: 'Milestone Details',
        farmLocation: 'Facility Location',
        notes: 'Notes',
      };
      const formattedHeaders = keys.map(
        (k) => headerMap[k] || k.replace(/([A-Z])/g, ' $1').trim(),
      );
      csvRows.push(['DETAILED RECORDS']);
      csvRows.push(formattedHeaders);
      preview.sampleRows.forEach((row) => {
        csvRows.push(
          keys.map((k) => {
            const val = row[k];
            if (val === null || val === undefined) return '';
            if (typeof val === 'string') return val;
            if (
              typeof val === 'number' ||
              typeof val === 'boolean' ||
              typeof val === 'bigint'
            ) {
              return String(val);
            }
            if (val instanceof Date) return val.toISOString();
            if (typeof val === 'object') return JSON.stringify(val);
            return '';
          }),
        );
      });
    }

    const csvContent = csvRows
      .map((row) =>
        row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(','),
      )
      .join('\n');

    return {
      filename: `AITS_${dto.reportType}_${new Date().toISOString().slice(0, 10)}.csv`,
      content: csvContent,
    };
  }
}
