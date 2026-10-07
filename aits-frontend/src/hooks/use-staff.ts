import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  farmsService,
  FarmFacility,
  FarmEmployee,
  CreateEmployeeInput,
  UpdateEmployeeInput,
  CreateFarmInput,
} from "@/services/farms.service";
import toast from "react-hot-toast";

export const staffKeys = {
  all: ["staff"] as const,
  farms: () => [...staffKeys.all, "farms"] as const,
  employees: (farmId?: string) =>
    [...staffKeys.all, "employees", farmId ?? "none"] as const,
};

/**
 * Fetch all accessible farm facilities for the current user.
 */
export function useFarms() {
  return useQuery({
    queryKey: staffKeys.farms(),
    queryFn: async (): Promise<FarmFacility[]> => {
      const farms = await farmsService.getFarms();
      if (Array.isArray(farms) && farms.length > 0) {
        return farms;
      }
      const myFarm = await farmsService.getMyFarm();
      return myFarm ? [myFarm] : [];
    },
    staleTime: 1000 * 60 * 5, // 5 minutes cache
  });
}

/**
 * Mutation hook to register a new farm facility (up to 2 farms per farmer).
 */
export function useCreateFarm() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateFarmInput) => farmsService.createFarm(data),
    onSuccess: (newFarm) => {
      queryClient.invalidateQueries({ queryKey: staffKeys.farms() });
      toast.success(`Farm facility "${newFarm.name}" registered successfully!`);
    },
    onError: (err: unknown) => {
      const axiosErr = err as {
        response?: { data?: { message?: string | string[] } };
      };
      const msg =
        axiosErr.response?.data?.message ||
        (err instanceof Error ? err.message : "Failed to register farm facility.");
      toast.error(Array.isArray(msg) ? msg.join(", ") : msg);
    },
  });
}

/**
 * Fetch employees for a specific farm facility.
 */
export function useStaffEmployees(farmId?: string) {
  return useQuery({
    queryKey: staffKeys.employees(farmId),
    queryFn: async (): Promise<FarmEmployee[]> => {
      if (!farmId) return [];
      return farmsService.getEmployees(farmId);
    },
    enabled: Boolean(farmId),
    staleTime: 1000 * 60 * 2, // 2 minutes cache
  });
}

/**
 * Mutation to enroll a new employee in a farm.
 */
export function useCreateStaffEmployee(farmId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateEmployeeInput) => {
      if (!farmId) throw new Error("Farm ID is required to enroll staff.");
      return farmsService.createEmployee(farmId, data);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: staffKeys.employees(farmId) });
      toast.success(
        `Staff member ${variables.firstName} ${variables.lastName} enrolled successfully!`,
      );
    },
    onError: (err: unknown) => {
      const axiosErr = err as {
        response?: { data?: { message?: string | string[] } };
      };
      const msg =
        axiosErr.response?.data?.message ||
        (err instanceof Error ? err.message : "Failed to enroll staff member.");
      toast.error(Array.isArray(msg) ? msg.join(", ") : msg);
    },
  });
}

/**
 * Mutation to update profile, role, status or permissions of an employee.
 */
export function useUpdateStaffEmployee(farmId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      employeeUserId,
      data,
    }: {
      employeeUserId: string;
      data: UpdateEmployeeInput;
    }) => {
      if (!farmId) throw new Error("Farm ID is required to update staff.");
      return farmsService.updateEmployee(farmId, employeeUserId, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: staffKeys.employees(farmId) });
      toast.success("Staff details updated successfully.");
    },
    onError: (err: unknown) => {
      const axiosErr = err as {
        response?: { data?: { message?: string | string[] } };
      };
      const msg =
        axiosErr.response?.data?.message ||
        (err instanceof Error ? err.message : "Failed to update staff member.");
      toast.error(Array.isArray(msg) ? msg.join(", ") : msg);
    },
  });
}

/**
 * Mutation to reset an employee's password.
 */
export function useResetStaffPassword(farmId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      employeeUserId,
      newPassword,
    }: {
      employeeUserId: string;
      newPassword: string;
    }) => {
      if (!farmId) throw new Error("Farm ID is required to reset password.");
      return farmsService.resetEmployeePassword(
        farmId,
        employeeUserId,
        newPassword,
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: staffKeys.employees(farmId) });
      toast.success("Staff credentials updated successfully.");
    },
    onError: (err: unknown) => {
      const axiosErr = err as {
        response?: { data?: { message?: string | string[] } };
      };
      const msg =
        axiosErr.response?.data?.message ||
        (err instanceof Error ? err.message : "Failed to reset password.");
      toast.error(Array.isArray(msg) ? msg.join(", ") : msg);
    },
  });
}

/**
 * Mutation to delete / remove an employee from a farm.
 */
export function useRemoveStaffEmployee(farmId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (employeeUserId: string) => {
      if (!farmId) throw new Error("Farm ID is required to remove staff.");
      return farmsService.removeEmployee(farmId, employeeUserId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: staffKeys.employees(farmId) });
      toast.success("Staff member removed from farm.");
    },
    onError: (err: unknown) => {
      const axiosErr = err as {
        response?: { data?: { message?: string | string[] } };
      };
      const msg =
        axiosErr.response?.data?.message ||
        (err instanceof Error ? err.message : "Failed to remove staff member.");
      toast.error(Array.isArray(msg) ? msg.join(", ") : msg);
    },
  });
}
