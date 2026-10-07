import { FarmUserRole, FarmUserStatus } from '@prisma/client';

export interface SanitizedEmployeeUser {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phone: string | null;
  profileImageUrl: string | null;
  status: string;
  isEmailVerified: boolean;
  lastLoginAt: Date | null;
  createdAt: Date;
  permissions: string[];
}

export interface SanitizedFarmEmployee {
  id: string;
  farmId: string;
  userId: string;
  farmRole: FarmUserRole;
  status: FarmUserStatus;
  joinedAt: Date;
  user: SanitizedEmployeeUser;
}

export interface PaginatedResult<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface AuditContext {
  ipAddress?: string;
  userAgent?: string;
}
