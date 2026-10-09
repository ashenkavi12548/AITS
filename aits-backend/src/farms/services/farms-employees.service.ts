import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { Prisma, Farm, User, FarmUser, Role } from '@prisma/client';
import {
  SanitizedFarmEmployee,
  PaginatedResult,
  AuditContext,
} from '../types/farms.types';
import { createAuditRecord, verifyFarmAccess } from '../utils/farms.utils';

import { CloudinaryService } from '../../common/cloudinary/cloudinary.service';
import * as bcrypt from 'bcrypt';
import {
  CreateEmployeeDto,
  UpdateEmployeeDto,
  EmployeeQueryDto,
  TransferOwnershipDto,
} from '../dto';

@Injectable()
export class FarmsEmployeesService {
  private readonly logger = new Logger(FarmsEmployeesService.name);
  constructor(
    private readonly prisma: PrismaService,

    private readonly cloudinaryService: CloudinaryService,
  ) {}

  private async getFarmEmployeeById(
    farmId: string,
    employeeUserId: string,
  ): Promise<SanitizedFarmEmployee> {
    type FarmUserWithUser = Prisma.FarmUserGetPayload<{
      include: { user: true };
    }>;
    const fu: FarmUserWithUser | null = await this.prisma.farmUser.findUnique({
      where: { farmId_userId: { farmId, userId: employeeUserId } },
      include: { user: true },
    });
    if (!fu) throw new NotFoundException('Employee not found');
    return {
      id: fu.id,
      farmId: fu.farmId,
      userId: fu.userId,
      farmRole: fu.role,
      status: fu.status,
      joinedAt: fu.createdAt,
      user: {
        id: fu.user.id,
        firstName: fu.user.firstName,
        lastName: fu.user.lastName,
        fullName: `${fu.user.firstName} ${fu.user.lastName}`.trim(),
        email: fu.user.email,
        phone: fu.user.phone,
        profileImageUrl: fu.user.profileImageUrl,
        status: fu.user.status,
        lastLoginAt: fu.user.lastLoginAt,
        createdAt: fu.user.createdAt,
        permissions: [],
      },
    };
  }

  async getFarmEmployees(
    userId: string,
    farmId: string,
    query?: EmployeeQueryDto,
  ): Promise<SanitizedFarmEmployee[] | PaginatedResult<SanitizedFarmEmployee>> {
    await verifyFarmAccess(this.prisma, userId, farmId);

    const hasPagination =
      query?.page !== undefined || query?.limit !== undefined;
    const page = Math.max(1, query?.page || 1);
    const limit = Math.min(100, Math.max(1, query?.limit || 50));
    const skip = (page - 1) * limit;

    const where: Prisma.FarmUserWhereInput = {
      farmId,
      ...(query?.role && { role: query.role }),
      ...(query?.status && { status: query.status }),
      ...(query?.search && {
        user: {
          OR: [
            { firstName: { contains: query.search, mode: 'insensitive' } },
            { lastName: { contains: query.search, mode: 'insensitive' } },
            { email: { contains: query.search, mode: 'insensitive' } },
            { phone: { contains: query.search, mode: 'insensitive' } },
          ],
        },
      }),
    };

    const sortOrder: Prisma.SortOrder =
      query?.sortOrder === 'asc' ? 'asc' : 'desc';
    const sortBy = query?.sortBy || 'joinedAt';
    const orderBy: Prisma.FarmUserOrderByWithRelationInput =
      sortBy === 'role'
        ? { role: sortOrder }
        : sortBy === 'status'
          ? { status: sortOrder }
          : { joinedAt: sortOrder };

    type FarmUserWithDeepUser = Prisma.FarmUserGetPayload<{
      include: {
        user: {
          select: {
            id: true;
            firstName: true;
            lastName: true;
            email: true;
            phone: true;
            profileImageUrl: true;
            status: true;
            lastLoginAt: true;
            createdAt: true;
            userRoles: {
              include: {
                role: {
                  include: {
                    rolePermissions: {
                      include: {
                        permission: true;
                      };
                    };
                  };
                };
              };
            };
          };
        };
      };
    }>;

    const [farmUsers, total] = (await Promise.all([
      this.prisma.farmUser.findMany({
        where,
        ...(hasPagination && { skip, take: limit }),
        orderBy,
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
              profileImageUrl: true,
              status: true,
              lastLoginAt: true,
              createdAt: true,
              userRoles: {
                include: {
                  role: {
                    include: {
                      rolePermissions: {
                        include: {
                          permission: true,
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      }),
      this.prisma.farmUser.count({ where }),
    ])) as [FarmUserWithDeepUser[], number];

    const sanitizedList: SanitizedFarmEmployee[] = farmUsers.map((fu) => {
      const permissions = Array.from(
        new Set([
          ...(fu.user.userRoles?.flatMap((ur) =>
            ur.role.rolePermissions.map((rp) => rp.permission.name),
          ) || []),
          ...(fu.permissions || []),
        ]),
      );

      return {
        id: fu.id,
        farmId: fu.farmId,
        userId: fu.userId,
        farmRole: fu.role,
        status: fu.status,
        joinedAt: fu.joinedAt,
        user: {
          id: fu.user.id,
          firstName: fu.user.firstName,
          lastName: fu.user.lastName,
          fullName: `${fu.user.firstName} ${fu.user.lastName}`.trim(),
          email: fu.user.email,
          phone: fu.user.phone,
          profileImageUrl: fu.user.profileImageUrl,
          status: fu.user.status,
          lastLoginAt: fu.user.lastLoginAt,
          createdAt: fu.user.createdAt,
          permissions,
        },
      };
    });

    if (hasPagination) {
      return {
        data: sanitizedList,
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    }

    return sanitizedList;
  }
  async createFarmEmployee(
    userId: string,
    farmId: string,
    dto: CreateEmployeeDto,
    auditContext?: AuditContext,
  ): Promise<SanitizedFarmEmployee> {
    const { farm, isOwner, membership } = await verifyFarmAccess(
      this.prisma,
      userId,
      farmId,
      ['OWNER', 'MANAGER'],
    );

    const normalizedEmail = dto.email.toLowerCase().trim();
    const assignedFarmRole = dto.role || 'WORKER';

    if (!isOwner && assignedFarmRole === 'OWNER') {
      throw new ForbiddenException(
        'Only the farm owner or system admin can assign the OWNER role.',
      );
    }

    if (!isOwner && assignedFarmRole === 'MANAGER') {
      throw new ForbiddenException(
        'Only the farm owner can appoint a Manager.',
      );
    }

    // Verify acting user has permissions they are assigning
    if (!isOwner && dto.permissions && dto.permissions.length > 0) {
      const actingPerms = membership?.permissions || [];
      const unauthorizedPerms = dto.permissions.filter(
        (p) => !actingPerms.includes(p),
      );
      if (unauthorizedPerms.length > 0) {
        throw new ForbiddenException(
          `You cannot grant permissions you do not possess: ${unauthorizedPerms.join(', ')}`,
        );
      }
    }

    // Check if user already exists
    const existingUser: User | null = await this.prisma.user.findFirst({
      where: { email: normalizedEmail, deletedAt: null },
    });

    if (existingUser) {
      const existingMembership: FarmUser | null =
        await this.prisma.farmUser.findUnique({
          where: {
            farmId_userId: {
              farmId,
              userId: existingUser.id,
            },
          },
        });

      if (existingMembership) {
        throw new ConflictException(
          'A staff member with this email is already registered in this farm facility.',
        );
      }

      // Add existing user to this farm
      await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        await tx.farmUser.create({
          data: {
            farmId,
            userId: existingUser.id,
            role: assignedFarmRole,
            permissions: dto.permissions || [],
            status: 'ACTIVE',
          },
        });

        await createAuditRecord(
          tx,
          userId,
          'ADD_FARM_EMPLOYEE',
          'FarmUser',
          existingUser.id,
          null,
          { farmId, userId: existingUser.id, role: assignedFarmRole },
          auditContext,
        );
      });

      return this.getFarmEmployeeById(farmId, existingUser.id);
    }

    // New user account creation
    const passwordHash = await bcrypt.hash(dto.password, 10);

    const workerRoleName = 'WORKER';
    const defaultRole: Role = await this.prisma.role.upsert({
      where: { name: workerRoleName },
      update: {},
      create: {
        name: workerRoleName,
        description: 'Farm Worker Role (assigned by farm owner)',
      },
    });

    const createdFarmUser = await this.prisma.$transaction(
      async (tx: Prisma.TransactionClient) => {
        // 1. Create User
        const newUser = await tx.user.create({
          data: {
            firstName: dto.firstName.trim(),
            lastName: dto.lastName.trim(),
            email: normalizedEmail,
            phone: dto.phone?.trim() || null,
            profileImageUrl: dto.profileImageUrl || null,
            passwordHash,
            status: 'ACTIVE',
          },
        });

        // 2. Link Role
        await tx.userRole.create({
          data: {
            userId: newUser.id,
            roleId: defaultRole.id,
          },
        });

        // 3. Link Farm Membership
        const farmUser = await tx.farmUser.create({
          data: {
            farmId,
            userId: newUser.id,
            role: assignedFarmRole,
            permissions: dto.permissions || [],
            status: 'ACTIVE',
          },
        });

        // 4. Default Notifications
        await tx.notificationPreference.create({
          data: {
            userId: newUser.id,
            vaccinationNotifications: true,
            feedingNotifications: true,
            healthNotifications: true,
            documentNotifications: true,
            syncNotifications: true,
          },
        });

        // 5. Audit Log
        await createAuditRecord(
          tx,
          userId,
          'ADD_FARM_EMPLOYEE',
          'FarmUser',
          newUser.id,
          null,
          {
            farmId,
            userId: newUser.id,
            role: assignedFarmRole,
            email: normalizedEmail,
          },
          auditContext,
        );

        return farmUser;
      },
    );

    return this.getFarmEmployeeById(farmId, createdFarmUser.userId);
  }
  async updateFarmEmployee(
    userId: string,
    farmId: string,
    employeeId: string,
    dto: UpdateEmployeeDto,
    auditContext?: AuditContext,
  ): Promise<SanitizedFarmEmployee> {
    const { farm, isOwner, membership } = await verifyFarmAccess(
      this.prisma,
      userId,
      farmId,
      ['OWNER', 'MANAGER'],
    );

    if (userId === employeeId && dto.role) {
      throw new ForbiddenException(
        'You cannot change your own role in the farm facility.',
      );
    }

    if (!isOwner && dto.role === 'OWNER') {
      throw new ForbiddenException(
        'Only the farm owner or system admin can assign the OWNER role.',
      );
    }

    if (!isOwner && dto.role === 'MANAGER') {
      throw new ForbiddenException(
        'Only the farm owner can appoint a Manager.',
      );
    }

    if (!isOwner && dto.permissions && dto.permissions.length > 0) {
      const actingPerms = membership?.permissions || [];
      const unauthorizedPerms = dto.permissions.filter(
        (p) => !actingPerms.includes(p),
      );
      if (unauthorizedPerms.length > 0) {
        throw new ForbiddenException(
          `You cannot grant permissions you do not possess: ${unauthorizedPerms.join(', ')}`,
        );
      }
    }

    // Protect farm owner from deactivation or role downgrade
    if (employeeId === farm.ownerId && dto.status === 'INACTIVE') {
      throw new BadRequestException(
        'Cannot deactivate the farm facility owner.',
      );
    }

    if (employeeId === farm.ownerId && dto.role && dto.role !== 'OWNER') {
      throw new BadRequestException(
        'Cannot change farm owner role. Use transfer ownership endpoint instead.',
      );
    }

    await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // 1. Update FarmUser role, status, & permissions
      if (dto.role || dto.status || dto.permissions !== undefined) {
        await tx.farmUser.updateMany({
          where: { farmId, userId: employeeId },
          data: {
            ...(dto.role && { role: dto.role }),
            ...(dto.status && { status: dto.status }),
            ...(dto.permissions !== undefined && {
              permissions: dto.permissions,
            }),
          },
        });
      }

      // 2. Update User profile info
      if (
        dto.firstName ||
        dto.lastName ||
        dto.phone !== undefined ||
        dto.status ||
        dto.profileImageUrl !== undefined
      ) {
        await tx.user.update({
          where: { id: employeeId },
          data: {
            ...(dto.firstName && { firstName: dto.firstName.trim() }),
            ...(dto.lastName && { lastName: dto.lastName.trim() }),
            ...(dto.phone !== undefined && {
              phone: dto.phone ? dto.phone.trim() : null,
            }),
            ...(dto.profileImageUrl !== undefined && {
              profileImageUrl: dto.profileImageUrl || null,
            }),
            ...(dto.status && {
              status: dto.status === 'ACTIVE' ? 'ACTIVE' : 'INACTIVE',
            }),
          },
        });
      }

      // 3. Audit Log
      const auditPayload: Record<string, unknown> = {
        ...(dto.role !== undefined && { role: dto.role }),
        ...(dto.status !== undefined && { status: dto.status }),
        ...(dto.permissions !== undefined && { permissions: dto.permissions }),
        ...(dto.firstName !== undefined && { firstName: dto.firstName }),
        ...(dto.lastName !== undefined && { lastName: dto.lastName }),
        ...(dto.phone !== undefined && { phone: dto.phone }),
        ...(dto.profileImageUrl !== undefined && {
          profileImageUrl: dto.profileImageUrl,
        }),
      };
      await createAuditRecord(
        tx,
        userId,
        'UPDATE_FARM_EMPLOYEE',
        'FarmUser',
        employeeId,
        null,
        auditPayload,
        auditContext,
      );
    });

    return this.getFarmEmployeeById(farmId, employeeId);
  }
  async resetEmployeePassword(
    userId: string,
    farmId: string,
    employeeId: string,
    newPassword: string,
    auditContext?: AuditContext,
  ): Promise<{ success: boolean; message: string }> {
    await verifyFarmAccess(this.prisma, userId, farmId, ['OWNER', 'MANAGER']);

    if (!newPassword || newPassword.length < 6) {
      throw new BadRequestException(
        'New password must be at least 6 characters long.',
      );
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);

    await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      await tx.user.update({
        where: { id: employeeId },
        data: { passwordHash },
      });

      await createAuditRecord(
        tx,
        userId,
        'RESET_EMPLOYEE_PASSWORD',
        'User',
        employeeId,
        null,
        { updated: true },
        auditContext,
      );
    });

    return {
      success: true,
      message: 'Employee password has been updated successfully.',
    };
  }
  async removeFarmEmployee(
    userId: string,
    farmId: string,
    employeeId: string,
    auditContext?: AuditContext,
  ): Promise<{ success: boolean; message: string }> {
    const { farm, isOwner } = await verifyFarmAccess(
      this.prisma,
      userId,
      farmId,
      ['OWNER', 'MANAGER'],
    );

    if (employeeId === farm.ownerId) {
      throw new BadRequestException(
        'Cannot remove the farm facility owner from their farm.',
      );
    }

    const targetUser: FarmUser | null = await this.prisma.farmUser.findUnique({
      where: { farmId_userId: { farmId, userId: employeeId } },
    });

    if (!isOwner && targetUser?.role === 'MANAGER') {
      throw new ForbiddenException('Only the farm owner can remove a Manager.');
    }

    await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      await tx.farmUser.deleteMany({
        where: { farmId, userId: employeeId },
      });

      await createAuditRecord(
        tx,
        userId,
        'REMOVE_FARM_EMPLOYEE',
        'FarmUser',
        employeeId,
        { farmId, userId: employeeId },
        null,
        auditContext,
      );
    });

    return {
      success: true,
      message: 'Employee has been removed from this farm facility.',
    };
  }
  async transferFarmOwnership(
    userId: string,
    farmId: string,
    dto: TransferOwnershipDto,
    auditContext?: AuditContext,
  ): Promise<{ success: boolean; message: string; farm: Farm }> {
    const { farm } = await verifyFarmAccess(this.prisma, userId, farmId);

    if (farm.ownerId !== userId) {
      throw new ForbiddenException(
        'Only the Farm Owner can transfer ownership of the farm.',
      );
    }

    if (dto.newOwnerId === farm.ownerId) {
      throw new BadRequestException(
        'Specified user is already the owner of this farm.',
      );
    }

    const newOwner: User | null = await this.prisma.user.findUnique({
      where: { id: dto.newOwnerId, deletedAt: null },
    });

    if (!newOwner) {
      throw new NotFoundException('New owner user account not found.');
    }

    const updated = await this.prisma.$transaction(
      async (tx: Prisma.TransactionClient) => {
        // 1. Update Farm ownerId
        const updatedFarm = await tx.farm.update({
          where: { id: farmId },
          data: { ownerId: dto.newOwnerId },
        });

        // 2. Demote previous owner to MANAGER in FarmUser
        await tx.farmUser.upsert({
          where: {
            farmId_userId: {
              farmId,
              userId,
            },
          },
          update: { role: 'MANAGER' },
          create: {
            farmId,
            userId,
            role: 'MANAGER',
            status: 'ACTIVE',
          },
        });

        // 3. Promote new owner to OWNER in FarmUser
        await tx.farmUser.upsert({
          where: {
            farmId_userId: {
              farmId,
              userId: dto.newOwnerId,
            },
          },
          update: { role: 'OWNER', status: 'ACTIVE' },
          create: {
            farmId,
            userId: dto.newOwnerId,
            role: 'OWNER',
            status: 'ACTIVE',
          },
        });

        // 4. Record Audit Log
        await createAuditRecord(
          tx,
          userId,
          'TRANSFER_FARM_OWNERSHIP',
          'Farm',
          farmId,
          { ownerId: farm.ownerId },
          { ownerId: dto.newOwnerId, reason: dto.reason || null },
          auditContext,
        );

        return updatedFarm;
      },
    );

    return {
      success: true,
      message: `Farm ownership transferred to ${newOwner.firstName} ${newOwner.lastName}.`,
      farm: updated,
    };
  }
  async uploadEmployeePhoto(
    file?: Express.Multer.File,
  ): Promise<{ success: boolean; imageUrl: string; publicId: string }> {
    if (!file) {
      throw new BadRequestException('No image file provided');
    }

    try {
      const uploadResult = await this.cloudinaryService.uploadImage(
        file.buffer,
        'aits/profiles',
      );
      return {
        success: true,
        imageUrl: uploadResult.secureUrl,
        publicId: uploadResult.publicId,
      };
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to upload employee photo: ${msg}`);
      throw new BadRequestException(
        'Failed to upload image. Please try again.',
      );
    }
  }
}
