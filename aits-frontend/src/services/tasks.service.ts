import api from './api';

export enum TaskPriority {
  LOW = 'LOW',
  NORMAL = 'NORMAL',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

export enum TaskStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum TaskCategory {
  ANIMAL_CARE = 'ANIMAL_CARE',
  FEEDING = 'FEEDING',
  MILKING = 'MILKING',
  HEALTH = 'HEALTH',
  CLEANING = 'CLEANING',
  BREEDING = 'BREEDING',
  MAINTENANCE = 'MAINTENANCE',
  GENERAL = 'GENERAL',
}

export interface Task {
  id: string;
  farmId: string;
  assignedToId: string;
  createdById: string;
  completedById?: string;
  animalId?: string;
  title: string;
  description?: string;
  priority: TaskPriority;
  status: TaskStatus;
  category: TaskCategory;
  startDate?: string;
  dueDate: string;
  completedAt?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  assignedTo?: {
    id: string;
    firstName: string;
    lastName: string;
    profileImageUrl?: string;
  };
  createdBy?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  animal?: {
    id: string;
    animalNumber: string;
    name?: string;
  };
}

export interface CreateTaskDto {
  title: string;
  description?: string;
  priority?: TaskPriority;
  category?: TaskCategory;
  dueDate: string;
  startDate?: string;
  assignedToId: string;
  animalId?: string;
  farmId?: string;
}

export interface UpdateTaskDto {
  title?: string;
  description?: string;
  priority?: TaskPriority;
  category?: TaskCategory;
  dueDate?: string;
  startDate?: string;
  assignedToId?: string;
  animalId?: string;
  status?: TaskStatus;
  notes?: string;
}

export const tasksService = {
  getTasks: async (farmId: string, userId?: string, status?: string): Promise<Task[]> => {
    const params: Record<string, string> = { farmId };
    if (userId) params.userId = userId;
    if (status) params.status = status;
    const response = await api.get<Task[]>('/api/v1/tasks', { params });
    return response.data;
  },

  getTaskById: async (id: string, farmId: string): Promise<Task> => {
    const response = await api.get<Task>(`/api/v1/tasks/${id}`, {
      params: { farmId },
    });
    return response.data;
  },

  createTask: async (data: CreateTaskDto): Promise<Task> => {
    const response = await api.post<Task>('/api/v1/tasks', data);
    return response.data;
  },

  updateTask: async (id: string, data: UpdateTaskDto, farmId: string): Promise<Task> => {
    const response = await api.patch<Task>(`/api/v1/tasks/${id}`, data, {
      params: { farmId },
    });
    return response.data;
  },

  deleteTask: async (id: string, farmId: string): Promise<void> => {
    await api.delete(`/api/v1/tasks/${id}`, {
      params: { farmId },
    });
  },

  completeTask: async (id: string, farmId: string, notes?: string): Promise<Task> => {
    const response = await api.patch<Task>(`/api/v1/tasks/${id}`, { status: TaskStatus.COMPLETED, notes }, {
      params: { farmId },
    });
    return response.data;
  }
};
