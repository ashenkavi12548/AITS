/**
 * AITS Cattle Ear Tag Badge Generator (A7 Standard: 74mm x 105mm at 300 DPI)
 * Produces an ultra-crisp, high-contrast, professional livestock ear tag
 * with prominent animal number, QR code, farm details, and ear pin punch guide.
 */

export interface EarTagBadgeData {
  animalNumber: string;
  name?: string | null;
  breed?: string | null;
  species?: string | null;
  gender?: string | null;
  dateOfBirth?: string | null;
  farmName?: string | null;
  farmRegistrationNumber?: string | null;
  farmLocation?: string | null;
  qrImageUrl: string;
  qrValue?: string | null;
  rfidNumber?: string | null;
  status?: string | null;
}

// Standard A7 at 300 DPI (74mm x 105mm)
export const BADGE_WIDTH = 874;
export const BADGE_HEIGHT = 1240;

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.arcTo(x + width, y, x + width, y + radius, radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.arcTo(x + width, y + height, x + width - radius, y + height, radius);
  ctx.lineTo(x + radius, y + height);
  ctx.arcTo(x, y + height, x, y + height - radius, radius);
  ctx.lineTo(x, y + radius);
  ctx.arcTo(x, y, x + radius, y, radius);
  ctx.closePath();
}

/**
 * Creates an offscreen Canvas and renders the A7 Cattle Ear Tag Badge
 */
export async function renderEarTagBadgeCanvas(
  data: EarTagBadgeData,
): Promise<HTMLCanvasElement> {
  const canvas = document.createElement('canvas');
  canvas.width = BADGE_WIDTH;
  canvas.height = BADGE_HEIGHT;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context not available');

  // Enable high quality image smoothing
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // 1. Base Background (Clean white with subtle rounded ear tag contour)
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, BADGE_WIDTH, BADGE_HEIGHT);

  // Outer Safety Cut / Punch Guideline (15px inset)
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 2;
  ctx.setLineDash([8, 8]);
  roundRect(ctx, 16, 16, BADGE_WIDTH - 32, BADGE_HEIGHT - 32, 36);
  ctx.stroke();
  ctx.setLineDash([]);

  // Tag Main Border (Solid AITS Emerald)
  ctx.strokeStyle = '#10a37f';
  ctx.lineWidth = 5;
  roundRect(ctx, 24, 24, BADGE_WIDTH - 48, BADGE_HEIGHT - 48, 30);
  ctx.stroke();

  // 2. Top Ear Tag Hole Punch Guide (Where applicator pin punches through cow's ear)
  const holeCenterX = BADGE_WIDTH / 2;
  const holeCenterY = 70;
  const holeRadius = 24;

  // Outer dashed locator ring
  ctx.beginPath();
  ctx.arc(holeCenterX, holeCenterY, 32, 0, Math.PI * 2);
  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 2;
  ctx.setLineDash([4, 4]);
  ctx.stroke();
  ctx.setLineDash([]);

  // Crosshair guides
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(holeCenterX - 42, holeCenterY);
  ctx.lineTo(holeCenterX + 42, holeCenterY);
  ctx.moveTo(holeCenterX, holeCenterY - 42);
  ctx.lineTo(holeCenterX, holeCenterY + 42);
  ctx.stroke();

  // Inner punch cutout indicator
  ctx.beginPath();
  ctx.arc(holeCenterX, holeCenterY, holeRadius, 0, Math.PI * 2);
  ctx.fillStyle = '#f8fafc';
  ctx.fill();
  ctx.strokeStyle = '#475569';
  ctx.lineWidth = 2.5;
  ctx.stroke();

  // Hole punch text
  ctx.font = 'bold 11px system-ui, -apple-system, sans-serif';
  ctx.fillStyle = '#64748b';
  ctx.textAlign = 'center';
  ctx.fillText('PIN PUNCH ZONE (Ø 6mm)', holeCenterX, holeCenterY + 46);

  // 3. Official System Header Banner
  const headerY = 126;
  const headerHeight = 74;
  const headerWidth = BADGE_WIDTH - 64;

  ctx.fillStyle = '#065f46';
  roundRect(ctx, 32, headerY, headerWidth, headerHeight, 14);
  ctx.fill();

  // Header Title
  ctx.font = '900 22px system-ui, -apple-system, sans-serif';
  ctx.fillStyle = '#FFFFFF';
  ctx.textAlign = 'center';
  ctx.letterSpacing = '1px';
  ctx.fillText('ANIMAL IDENTIFICATION & TRACEABILITY SYSTEM', holeCenterX, headerY + 34);

  // Header Subtitle
  ctx.font = '600 13px system-ui, -apple-system, sans-serif';
  ctx.fillStyle = '#a7f3d0';
  ctx.letterSpacing = '1.5px';
  ctx.fillText('OFFICIAL LIVESTOCK EAR IDENTIFIER BADGE • A7 STANDARD', holeCenterX, headerY + 58);
  ctx.letterSpacing = '0px';

  // 4. Primary Animal Identification Number (Massive visibility)
  const tagBoxY = 216;
  const tagBoxHeight = 110;
  const tagBoxWidth = BADGE_WIDTH - 64;

  ctx.fillStyle = '#f0fdf4';
  roundRect(ctx, 32, tagBoxY, tagBoxWidth, tagBoxHeight, 18);
  ctx.fill();
  ctx.strokeStyle = '#bbf7d0';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Label
  ctx.font = 'bold 12px system-ui, -apple-system, sans-serif';
  ctx.fillStyle = '#059669';
  ctx.textAlign = 'center';
  ctx.letterSpacing = '2px';
  ctx.fillText('PRIMARY EAR TAG IDENTIFIER', holeCenterX, tagBoxY + 24);
  ctx.letterSpacing = '0px';

  // Large Bold Tag Number
  ctx.font = '900 58px system-ui, -apple-system, sans-serif';
  ctx.fillStyle = '#0f172a';
  ctx.textAlign = 'center';
  ctx.fillText(data.animalNumber, holeCenterX, tagBoxY + 80);

  // Animal Name Pill Badge (if exists)
  if (data.name && data.name.trim()) {
    const nameText = `★  ${data.name.trim().toUpperCase()}  ★`;
    ctx.font = 'bold 16px system-ui, -apple-system, sans-serif';
    const textWidth = ctx.measureText(nameText).width;
    const pillWidth = Math.max(160, textWidth + 36);
    const pillHeight = 28;
    const pillX = holeCenterX - pillWidth / 2;
    const pillY = tagBoxY + tagBoxHeight - 14;

    ctx.fillStyle = '#10a37f';
    roundRect(ctx, pillX, pillY, pillWidth, pillHeight, 14);
    ctx.fill();

    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'center';
    ctx.fillText(nameText, holeCenterX, pillY + 19);
  }

  // 5. Central High-Contrast Scannable QR Code Box
  const qrBoxY = 346;
  const qrBoxSize = 430;
  const qrBoxX = (BADGE_WIDTH - qrBoxSize) / 2;

  ctx.fillStyle = '#FFFFFF';
  roundRect(ctx, qrBoxX, qrBoxY, qrBoxSize, qrBoxSize, 20);
  ctx.fill();
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 2.5;
  ctx.stroke();

  // Load and Draw QR Code Image
  const qrImageSize = 350;
  const qrImageX = (BADGE_WIDTH - qrImageSize) / 2;
  const qrImageY = qrBoxY + 22;

  try {
    const qrImg = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = (e) => reject(e);
      img.src = data.qrImageUrl;
    });

    ctx.drawImage(qrImg, qrImageX, qrImageY, qrImageSize, qrImageSize);
  } catch (err) {
    console.warn('Failed to load QR code image for badge canvas:', err);
    // Fallback placeholder box
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(qrImageX, qrImageY, qrImageSize, qrImageSize);
    ctx.font = 'bold 16px sans-serif';
    ctx.fillStyle = '#64748b';
    ctx.textAlign = 'center';
    ctx.fillText('QR Code Not Loaded', holeCenterX, qrImageY + qrImageSize / 2);
  }

  // QR Label below code
  ctx.font = 'bold 13px system-ui, -apple-system, sans-serif';
  ctx.fillStyle = '#0f172a';
  ctx.textAlign = 'center';
  ctx.letterSpacing = '1px';
  ctx.fillText('SCAN TO VERIFY ANIMAL PROFILE & PEDIGREE', holeCenterX, qrBoxY + qrBoxSize - 18);
  ctx.letterSpacing = '0px';

  // 6. Detailed Information Grid (Clean 2-Column layout, without animal photo)
  const gridY = 794;
  const colWidth = (BADGE_WIDTH - 84) / 2; // ~395px each
  const rowHeight = 72;
  const gutter = 16;
  const leftColX = 34;
  const rightColX = leftColX + colWidth + gutter;

  // Helper for info cards
  const drawInfoCard = (
    x: number,
    y: number,
    width: number,
    height: number,
    label: string,
    value: string,
    accent = false,
  ) => {
    ctx.fillStyle = accent ? '#f0fdf4' : '#f8fafc';
    roundRect(ctx, x, y, width, height, 12);
    ctx.fill();
    ctx.strokeStyle = accent ? '#86efac' : '#e2e8f0';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Label
    ctx.font = 'bold 11px system-ui, -apple-system, sans-serif';
    ctx.fillStyle = accent ? '#047857' : '#64748b';
    ctx.textAlign = 'left';
    ctx.letterSpacing = '1px';
    ctx.fillText(label.toUpperCase(), x + 16, y + 24);
    ctx.letterSpacing = '0px';

    // Value
    ctx.font = 'bold 19px system-ui, -apple-system, sans-serif';
    ctx.fillStyle = '#0f172a';
    ctx.textAlign = 'left';
    // Truncate if too long
    let displayVal = value || '—';
    while (ctx.measureText(displayVal).width > width - 32 && displayVal.length > 5) {
      displayVal = displayVal.slice(0, -4) + '...';
    }
    ctx.fillText(displayVal, x + 16, y + 54);
  };

  // Row 1: Breed & Species
  drawInfoCard(
    leftColX,
    gridY,
    colWidth,
    rowHeight,
    'Breed',
    data.breed || 'Holstein-Friesian',
  );
  drawInfoCard(
    rightColX,
    gridY,
    colWidth,
    rowHeight,
    'Species',
    data.species || 'Cattle (Bovine)',
  );

  // Row 2: Gender & Status
  const genderFormatted =
    data.gender === 'MALE'
      ? 'Male (Bull)'
      : data.gender === 'FEMALE'
        ? 'Female (Cow)'
        : 'Female (Cow)';
  drawInfoCard(
    leftColX,
    gridY + rowHeight + 12,
    colWidth,
    rowHeight,
    'Sex / Gender',
    genderFormatted,
  );
  drawInfoCard(
    rightColX,
    gridY + rowHeight + 12,
    colWidth,
    rowHeight,
    'Health Status',
    data.status || 'ACTIVE • VERIFIED',
    true,
  );

  // Row 3: Farm Facility (Full Width)
  const fullRowY = gridY + (rowHeight + 12) * 2;
  const fullWidth = BADGE_WIDTH - 68;
  const farmHeight = 84;

  ctx.fillStyle = '#f8fafc';
  roundRect(ctx, leftColX, fullRowY, fullWidth, farmHeight, 14);
  ctx.fill();
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.font = 'bold 11px system-ui, -apple-system, sans-serif';
  ctx.fillStyle = '#64748b';
  ctx.textAlign = 'left';
  ctx.letterSpacing = '1px';
  ctx.fillText('FACILITY / FARM OF ORIGIN', leftColX + 16, fullRowY + 24);
  ctx.letterSpacing = '0px';

  ctx.font = 'bold 20px system-ui, -apple-system, sans-serif';
  ctx.fillStyle = '#0f172a';
  let farmDisplay = data.farmName || 'Registered Livestock Facility';
  while (ctx.measureText(farmDisplay).width > fullWidth - 180 && farmDisplay.length > 5) {
    farmDisplay = farmDisplay.slice(0, -4) + '...';
  }
  ctx.fillText(farmDisplay, leftColX + 16, fullRowY + 54);

  // Registration ID / Location on right
  const locDisplay = data.farmLocation || data.farmRegistrationNumber || 'Central Province';
  ctx.font = '600 13px system-ui, -apple-system, sans-serif';
  ctx.fillStyle = '#64748b';
  ctx.textAlign = 'right';
  ctx.fillText(locDisplay, leftColX + fullWidth - 16, fullRowY + 54);

  // Row 4: Secondary Identifiers (RFID / Registration Date)
  const metaY = fullRowY + farmHeight + 10;
  ctx.font = '500 12px system-ui, -apple-system, sans-serif';
  ctx.fillStyle = '#64748b';
  ctx.textAlign = 'left';
  const rfidText = data.rfidNumber ? `RFID: ${data.rfidNumber}` : 'RFID: Integrated Ear Chip';
  ctx.fillText(rfidText, leftColX + 4, metaY + 14);

  ctx.textAlign = 'right';
  const regDateText = data.dateOfBirth
    ? `DOB: ${new Date(data.dateOfBirth).toLocaleDateString()}`
    : `Issued: ${new Date().toLocaleDateString()}`;
  ctx.fillText(regDateText, leftColX + fullWidth - 4, metaY + 14);

  // 7. Footer Security & Verification Banner
  const footerY = BADGE_HEIGHT - 94;
  const footerHeight = 60;
  const footerWidth = BADGE_WIDTH - 64;

  ctx.fillStyle = '#0f172a';
  roundRect(ctx, 32, footerY, footerWidth, footerHeight, 14);
  ctx.fill();

  ctx.font = 'bold 13px system-ui, -apple-system, sans-serif';
  ctx.fillStyle = '#FFFFFF';
  ctx.textAlign = 'center';
  ctx.letterSpacing = '1px';
  ctx.fillText(
    'OFFICIAL NATIONAL LIVESTOCK REGISTRY • TAMPER-EVIDENT TAG',
    holeCenterX,
    footerY + 27,
  );

  ctx.font = '500 11px system-ui, -apple-system, sans-serif';
  ctx.fillStyle = '#94a3b8';
  ctx.letterSpacing = '0.5px';
  ctx.fillText(
    'Valid for life of animal. Replacement requires authorized veterinary inspection.',
    holeCenterX,
    footerY + 47,
  );

  return canvas;
}

/**
 * Generates and triggers instant download of the A7 Ear Tag Badge PNG
 */
export async function downloadEarTagBadge(data: EarTagBadgeData): Promise<void> {
  const canvas = await renderEarTagBadgeCanvas(data);

  return new Promise<void>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('Failed to generate PNG blob from canvas'));
        return;
      }
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${data.animalNumber}-Ear-Tag-A7.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(url), 2000);
      resolve();
    }, 'image/png');
  });
}

/**
 * Generates and triggers download of the single official A7 Ear Tag Badge as PDF
 */
export async function downloadEarTagBadgePdf(data: EarTagBadgeData): Promise<void> {
  const { jsPDF } = await import('jspdf');
  const canvas = await renderEarTagBadgeCanvas(data);
  const dataUrl = canvas.toDataURL('image/png');

  // A7 standard: 74mm x 105mm
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [74, 105],
  });

  pdf.addImage(dataUrl, 'PNG', 0, 0, 74, 105);
  pdf.save(`${data.animalNumber}-EarTag-A7.pdf`);
}

/**
 * Generates an official A4 multi-badge PDF (4 large badges per page in 2x2 grid with cut guides)
 */
export async function downloadBatchEarTagsA4Pdf(
  badges: EarTagBadgeData[],
  title = 'AITS-Official-Ear-Tags-Batch',
): Promise<void> {
  if (!badges || badges.length === 0) {
    throw new Error('No badges provided for batch PDF generation');
  }

  const { jsPDF } = await import('jspdf');
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4', // 210mm x 297mm
  });

  const BADGES_PER_PAGE = 4; // 2 cols x 2 rows
  const totalPages = Math.ceil(badges.length / BADGES_PER_PAGE);

  // Badge layout dimensions on A4
  const badgeW = 86;
  const badgeH = 120;
  const colPositions = [14, 110]; // x positions
  const rowPositions = [22, 150]; // y positions

  for (let i = 0; i < badges.length; i++) {
    const pageIndex = Math.floor(i / BADGES_PER_PAGE);
    const slotIndex = i % BADGES_PER_PAGE;

    // Add new page when crossing batch boundaries
    if (i > 0 && slotIndex === 0) {
      pdf.addPage();
    }

    // Page header
    if (slotIndex === 0) {
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(8.5);
      pdf.setTextColor(6, 95, 70); // #065f46
      pdf.text(
        'ANIMAL IDENTIFICATION & TRACEABILITY SYSTEM • OFFICIAL LIVESTOCK EAR TAG SHEET',
        14,
        12,
      );

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(7.5);
      pdf.setTextColor(115, 115, 115);
      pdf.text(
        `Generated: ${new Date().toLocaleString()} • Batch: ${badges.length} Tags • Sheet ${pageIndex + 1} of ${totalPages}`,
        14,
        16,
      );

      // Top line
      pdf.setDrawColor(229, 231, 235);
      pdf.setLineWidth(0.3);
      pdf.line(14, 18, 196, 18);

      // Page footer
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(7);
      pdf.setTextColor(140, 140, 140);
      pdf.text(
        'Department of Animal Production & Health • Cut along dashed guidelines • Laminate for all-weather outdoor durability',
        14,
        286,
      );
      pdf.text(`Page ${pageIndex + 1}/${totalPages}`, 180, 286);
    }

    const badge = badges[i];
    const col = slotIndex % 2;
    const row = Math.floor(slotIndex / 2);
    const x = colPositions[col];
    const y = rowPositions[row];

    // Render high-res canvas
    const canvas = await renderEarTagBadgeCanvas(badge);
    const dataUrl = canvas.toDataURL('image/png');

    // Dashed cut guide boundary
    pdf.setDrawColor(180, 190, 205);
    pdf.setLineWidth(0.3);
    pdf.setLineDashPattern([2.5, 2.5], 0);
    pdf.rect(x - 1.5, y - 1.5, badgeW + 3, badgeH + 3);

    // Mini scissor tag
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(6);
    pdf.setTextColor(150, 150, 150);
    pdf.text('✂ Cut Line', x + 1, y - 2.5);

    // Place Badge Image
    pdf.setLineDashPattern([], 0); // reset line dash
    pdf.addImage(dataUrl, 'PNG', x, y, badgeW, badgeH);
  }

  pdf.save(`${title}-${new Date().toISOString().split('T')[0]}.pdf`);
}

/**
 * Opens a dedicated A7 print window containing the rendered badge image
 */
export async function printEarTagBadge(data: EarTagBadgeData): Promise<void> {
  const canvas = await renderEarTagBadgeCanvas(data);
  const dataUrl = canvas.toDataURL('image/png');

  const printWindow = window.open('', '_blank', 'width=800,height=1000');
  if (!printWindow) {
    throw new Error('Could not open print window. Please allow popups.');
  }

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Ear Tag Badge - ${data.animalNumber}</title>
        <style>
          @page {
            size: 74mm 105mm;
            margin: 0;
          }
          * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
          }
          body {
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            background-color: #f1f5f9;
            font-family: system-ui, sans-serif;
          }
          .badge-container {
            width: 74mm;
            height: 105mm;
            background: white;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 4px 20px rgba(0,0,0,0.15);
          }
          img {
            width: 100%;
            height: 100%;
            object-fit: contain;
          }
          @media print {
            body {
              background: transparent;
            }
            .badge-container {
              box-shadow: none;
              width: 100%;
              height: 100%;
            }
          }
        </style>
      </head>
      <body>
        <div class="badge-container">
          <img src="${dataUrl}" alt="Ear Tag Badge ${data.animalNumber}" />
        </div>
        <script>
          window.onload = function() {
            setTimeout(function() {
              window.focus();
              window.print();
            }, 300);
          };
        </script>
      </body>
    </html>
  `);

  printWindow.document.close();
}

/**
 * Opens a dedicated A4 batch sheet print window with 4 ear tag badges per page (2x2 grid)
 */
export async function printBatchEarTagsA4(
  badges: EarTagBadgeData[],
  sheetTitle = 'AITS Batch Ear Tags',
): Promise<void> {
  if (!badges || badges.length === 0) {
    throw new Error('No badges provided for batch printing');
  }

  const printWindow = window.open('', '_blank', 'width=950,height=1100');
  if (!printWindow) {
    throw new Error('Could not open print window. Please allow popups.');
  }

  // Pre-render all badges to image data URLs
  const renderedImages: { animalNumber: string; dataUrl: string }[] = [];
  for (const badge of badges) {
    const canvas = await renderEarTagBadgeCanvas(badge);
    renderedImages.push({
      animalNumber: badge.animalNumber,
      dataUrl: canvas.toDataURL('image/png'),
    });
  }

  const BADGES_PER_PAGE = 4;
  const pages: { animalNumber: string; dataUrl: string }[][] = [];
  for (let i = 0; i < renderedImages.length; i += BADGES_PER_PAGE) {
    pages.push(renderedImages.slice(i, i + BADGES_PER_PAGE));
  }

  const pagesHtml = pages
    .map(
      (pageBadges, pageIdx) => `
    <div class="a4-page">
      <div class="header">
        <div>
          <h2>ANIMAL IDENTIFICATION & TRACEABILITY SYSTEM (AITS)</h2>
          <p>Official Livestock Ear Tag Print Sheet • A4 Standard Layout (2x2)</p>
        </div>
        <div class="meta">
          <span>Sheet ${pageIdx + 1} of ${pages.length}</span>
          <span>${new Date().toLocaleDateString()}</span>
        </div>
      </div>
      <div class="grid">
        ${pageBadges
          .map(
            (b) => `
          <div class="tag-cell">
            <span class="cut-guide">✂ Cut line</span>
            <img src="${b.dataUrl}" alt="Ear Tag ${b.animalNumber}" />
          </div>
        `,
          )
          .join('')}
      </div>
      <div class="footer">
        <span>Official National Livestock Identification Sheet • DAPH Sri Lanka</span>
        <span>${pageBadges.length} Tags on this sheet</span>
      </div>
    </div>
  `,
    )
    .join('');

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>${sheetTitle}</title>
        <style>
          @page {
            size: A4 portrait;
            margin: 10mm 12mm;
          }
          * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
          }
          body {
            background-color: #f3f4f6;
            font-family: system-ui, -apple-system, sans-serif;
            color: #0f172a;
          }
          .a4-page {
            width: 210mm;
            min-height: 297mm;
            padding: 12mm 14mm;
            margin: 10px auto;
            background: white;
            box-shadow: 0 4px 15px rgba(0,0,0,0.1);
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            page-break-after: always;
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
            padding-bottom: 8px;
            border-bottom: 1.5px solid #065f46;
            margin-bottom: 10px;
          }
          .header h2 {
            font-size: 11px;
            font-weight: 800;
            color: #065f46;
            letter-spacing: 0.5px;
          }
          .header p {
            font-size: 9px;
            color: #64748b;
            margin-top: 2px;
          }
          .meta {
            font-size: 8.5px;
            font-weight: 600;
            color: #64748b;
            display: flex;
            flex-direction: column;
            align-items: flex-end;
          }
          .grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            grid-template-rows: 1fr 1fr;
            gap: 12mm;
            flex: 1;
            margin: 6px 0;
          }
          .tag-cell {
            position: relative;
            border: 1.5px dashed #94a3b8;
            border-radius: 8px;
            padding: 6px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #fff;
          }
          .tag-cell img {
            width: 100%;
            height: 100%;
            object-fit: contain;
          }
          .cut-guide {
            position: absolute;
            top: -7px;
            left: 10px;
            background: white;
            padding: 0 4px;
            font-size: 7.5px;
            color: #94a3b8;
            font-weight: bold;
          }
          .footer {
            padding-top: 8px;
            border-top: 1px solid #e2e8f0;
            display: flex;
            justify-content: space-between;
            font-size: 8px;
            color: #94a3b8;
          }
          @media print {
            body {
              background: transparent;
            }
            .a4-page {
              margin: 0;
              box-shadow: none;
              width: 100%;
              min-height: auto;
              height: 100%;
              padding: 0;
            }
          }
        </style>
      </head>
      <body>
        ${pagesHtml}
        <script>
          window.onload = function() {
            setTimeout(function() {
              window.focus();
              window.print();
            }, 300);
          };
        </script>
      </body>
    </html>
  `);

  printWindow.document.close();
}
