import { jsPDF } from 'jspdf';
import { ReportDownloadRequest, ReportPreviewData, ReportType } from '@/types/report.types';
import { generateReportReferenceNumber } from './report-reference';
import { generateReportFilename } from './report-filename';
import { drawPdfReportHeader } from './pdf-header';
import { drawPdfReportMetadata } from './pdf-metadata';
import { drawPdfReportSummary } from './pdf-summary';
import { drawPdfReportCharts } from './pdf-chart';
import { drawPdfReportTable, ColumnDef } from './pdf-table';
import { drawPdfReportFooter } from './pdf-footer';

/**
 * Main Template Generator for Downloadable AITS Operational PDF Reports.
 * Reusable single template engine handling all 7 report categories.
 */
export async function generateUnifiedPdfReport(
  request: ReportDownloadRequest,
  previewData: ReportPreviewData,
): Promise<jsPDF> {
  const isLandscape =
    request.pageOrientation === 'LANDSCAPE' ||
    (request.pageOrientation === 'AUTOMATIC' && request.reportType === 'PRODUCTION');

  const doc = new jsPDF({
    orientation: isLandscape ? 'landscape' : 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const refNumber = generateReportReferenceNumber(request.reportType, request.animalId);
  const generatedDate = previewData.generatedAt.includes(',')
    ? previewData.generatedAt.split(',').slice(0, 2).join(',')
    : previewData.generatedAt || new Date().toISOString().slice(0, 10);

  // 1. Draw Report Header
  let y = await drawPdfReportHeader({
    doc,
    title: previewData.title,
    subtitle: getReportSubtitle(request.reportType),
    referenceNumber: refNumber,
    generatedAt: previewData.generatedAt,
  });

  // 2. Draw Report Metadata & Applied Filters
  y = drawPdfReportMetadata({
    doc,
    category: getCategoryName(request.reportType),
    referenceNumber: refNumber,
    generatedBy: previewData.generatedBy || 'Authorized Officer',
    generatedDate,
    farmName: previewData.farmName,
    animalName: previewData.animalName,
    dateRange: previewData.dateRange,
    recordsCount: previewData.recordsCount,
    appliedFilters: previewData.appliedFilters,
    startY: y,
  });

  // 3. Draw Summary KPI Section (if enabled)
  if (request.includeSummaryCards && previewData.summaryItems && previewData.summaryItems.length > 0) {
    y = drawPdfReportSummary({
      doc,
      summaryItems: previewData.summaryItems,
      startY: y,
    });
  }

  // 4. Draw Analytical Charts (if enabled)
  if (request.includeCharts && previewData.chartSummary && previewData.chartSummary.length > 0) {
    y = drawPdfReportCharts({
      doc,
      charts: previewData.chartSummary,
      startY: y,
    });
  }

  // 5. Draw Detailed Data Table (if enabled)
  if (request.includeDetailedTable && previewData.sampleRows && previewData.sampleRows.length > 0) {
    const { columns, totalKeys, showTotals } = getTableConfig(request.reportType);
    const count = previewData.recordsCount ?? previewData.sampleRows.length;

    drawPdfReportTable({
      doc,
      title: `DETAILED AUDIT RECORDS (${count} Total)`,
      columns,
      rows: previewData.sampleRows,
      startY: y,
      showTotals,
      totalKeys,
    });
  }

  // 6. Draw Footer Across All Pages
  drawPdfReportFooter({
    doc,
    referenceNumber: refNumber,
    generatedDate,
    isConfidential: request.includeConfidentialLabel ?? true,
  });

  return doc;
}

/**
 * Generates and triggers browser download of the PDF document.
 */
export async function downloadUnifiedPdfReport(
  request: ReportDownloadRequest,
  previewData: ReportPreviewData,
): Promise<void> {
  const doc = await generateUnifiedPdfReport(request, previewData);
  const filename = generateReportFilename(request.reportType, 'pdf', {
    startDate: request.startDate,
    endDate: request.endDate,
    animalId: request.animalId,
    farmName: previewData.farmName,
  });
  doc.save(filename);
}

// ----------------------------------------------------
// Helper Functions for Report Type Configurations
// ----------------------------------------------------

function getCategoryName(type: ReportType): string {
  const map: Record<ReportType, string> = {
    OVERVIEW: 'Executive Overview',
    PRODUCTION: 'Milk Production & Quality',
    HEALTH: 'Animal Health & Biosecurity',
    FEEDING: 'Feed Intake & Nutrition',
    BREEDING: 'Reproduction & Gestation',
    TRACEABILITY: 'Audit & Movement Traceability',
    ANIMAL_LIFETIME: 'Individual Animal Pedigree',
  };
  return map[type] || 'Operational Analytics';
}

function getReportSubtitle(type: ReportType): string {
  const map: Record<ReportType, string> = {
    OVERVIEW: 'Comprehensive Summary & Key Performance Indicators across All Livestock Operations',
    PRODUCTION: 'Lactation Performance, Morning/Evening Yield Breakdown & Milk Quality Audit',
    HEALTH: 'Clinical Diagnosis, Veterinary Interventions, Treatments & Vaccination Compliance',
    FEEDING: 'Ration Disbursements, Feed Type Allocation & Consumption Tracking',
    BREEDING: 'Artificial Insemination, Pregnancy Verification & Expected Calving Schedules',
    TRACEABILITY: 'Chronological Event Audit Trail, Inter-Farm Stock Transfers & Movement Permits',
    ANIMAL_LIFETIME: 'Complete Lifetime Lineage, Health History, Lactation Curve & Custody Log',
  };
  return map[type] || 'Official AITS Operational Intelligence Document';
}

function getTableConfig(type: ReportType): {
  columns: ColumnDef[];
  showTotals: boolean;
  totalKeys: string[];
} {
  switch (type) {
    case 'OVERVIEW':
      return {
        columns: [
          { key: 'animalTag', header: 'Tag ID', align: 'center', widthRatio: 1.2 },
          { key: 'animalName', header: 'Animal Name', align: 'left', widthRatio: 1.3 },
          { key: 'species', header: 'Species', align: 'center', widthRatio: 1 },
          { key: 'breed', header: 'Breed', align: 'left', widthRatio: 1.3 },
          { key: 'gender', header: 'Gender', align: 'center', widthRatio: 0.9 },
          { key: 'status', header: 'Herd Status', align: 'center', widthRatio: 1.1 },
          { key: 'farmName', header: 'Farm Location', align: 'left', widthRatio: 1.6 },
          { key: 'registeredDate', header: 'Registered Date', align: 'center', widthRatio: 1.2 },
        ],
        showTotals: false,
        totalKeys: [],
      };

    case 'PRODUCTION':
      return {
        columns: [
          { key: 'date', header: 'Date', align: 'center', widthRatio: 1 },
          { key: 'animalTag', header: 'Tag ID', align: 'center', widthRatio: 1.2 },
          { key: 'animalName', header: 'Animal Name', align: 'left', widthRatio: 1.1 },
          { key: 'farmName', header: 'Farm Scope', align: 'left', widthRatio: 1.6 },
          { key: 'morningYield', header: 'Morning (L)', align: 'right', widthRatio: 1 },
          { key: 'eveningYield', header: 'Evening (L)', align: 'right', widthRatio: 1 },
          { key: 'totalYield', header: 'Total (L)', align: 'right', widthRatio: 1 },
          { key: 'qualityStatus', header: 'Quality', align: 'center', widthRatio: 1 },
          { key: 'recordedBy', header: 'Recorder', align: 'left', widthRatio: 1.3 },
        ],
        showTotals: true,
        totalKeys: ['morningYield', 'eveningYield', 'totalYield'],
      };

    case 'HEALTH':
      return {
        columns: [
          { key: 'caseDate', header: 'Case Date', align: 'center', widthRatio: 1 },
          { key: 'animalTag', header: 'Tag ID', align: 'center', widthRatio: 1.1 },
          { key: 'animalName', header: 'Animal', align: 'left', widthRatio: 1.1 },
          { key: 'farmName', header: 'Facility', align: 'left', widthRatio: 1.3 },
          { key: 'diagnosis', header: 'Diagnosis / Condition', align: 'left', widthRatio: 1.6 },
          { key: 'severity', header: 'Severity', align: 'center', widthRatio: 0.8 },
          { key: 'treatmentStatus', header: 'Status', align: 'center', widthRatio: 1 },
          { key: 'treatment', header: 'Treatment / Protocol', align: 'left', widthRatio: 1.4 },
          { key: 'veterinarian', header: 'Attending Vet', align: 'left', widthRatio: 1.3 },
        ],
        showTotals: false,
        totalKeys: [],
      };

    case 'FEEDING':
      return {
        columns: [
          { key: 'date', header: 'Date', align: 'center', widthRatio: 1 },
          { key: 'animalTag', header: 'Tag ID', align: 'center', widthRatio: 1.1 },
          { key: 'animalName', header: 'Animal', align: 'left', widthRatio: 1.1 },
          { key: 'farmName', header: 'Facility', align: 'left', widthRatio: 1.3 },
          { key: 'feedingSession', header: 'Shift', align: 'center', widthRatio: 0.9 },
          { key: 'feedCategory', header: 'Category', align: 'left', widthRatio: 1.1 },
          { key: 'feedType', header: 'Feed Formula', align: 'left', widthRatio: 1.4 },
          { key: 'actualQuantity', header: 'Actual (kg)', align: 'right', widthRatio: 0.9 },
          { key: 'milkYield', header: 'Milk (L)', align: 'right', widthRatio: 0.8 },
          { key: 'feedEfficiency', header: 'L/kg Feed', align: 'right', widthRatio: 0.9 },
          { key: 'status', header: 'Status', align: 'center', widthRatio: 0.9 },
        ],
        showTotals: true,
        totalKeys: ['actualQuantity', 'milkYield'],
      };

    case 'BREEDING':
      return {
        columns: [
          { key: 'serviceDate', header: 'Service Date', align: 'center', widthRatio: 1 },
          { key: 'animalTag', header: 'Tag ID', align: 'center', widthRatio: 1.1 },
          { key: 'animalName', header: 'Animal', align: 'left', widthRatio: 1.1 },
          { key: 'farmName', header: 'Facility', align: 'left', widthRatio: 1.3 },
          { key: 'breedingMethod', header: 'Method', align: 'center', widthRatio: 1.2 },
          { key: 'sireInfo', header: 'Sire / Straw', align: 'left', widthRatio: 1.3 },
          { key: 'technician', header: 'Technician', align: 'left', widthRatio: 1.2 },
          { key: 'pregnancyStatus', header: 'Pregnancy', align: 'center', widthRatio: 1 },
          { key: 'expectedCalvingDate', header: 'Due Date', align: 'center', widthRatio: 1 },
        ],
        showTotals: false,
        totalKeys: [],
      };

    case 'TRACEABILITY':
      return {
        columns: [
          { key: 'dateTime', header: 'Dispatched', align: 'center', widthRatio: 1.1 },
          { key: 'animalTag', header: 'Tag ID', align: 'center', widthRatio: 1.1 },
          { key: 'animalName', header: 'Animal', align: 'left', widthRatio: 1.1 },
          { key: 'originFarm', header: 'Origin Facility', align: 'left', widthRatio: 1.3 },
          { key: 'destinationFarm', header: 'Destination', align: 'left', widthRatio: 1.3 },
          { key: 'movementReason', header: 'Reason', align: 'left', widthRatio: 1.1 },
          { key: 'transportInfo', header: 'Transport & Hauler', align: 'left', widthRatio: 1.4 },
          { key: 'movementStatus', header: 'Status', align: 'center', widthRatio: 0.9 },
          { key: 'authorizedBy', header: 'Officer', align: 'left', widthRatio: 1.1 },
        ],
        showTotals: false,
        totalKeys: [],
      };

    case 'ANIMAL_LIFETIME':
      return {
        columns: [
          { key: 'dateTime', header: 'Date', align: 'center', widthRatio: 1 },
          { key: 'milestoneCategory', header: 'Lifecycle Phase', align: 'center', widthRatio: 1.3 },
          { key: 'milestoneTitle', header: 'Milestone / Event', align: 'left', widthRatio: 1.6 },
          { key: 'milestoneDetails', header: 'Details & Operational / Medical Notes', align: 'left', widthRatio: 2.6 },
          { key: 'farmLocation', header: 'Facility Location', align: 'left', widthRatio: 1.3 },
          { key: 'recordedBy', header: 'Verified By', align: 'left', widthRatio: 1.2 },
          { key: 'status', header: 'Status', align: 'center', widthRatio: 0.9 },
        ],
        showTotals: false,
        totalKeys: [],
      };

    default:
      return {
        columns: [
          { key: 'dateTime', header: 'Date & Time', align: 'center', widthRatio: 1.2 },
          { key: 'animalTag', header: 'Tag ID', align: 'center', widthRatio: 1.2 },
          { key: 'animalName', header: 'Animal', align: 'left', widthRatio: 1.1 },
          { key: 'farmName', header: 'Farm Location', align: 'left', widthRatio: 1.5 },
          { key: 'eventType', header: 'Event Category', align: 'center', widthRatio: 1.1 },
          { key: 'eventDescription', header: 'Event Audit Log Details', align: 'left', widthRatio: 2.2 },
          { key: 'recordedBy', header: 'Authorized By', align: 'left', widthRatio: 1.2 },
        ],
        showTotals: false,
        totalKeys: [],
      };
  }
}
