export type SystemRole =
 
  | 'MANAGER'
  | 'FARMER'
  | 'VETERINARIAN'
  | 'WORKER';

export type FarmUserRole =
  | 'OWNER'
  | 'MANAGER'
  | 'VETERINARIAN'
  | 'WORKER'
  | 'AUDITOR';

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  phone?: string | null;
  profileImageUrl?: string | null;
  role: string;
  roles: string[];
  permissions: string[];
  farmPermissions?: Record<string, string[]>;
  farmRoles?: Record<string, string>;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'PENDING';
  primaryFarmId?: string | null;
  primaryFarmName?: string | null;
  farmRole?: FarmUserRole | null;
  lastLoginAt?: string | null;
  createdAt?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface AuthResponse extends AuthTokens {
  user: AuthUser;
}

export interface LoginCredentials {
  email?: string;
  identifier?: string;
  password: string;
}

export interface RegisterInput {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone?: string;
  role?: SystemRole;
  farmName?: string;
  farmType?: string;
  address?: string;
  province?: string;
  district?: string;
  city?: string;
}

export interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
}

export interface UpdateProfileInput {
  firstName?: string;
  lastName?: string;
  phone?: string;
  profileImageUrl?: string;
}
