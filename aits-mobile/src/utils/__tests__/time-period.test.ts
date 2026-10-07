import { getTimePeriod, getTimePeriodLabel } from '../time-period';

describe('time-period utils', () => {
  it('identifies MORNING correctly (05:00 - 11:59)', () => {
    expect(getTimePeriod(new Date('2026-09-24T05:00:00'))).toBe('MORNING');
    expect(getTimePeriod(new Date('2026-09-24T08:30:00'))).toBe('MORNING');
    expect(getTimePeriod(new Date('2026-09-24T11:59:59'))).toBe('MORNING');
  });

  it('identifies AFTERNOON correctly (12:00 - 16:59)', () => {
    expect(getTimePeriod(new Date('2026-09-24T12:00:00'))).toBe('AFTERNOON');
    expect(getTimePeriod(new Date('2026-09-24T14:15:00'))).toBe('AFTERNOON');
    expect(getTimePeriod(new Date('2026-09-24T16:59:59'))).toBe('AFTERNOON');
  });

  it('identifies EVENING correctly (17:00 - 20:59)', () => {
    expect(getTimePeriod(new Date('2026-09-24T17:00:00'))).toBe('EVENING');
    expect(getTimePeriod(new Date('2026-09-24T19:45:00'))).toBe('EVENING');
    expect(getTimePeriod(new Date('2026-09-24T20:59:59'))).toBe('EVENING');
  });

  it('identifies NIGHT correctly (21:00 - 04:59)', () => {
    expect(getTimePeriod(new Date('2026-09-24T21:00:00'))).toBe('NIGHT');
    expect(getTimePeriod(new Date('2026-09-24T23:59:59'))).toBe('NIGHT');
    expect(getTimePeriod(new Date('2026-09-25T00:00:00'))).toBe('NIGHT');
    expect(getTimePeriod(new Date('2026-09-25T04:59:59'))).toBe('NIGHT');
  });

  it('returns correct labels', () => {
    expect(getTimePeriodLabel('MORNING')).toBe('Morning (05:00 - 11:59)');
    expect(getTimePeriodLabel('AFTERNOON')).toBe('Afternoon (12:00 - 16:59)');
    expect(getTimePeriodLabel('EVENING')).toBe('Evening (17:00 - 20:59)');
    expect(getTimePeriodLabel('NIGHT')).toBe('Night (21:00 - 04:59)');
  });
});
