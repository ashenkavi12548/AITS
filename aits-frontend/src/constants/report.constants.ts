import { ReportTab } from '@/types/report.types';

export const REPORT_TABS: Array<{ id: ReportTab; label: string }> = [
  { id: 'overview', label: 'Overview' },
  { id: 'production', label: 'Production' },
  { id: 'health', label: 'Health' },
  { id: 'feeding', label: 'Feeding' },
  { id: 'breeding', label: 'Breeding' },
  { id: 'traceability', label: 'Traceability' },
];

export const CHART_COLORS = {
  primary: '#10A37F',
  secondary: '#0EA5E9',
  accent: '#F59E0B',
  purple: '#8B5CF6',
  rose: '#F43F5E',
  emerald: '#10B981',
  indigo: '#6366F1',
  amber: '#D97706',
  teal: '#14B8A6',
  gray: '#64748B',
  backgroundDark: '#212121',
  cardDark: '#171717',
  borderDark: '#303030',
  gridLight: '#E5E7EB',
  gridDark: '#334155',
};

export const PALETTE = [
  CHART_COLORS.primary,
  CHART_COLORS.secondary,
  CHART_COLORS.accent,
  CHART_COLORS.purple,
  CHART_COLORS.emerald,
  CHART_COLORS.rose,
  CHART_COLORS.indigo,
  CHART_COLORS.teal,
];


