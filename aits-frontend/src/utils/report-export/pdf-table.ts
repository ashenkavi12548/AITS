import { jsPDF } from 'jspdf';
import { PDF_COLORS, PDF_FONTS } from '@/constants/report-style.constants';

export interface ColumnDef {
  key: string;
  header: string;
  align?: 'left' | 'center' | 'right';
  widthRatio?: number; // Relative ratio of column width
}

interface TableOptions {
  doc: jsPDF;
  title?: string;
  columns: ColumnDef[];
  rows: Record<string, unknown>[];
  startY: number;
  showTotals?: boolean;
  totalKeys?: string[];
  onPageAdded?: () => void;
}

/**
 * Custom High-Quality Multi-Page Vector Table Generator for jsPDF.
 * - Multi-page breaking with footer safety margin
 * - Repeating table header row on new pages
 * - Wrapped cell text calculation
 * - Right-aligned numeric columns & centered date/status columns
 * - Alternating row background shading
 * - Total summary row calculation
 */
export function drawPdfReportTable(options: TableOptions): number {
  const { doc, title, columns, rows, startY, showTotals = false, totalKeys = [] } = options;

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginX = 14;
  const contentWidth = pageWidth - marginX * 2;
  const footerMargin = 18;
  const maxY = pageHeight - footerMargin;
  let currentY = startY;

  // Check page overflow before rendering table header
  if (currentY + 25 > maxY) {
    doc.addPage();
    currentY = 20;
  }

  // Optional Section Title
  if (title) {
    doc.setFont(PDF_FONTS.family, 'bold');
    doc.setFontSize(PDF_FONTS.size.sectionHeader);
    doc.setTextColor(...PDF_COLORS.textDarkRgb);
    doc.text(title.toUpperCase(), marginX, currentY);
    currentY += 6;
  }

  // Handle empty table dataset
  if (!rows || rows.length === 0) {
    doc.setFillColor(...PDF_COLORS.cardBgRgb);
    doc.setDrawColor(...PDF_COLORS.borderRgb);
    doc.roundedRect(marginX, currentY, contentWidth, 14, 1.5, 1.5, 'FD');

    doc.setFont(PDF_FONTS.family, 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(...PDF_COLORS.textMutedRgb);
    doc.text('No detailed audit records found for the selected filter criteria.', marginX + 6, currentY + 8.5);

    return currentY + 20;
  }

  // Compute Column Widths based on ratios
  const totalRatios = columns.reduce((acc, col) => acc + (col.widthRatio || 1), 0);
  const colWidths = columns.map((col) => (contentWidth * (col.widthRatio || 1)) / totalRatios);

  // Function to draw Table Header
  const renderTableHeader = (yPos: number): number => {
    const headerHeight = 7;
    doc.setFillColor(...PDF_COLORS.tableHeaderBgRgb);
    doc.rect(marginX, yPos, contentWidth, headerHeight, 'F');

    doc.setFont(PDF_FONTS.family, 'bold');
    doc.setFontSize(PDF_FONTS.size.tableHeader);
    doc.setTextColor(...PDF_COLORS.tableHeaderTextColor);

    let curX = marginX;
    columns.forEach((col, idx) => {
      const w = colWidths[idx];
      const align = col.align || 'left';
      let textX = curX + 2;

      if (align === 'right') textX = curX + w - 2;
      else if (align === 'center') textX = curX + w / 2;

      doc.text(col.header.toUpperCase(), textX, yPos + 4.8, { align });
      curX += w;
    });

    return yPos + headerHeight;
  };

  currentY = renderTableHeader(currentY);

  // Render Rows
  doc.setFont(PDF_FONTS.family, 'normal');
  doc.setFontSize(PDF_FONTS.size.tableCell);

  rows.forEach((row, rowIdx) => {
    // Calculate cell heights for text wrapping
    let maxLines = 1;
    const cellTexts: string[][] = [];

    columns.forEach((col, colIdx) => {
      const rawVal =
        row[col.key] ??
        (col.key === 'animalTag'
          ? row.animalNumber ?? row.tagNumber ?? row.tag
          : col.key === 'farmName'
            ? row.farmLocation ?? row.facility ?? row.farm
            : undefined);
      const valStr = rawVal === null || rawVal === undefined ? '-' : String(rawVal);
      const w = colWidths[colIdx] - 4;
      const lines = doc.splitTextToSize(valStr, w);
      cellTexts.push(lines);
      if (lines.length > maxLines) maxLines = lines.length;
    });

    const rowHeight = Math.max(6, maxLines * 4 + 2);

    // Check page break safety
    if (currentY + rowHeight > maxY) {
      doc.addPage();
      currentY = 20;
      currentY = renderTableHeader(currentY);
    }

    // Row Background (Alternating shading)
    if (rowIdx % 2 === 1) {
      doc.setFillColor(...PDF_COLORS.rowAltBgRgb);
      doc.rect(marginX, currentY, contentWidth, rowHeight, 'F');
    }

    // Row Bottom Border Line
    doc.setDrawColor(...PDF_COLORS.borderRgb);
    doc.setLineWidth(0.15);
    doc.line(marginX, currentY + rowHeight, marginX + contentWidth, currentY + rowHeight);

    // Render Cell Texts
    doc.setTextColor(...PDF_COLORS.textDarkRgb);
    let curX = marginX;

    columns.forEach((col, colIdx) => {
      const w = colWidths[colIdx];
      const align = col.align || 'left';
      const lines = cellTexts[colIdx];
      let textX = curX + 2;

      if (align === 'right') textX = curX + w - 2;
      else if (align === 'center') textX = curX + w / 2;

      lines.forEach((line, lineIdx) => {
        doc.text(line, textX, currentY + 4 + lineIdx * 3.8, { align });
      });

      curX += w;
    });

    currentY += rowHeight;
  });

  // Render Optional Total Row
  if (showTotals && totalKeys.length > 0 && rows.length > 0) {
    const totalRowHeight = 7;

    if (currentY + totalRowHeight > maxY) {
      doc.addPage();
      currentY = 20;
      currentY = renderTableHeader(currentY);
    }

    doc.setFillColor(240, 240, 240);
    doc.rect(marginX, currentY, contentWidth, totalRowHeight, 'F');
    doc.setDrawColor(...PDF_COLORS.primaryRgb);
    doc.setLineWidth(0.4);
    doc.line(marginX, currentY, marginX + contentWidth, currentY);
    doc.line(marginX, currentY + totalRowHeight, marginX + contentWidth, currentY + totalRowHeight);

    doc.setFont(PDF_FONTS.family, 'bold');
    doc.setFontSize(PDF_FONTS.size.tableHeader);
    doc.setTextColor(...PDF_COLORS.textDarkRgb);

    let curX = marginX;
    columns.forEach((col, colIdx) => {
      const w = colWidths[colIdx];
      const align = col.align || 'left';
      let textX = curX + 2;

      if (align === 'right') textX = curX + w - 2;
      else if (align === 'center') textX = curX + w / 2;

      if (colIdx === 0) {
        doc.text('TOTAL SUMMARY', textX, currentY + 4.8, { align });
      } else if (totalKeys.includes(col.key)) {
        const sum = rows.reduce((acc, r) => {
          const v = parseFloat(String(r[col.key] || 0));
          return acc + (isNaN(v) ? 0 : v);
        }, 0);
        const formattedSum = new Intl.NumberFormat('en-US', {
          maximumFractionDigits: 2,
        }).format(sum);
        doc.text(formattedSum, textX, currentY + 4.8, { align });
      }

      curX += w;
    });

    currentY += totalRowHeight + 2;
  }

  return currentY + 6;
}
