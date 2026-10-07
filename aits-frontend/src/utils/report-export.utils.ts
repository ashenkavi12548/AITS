import { ReportDownloadRequest, ReportPreviewData } from '@/types/report.types';
import { downloadUnifiedPdfReport } from './report-export/pdf-generator';
import { exportToCsv as exportToCsvFile } from './report-export/csv-export';

export { exportToCsvFile as exportToCsv };

/**
 * Generates an executive PDF report using the unified AITS report template and triggers download.
 */
export async function generatePdfReport(
  request: ReportDownloadRequest,
  previewData: ReportPreviewData,
): Promise<void> {
  await downloadUnifiedPdfReport(request, previewData);
}
