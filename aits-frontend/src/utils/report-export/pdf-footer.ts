import { jsPDF } from 'jspdf';
import { PDF_COLORS, PDF_FONTS } from '@/constants/report-style.constants';

interface FooterOptions {
  doc: jsPDF;
  referenceNumber: string;
  generatedDate: string;
  isConfidential?: boolean;
}

/**
 * Draws repeating page footers across all pages of a jsPDF document.
 * Must be called as the final step after all content and pages have been added.
 */
export function drawPdfReportFooter(options: FooterOptions): void {
  const { doc, referenceNumber, generatedDate, isConfidential = true } = options;
  const pageCount = doc.getNumberOfPages();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginX = 14;
  const footerY = pageHeight - 10;
  const dividerY = pageHeight - 14;

  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);

    // Top Footer Divider Line
    doc.setDrawColor(...PDF_COLORS.borderRgb);
    doc.setLineWidth(0.3);
    doc.line(marginX, dividerY, pageWidth - marginX, dividerY);

    // Footer Text
    doc.setFont(PDF_FONTS.family, 'normal');
    doc.setFontSize(PDF_FONTS.size.footer);
    doc.setTextColor(...PDF_COLORS.textMutedRgb);

    const confText = isConfidential ? ' | CONFIDENTIAL' : '';
    const leftText = `AITS  |  ${referenceNumber}  |  Generated ${generatedDate}${confText}`;
    const rightText = `Page ${i} of ${pageCount}`;

    doc.text(leftText, marginX, footerY);
    doc.text(rightText, pageWidth - marginX, footerY, { align: 'right' });
  }
}
