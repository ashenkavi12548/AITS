/**
 * CSV Export Utility - Plain Data Export
 * Preserves plain data structure without visual styling or logos.
 */

function escapeCsvCell(value: unknown): string {
  if (value === null || value === undefined) return '""';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return `"${str}"`;
}

/**
 * Formats header keys to clean, human-readable column titles with units where applicable.
 */
function formatCsvHeader(key: string): string {
  const headerMap: Record<string, string> = {
    animalTag: 'Animal Tag ID',
    animalName: 'Animal Name',
    farmName: 'Farm Name',
    morningYield: 'Morning Yield (L)',
    eveningYield: 'Evening Yield (L)',
    totalYield: 'Total Yield (L)',
    qualityStatus: 'Quality Grade',
    recordedBy: 'Recorded By',
    caseDate: 'Case Date',
    diagnosis: 'Diagnosis / Condition',
    severity: 'Severity Level',
    treatmentStatus: 'Treatment Status',
    veterinarian: 'Attending Vet',
    outcome: 'Outcome / Notes',
    feedingSession: 'Feeding Session',
    feedType: 'Feed Type',
    quantity: 'Quantity',
    unit: 'Unit',
    serviceDate: 'Service Date',
    breedingMethod: 'Breeding Method',
    technician: 'Technician / Inseminator',
    pregnancyStatus: 'Pregnancy Status',
    expectedCalvingDate: 'Expected Calving Date',
    calvingStatus: 'Calving Status',
    dateTime: 'Date & Time',
    eventType: 'Event Type',
    eventDescription: 'Event Description',
    movementStatus: 'Movement Status',
  };

  if (headerMap[key]) return headerMap[key];

  // Capitalize camelCase keys fallback
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (str) => str.toUpperCase())
    .trim();
}

export function exportToCsv(
  filename: string,
  headers: string[],
  rows: Array<Record<string, unknown>>,
): void {
  const csvLines: string[] = [];

  // UTF-8 Byte Order Mark for Excel compatibility
  const BOM = '\uFEFF';

  // Human-readable header row
  const formattedHeaders = headers.map((h) => formatCsvHeader(h));
  csvLines.push(formattedHeaders.map(escapeCsvCell).join(','));

  // Data rows
  rows.forEach((row) => {
    const line = headers.map((key) => escapeCsvCell(row[key] ?? ''));
    csvLines.push(line.join(','));
  });

  const csvContent = BOM + csvLines.join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename.endsWith('.csv') ? filename : `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
