export interface DashboardSummary {
  totalAnimals: number;
  healthyAnimals: number;
  milkProductionToday: number;
  pregnantAnimals: number;
  expectedBirths: number;
}

export interface MilkProductionDataPoint {
  date: string;
  label: string;
  quantityLiters: number;
}

export type PeriodType = 'daily' | 'weekly' | 'monthly';

export interface AnimalStatusItem {
  status: string;
  label: string;
  count: number;
  percentage: number;
}

export interface UpcomingEvent {
  id: string;
  rawId?: string;
  category?: 'VACCINATION' | 'TREATMENT' | 'CALVING' | 'VET_VISIT';
  title: string;
  type: string;
  date: string;
  animalId: string;
  animalNumber: string;
  animalName?: string | null;
  animalBreed?: string | null;
  animalSpecies?: string | null;
  farmName?: string | null;
  status: string;
  urgency?: 'OVERDUE' | 'DUE_TODAY' | 'UPCOMING';
  notes?: string | null;
  details?: string | null;
}

export interface CreateScheduleEventInput {
  animalTag: string;
  eventType: 'VACCINATION' | 'TREATMENT' | 'CALVING' | 'VET_VISIT';
  title: string;
  scheduledDate: string;
  notes?: string;
  vaccineName?: string;
  dose?: string;
  medication?: string;
  instructions?: string;
  sendEmail?: boolean;
  createNotification?: boolean;
}

export interface AnimalAttentionItem {
  id: string;
  animalId: string;
  animalNumber: string;
  name: string;
  issue: string;
  priority: 'High' | 'Medium' | 'Low';
}

export interface AttentionSummary {
  high: number;
  medium: number;
  low: number;
}

export interface AnimalAttentionResponse {
  items: AnimalAttentionItem[];
  summary: AttentionSummary;
}

export interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  avatarUrl?: string;
  profileImageUrl?: string | null;
}
