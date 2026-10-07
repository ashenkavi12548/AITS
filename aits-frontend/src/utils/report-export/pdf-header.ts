import { jsPDF } from 'jspdf';
import { PDF_COLORS, PDF_FONTS } from '@/constants/report-style.constants';
import { getOfficialAitsLogo } from './pdf-image-helper';

interface HeaderOptions {
  doc: jsPDF;
  title: string;
  subtitle?: string;
  referenceNumber: string;
  generatedAt: string;
  startY?: number;
}

/**
 * Draws the official AITS Report Header section on the first page of the PDF.
 * Returns the Y position after the horizontal separator line.
 */
export async function drawPdfReportHeader(options: HeaderOptions): Promise<number> {
  const { doc, title, subtitle, referenceNumber, generatedAt, startY = 12 } = options;
  const pageWidth = doc.internal.pageSize.getWidth();
  const marginX = 14;
  let currentY = startY;

  // Top Accent Bar
  doc.setFillColor(...PDF_COLORS.primaryRgb);
  doc.rect(0, 0, pageWidth, 4, 'F');

  currentY = 12;

  // Try loading logo
  const logoInfo = await getOfficialAitsLogo();

  if (logoInfo) {
    // Draw Logo maintaining aspect ratio
    const logoHeight = 11;
    const logoWidth = Math.min(logoHeight * logoInfo.aspectRatio, 40);
    try {
      doc.addImage(logoInfo.dataUrl, 'PNG', marginX, currentY, logoWidth, logoHeight);
    } catch {
      // Fallback text if jsPDF addImage throws
      doc.setTextColor(...PDF_COLORS.primaryRgb);
      doc.setFont(PDF_FONTS.family, 'bold');
      doc.setFontSize(14);
      doc.text('AITS', marginX, currentY + 8);
    }
  } else {
    // Fallback System Name Text if logo image missing
    doc.setTextColor(...PDF_COLORS.primaryRgb);
    doc.setFont(PDF_FONTS.family, 'bold');
    doc.setFontSize(14);
    doc.text('AITS REGISTRY', marginX, currentY + 8);
  }

  // System Subtitle under Logo
  doc.setFont(PDF_FONTS.family, 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...PDF_COLORS.textDarkRgb);
  doc.text('ANIMAL IDENTIFICATION & TRACEABILITY SYSTEM', marginX, currentY + 16);

  // Right Header Info (Ref Number & Date)
  const rightX = pageWidth - marginX;
  doc.setFont(PDF_FONTS.family, 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...PDF_COLORS.textDarkRgb);
  doc.text(`Ref: ${referenceNumber}`, rightX, currentY + 5, { align: 'right' });

  doc.setFont(PDF_FONTS.family, 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...PDF_COLORS.textMutedRgb);
  doc.text(`Date: ${generatedAt}`, rightX, currentY + 10, { align: 'right' });

  // Main Report Title (Below Logo & Header Info)
  currentY += 24;
  doc.setFont(PDF_FONTS.family, 'bold');
  doc.setFontSize(PDF_FONTS.size.title);
  doc.setTextColor(...PDF_COLORS.primaryRgb);
  doc.text(title.toUpperCase(), marginX, currentY);

  if (subtitle) {
    currentY += 5;
    doc.setFont(PDF_FONTS.family, 'normal');
    doc.setFontSize(PDF_FONTS.size.subtitle);
    doc.setTextColor(...PDF_COLORS.textMutedRgb);
    doc.text(subtitle, marginX, currentY);
  }

  // Clean Horizontal Separator Line
  currentY += 6;
  doc.setDrawColor(...PDF_COLORS.borderRgb);
  doc.setLineWidth(0.4);
  doc.line(marginX, currentY, pageWidth - marginX, currentY);

  return currentY + 6;
}
