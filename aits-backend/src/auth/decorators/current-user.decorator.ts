import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: string;
  roles: string[];
  permissions: string[]; // Still used for backward compatibility, but we will rely more on the detailed ones below
  globalPermissions: string[];
  farmPermissions: Record<string, string[]>;
  ownedFarms: string[];
  firstName?: string;
  lastName?: string;
  phone?: string | null;
  profileImageUrl?: string | null;
}

export interface RequestWithUser extends Request {
  user?: AuthenticatedUser;
}

export const CurrentUser = createParamDecorator(
  (data: keyof AuthenticatedUser | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<RequestWithUser>();
    const user = request.user;
    return data ? user?.[data] : user;
  },
);
