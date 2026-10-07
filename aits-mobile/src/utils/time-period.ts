export type TimePeriod = 'MORNING' | 'AFTERNOON' | 'EVENING' | 'NIGHT';

/**
 * Boundaries (24h format):
 * Morning:   05:00 - 11:59
 * Afternoon: 12:00 - 16:59
 * Evening:   17:00 - 20:59
 * Night:     21:00 - 04:59
 */
export const getTimePeriod = (date: Date): TimePeriod => {
  const hour = date.getHours();
  
  if (hour >= 5 && hour < 12) {
    return 'MORNING';
  } else if (hour >= 12 && hour < 17) {
    return 'AFTERNOON';
  } else if (hour >= 17 && hour < 21) {
    return 'EVENING';
  } else {
    return 'NIGHT';
  }
};

export const getTimePeriodLabel = (period: TimePeriod): string => {
  switch (period) {
    case 'MORNING': return 'Morning (05:00 - 11:59)';
    case 'AFTERNOON': return 'Afternoon (12:00 - 16:59)';
    case 'EVENING': return 'Evening (17:00 - 20:59)';
    case 'NIGHT': return 'Night (21:00 - 04:59)';
  }
};
