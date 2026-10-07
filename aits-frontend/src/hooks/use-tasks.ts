import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tasksService, CreateTaskDto, UpdateTaskDto } from '../services/tasks.service';

export const useTasks = (farmId?: string, userId?: string, status?: string) => {
  return useQuery({
    queryKey: ['tasks', farmId, userId, status],
    queryFn: () => tasksService.getTasks(farmId!, userId, status),
    enabled: !!farmId,
  });
};

export const useTask = (id: string, farmId: string) => {
  return useQuery({
    queryKey: ['task', id, farmId],
    queryFn: () => tasksService.getTaskById(id, farmId),
    enabled: !!id && !!farmId,
  });
};

export const useCreateTask = (farmId?: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateTaskDto) => tasksService.createTask({ ...data, farmId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', farmId] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'tasks', farmId] });
    },
  });
};

export const useUpdateTask = (farmId?: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTaskDto }) => 
      tasksService.updateTask(id, data, farmId!),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tasks', farmId] });
      queryClient.invalidateQueries({ queryKey: ['task', variables.id, farmId] });
    },
  });
};

export const useDeleteTask = (farmId?: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => tasksService.deleteTask(id, farmId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', farmId] });
    },
  });
};

export const useCompleteTask = (farmId?: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, notes }: { id: string; notes?: string }) => 
      tasksService.completeTask(id, farmId!, notes),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tasks', farmId] });
      queryClient.invalidateQueries({ queryKey: ['task', variables.id, farmId] });
    },
  });
};
