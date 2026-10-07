import { jsPDF } from 'jspdf';
import { PDF_COLORS, PDF_FONTS } from '@/constants/report-style.constants';
import { ReportSummaryItem } from '@/types/report.types';

interface SummaryOptions {
  doc: jsPDF;
  summaryItems: ReportSummaryItem[];
  startY: number;
}

/**
 * Renders the compact executive summary KPI cards grid.
 * Returns the Y position after rendering all cards.
 */
export function drawPdfReportSummary(options: SummaryOptions): number {
  const { doc, summaryItems, startY } = options;
  if (!summaryItems || summaryItems.length === 0) return startY;

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginX = 14;
  const contentWidth = pageWidth - marginX * 2;
  const maxY = pageHeight - 18;
  let currentY = startY;

  // Safety page break check
  const totalSummaryHeight = Math.ceil(Math.min(summaryItems.length, 6) / 3) * 19 + 10;
  if (currentY + totalSummaryHeight > maxY) {
    doc.addPage();
    currentY = 20;
  }

  // Section Header
  doc.setFont(PDF_FONTS.family, 'bold');
  doc.setFontSize(PDF_FONTS.size.sectionHeader);
  doc.setTextColor(...PDF_COLORS.textDarkRgb);
  doc.text('EXECUTIVE METRICS SUMMARY', marginX, currentY);

  currentY += 5;

  // Render cards in a 3-column grid
  const itemsToRender = summaryItems.slice(0, 6);
  const gap = 4;
  const colCount = 3;
  const cardWidth = (contentWidth - gap * (colCount - 1)) / colCount;
  const cardHeight = 15;

  let cardX = marginX;
  let cardY = currentY;

  itemsToRender.forEach((item, idx) => {
    if (idx > 0 && idx % colCount === 0) {
      cardX = marginX;
      cardY += cardHeight + gap;
    }

    // Card background fill & border outline
    doc.setFillColor(...PDF_COLORS.cardBgRgb);
    doc.setDrawColor(...PDF_COLORS.borderRgb);
    doc.setLineWidth(0.3);
    doc.roundedRect(cardX, cardY, cardWidth, cardHeight, 1.5, 1.5, 'FD');

    // Accent left stripe
    doc.setFillColor(...PDF_COLORS.primaryRgb);
    doc.rect(cardX, cardY, 1.5, cardHeight, 'F');

    // Label Text
    doc.setFont(PDF_FONTS.family, 'bold');
    doc.setFontSize(7);
    doc.setTextColor(...PDF_COLORS.textMutedRgb);
    const labelStr = item.label.toUpperCase();
    const truncatedLabel = labelStr.length > 28 ? `${labelStr.slice(0, 26)}...` : labelStr;
    doc.text(truncatedLabel, cardX + 4, cardY + 4.5);

    // Value Text + Unit
    doc.setFont(PDF_FONTS.family, 'bold');
    doc.setFontSize(PDF_FONTS.size.cardValue);
    doc.setTextColor(...PDF_COLORS.primaryRgb);

    const formattedVal =
      typeof item.value === 'number'
        ? new Intl.NumberFormat('en-US').format(item.value)
        : String(item.value || '0');

    const valueStr = `${formattedVal} ${item.unit || ''}`.trim();
    const truncatedVal = valueStr.length > 22 ? `${valueStr.slice(0, 20)}...` : valueStr;
    doc.text(truncatedVal, cardX + 4, cardY + 11);

    cardX += cardWidth + gap;
  });

  currentY = cardY + cardHeight + 8;

  return currentY;
}
