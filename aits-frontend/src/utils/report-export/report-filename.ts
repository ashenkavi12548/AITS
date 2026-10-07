import { ReportType } from '@/types/report.types';

/**
 * Creates safe, descriptive, standardized filenames for report downloads.
 */
export function generateReportFilename(
  reportType: ReportType,
  extension: 'pdf' | 'csv' | 'print',
  options?: {
    startDate?: string;
    endDate?: string;
    animalId?: string;
    farmName?: string;
  },
): string {
  const typeTitles: Record<ReportType, string> = {
    OVERVIEW: 'Executive_Overview',
    PRODUCTION: 'Milk_Production',
    HEALTH: 'Animal_Health',
    FEEDING: 'Feed_Consumption',
    BREEDING: 'Breeding_Performance',
    TRACEABILITY: 'Farm_Movements',
    ANIMAL_LIFETIME: 'Animal_Lifetime',
  };

  const titlePart = typeTitles[reportType] || 'Report';

  let tagPart = '';
  if (options?.animalId) {
    const cleanTag = options.animalId.replace(/[^a-zA-Z0-9-]/g, '_');
    tagPart = `_${cleanTag}`;
  }

  let periodPart = '';
  if (options?.startDate && options?.endDate) {
    periodPart = `_${options.startDate}_to_${options.endDate}`;
  } else if (options?.startDate) {
    periodPart = `_${options.startDate}`;
  } else {
    periodPart = `_${new Date().toISOString().slice(0, 10)}`;
  }

  const ext = extension === 'print' ? 'pdf' : extension;
  const rawFilename = `AITS_${titlePart}${tagPart}${periodPart}.${ext}`;

  // Sanitize characters
  return rawFilename.replace(/[\/\?%*:|"<>]/g, '_');
}
