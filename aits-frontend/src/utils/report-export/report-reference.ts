import { ReportType } from '@/types/report.types';

/**
 * Generates readable operational report reference numbers.
 * Example formats:
 * - RPT-PROD-202609-001
 * - RPT-HLTH-202609-001
 * - RPT-FEED-202609-001
 * - RPT-BRD-202609-001
 * - RPT-TRC-202609-001
 * - RPT-LIFE-LK-9041
 */
export function generateReportReferenceNumber(
  reportType: ReportType,
  animalId?: string,
  seq = '001',
): string {
  const dateStr = new Date().toISOString().slice(0, 7).replace('-', '');

  if (reportType === 'ANIMAL_LIFETIME' && animalId) {
    const cleanTag = animalId.replace(/^AITS-/, '');
    return `RPT-LIFE-${cleanTag}`;
  }

  const prefixMap: Record<ReportType, string> = {
    OVERVIEW: 'RPT-OVER',
    PRODUCTION: 'RPT-PROD',
    HEALTH: 'RPT-HLTH',
    FEEDING: 'RPT-FEED',
    BREEDING: 'RPT-BRD',
    TRACEABILITY: 'RPT-TRC',
    ANIMAL_LIFETIME: 'RPT-LIFE',
  };

  const prefix = prefixMap[reportType] || 'RPT-GEN';
  return `${prefix}-${dateStr}-${seq}`;
}
