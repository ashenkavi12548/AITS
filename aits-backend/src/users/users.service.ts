import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(params?: { search?: string; role?: string; limit?: number }) {
    const where: Prisma.UserWhereInput = {
      deletedAt: null,
    };

    if (params?.search) {
      where.OR = [
        { firstName: { contains: params.search, mode: 'insensitive' } },
        { lastName: { contains: params.search, mode: 'insensitive' } },
        { email: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    if (params?.role) {
      where.userRoles = {
        some: {
          role: {
            name: params.role,
          },
        },
      };
    }

    const users = await this.prisma.user.findMany({
      where,
      take: params?.limit || 50,
      orderBy: { createdAt: 'desc' },
      include: {
        userRoles: {
          include: {
            role: true,
          },
        },
        ownedFarms: {
          where: { deletedAt: null },
          select: { id: true, name: true, registrationNumber: true },
        },
      },
    });

    return users.map((u) => ({
      id: u.id,
      firstName: u.firstName,
      lastName: u.lastName,
      fullName: `${u.firstName} ${u.lastName}`,
      email: u.email,
      phone: u.phone,
      profileImageUrl: u.profileImageUrl,
      status: u.status,
      roles: u.userRoles.map((ur) => ur.role.name),
      role: u.userRoles[0]?.role?.name || 'FARMER',
      farms: u.ownedFarms,
      lastLoginAt: u.lastLoginAt,
      createdAt: u.createdAt,
    }));
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findFirst({
      where: { id, deletedAt: null },
      include: {
        userRoles: {
          include: {
            role: true,
          },
        },
        ownedFarms: { where: { deletedAt: null } },
      },
    });

    if (!user) {
      throw new NotFoundException(
        'The requested user account could not be found.',
      );
    }

    return {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      fullName: `${user.firstName} ${user.lastName}`,
      email: user.email,
      phone: user.phone,
      profileImageUrl: user.profileImageUrl,
      status: user.status,
      roles: user.userRoles.map((ur) => ur.role.name),
      role: user.userRoles[0]?.role?.name || 'FARMER',
      farms: user.ownedFarms,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
    };
  }
}
