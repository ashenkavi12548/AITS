import { AnimalHealthState } from './health-state.service';

export interface PaginatedResult<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface TimelineEvent {
  id?: string;
  date: string;
  category:
    | 'EXAMINATION'
    | 'DIAGNOSIS'
    | 'TREATMENT'
    | 'WITHDRAWAL'
    | 'LAB'
    | 'VACCINATION'
    | 'QUARANTINE'
    | 'CLEARANCE'
    | 'FOLLOWUP';
  title: string;
  description: string;
  actor: string;
  status?: string;
  data?: Record<string, unknown>;
}

export interface AnimalHealthTimelineResponse {
  animal: {
    id: string;
    tag: string;
    name: string | null;
    species: string;
    breed: string;
    farmName: string;
  };
  compositeState: AnimalHealthState;
  timeline: TimelineEvent[];
}
