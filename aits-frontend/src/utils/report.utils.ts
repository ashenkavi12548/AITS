/**
 * Calculates percentage difference safely without zero-division errors.
 */
export function calculatePercentageChange(
  current: number,
  previous?: number | null,
): { percentage: number | null; direction: 'increase' | 'decrease' | 'neutral' } {
  if (previous === undefined || previous === null || previous === 0) {
    return { percentage: null, direction: 'neutral' };
  }

  const diff = current - previous;
  const percentage = (diff / Math.abs(previous)) * 100;
  const rounded = Math.round(percentage * 100) / 100;

  if (rounded > 0) return { percentage: rounded, direction: 'increase' };
  if (rounded < 0) return { percentage: rounded, direction: 'decrease' };
  return { percentage: 0, direction: 'neutral' };
}

/**
 * Formats numbers into clean localized strings (e.g. 12,480)
 */
export function formatNumber(val: number | string | undefined | null): string {
  if (val === undefined || val === null) return '0';
  if (typeof val === 'string') return val;
  return new Intl.NumberFormat('en-US').format(val);
}

/**
 * Validates that From Date is not later than To Date.
 */
export function validateDateRange(startDate: string, endDate: string): boolean {
  if (!startDate || !endDate) return true;
  const start = new Date(startDate);
  const end = new Date(endDate);
  return start.getTime() <= end.getTime();
}

/**
 * Formats ISO date string into readable format (e.g., Sep 12, 2026).
 */
export function formatDateReadable(dateStr?: string): string {
  if (!dateStr) return 'N/A';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

/**
 * Triggers native browser print dialog for printable views.
 */
export function triggerPrintReport(): void {
  if (typeof window !== 'undefined') {
    window.print();
  }
}
