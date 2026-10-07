import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { MailService } from '../../mail/mail.service';
import { DashboardHelpersService } from './dashboard-helpers.service';
import { NotificationsService } from '../../notifications/notifications.service';
import { AnimalStatus, MilkingSession, AnimalGender } from '@prisma/client';
import { QuickAddAnimalDto } from '../dto/quick-add-animal.dto';

@Injectable()
export class DashboardOperationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
    private readonly helpers: DashboardHelpersService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async getCurrentUser(userId?: string) {
    if (!userId) return null;
    try {
      const user = await this.prisma.user.findFirst({
        where: { id: userId, deletedAt: null },
        include: {
          userRoles: { include: { role: true } },
        },
      });

      if (!user) return null;

      const role = user.userRoles[0]?.role?.name || 'User';

      return {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role,
        avatarUrl: user.profileImageUrl ?? undefined,
        profileImageUrl: user.profileImageUrl ?? null,
      };
    } catch {
      return null;
    }
  }

  async searchRecords(query: string) {
    const q = (query || '').toLowerCase().trim();
    if (!q) return [];

    try {
      const [animals, farms, qrCodes] = await Promise.all([
        this.prisma.animal.findMany({
          where: {
            OR: [
              { animalNumber: { contains: q, mode: 'insensitive' } },
              { name: { contains: q, mode: 'insensitive' } },
              { breed: { contains: q, mode: 'insensitive' } },
            ],
            deletedAt: null,
          },
          take: 5,
        }),
        this.prisma.farm.findMany({
          where: {
            OR: [
              { name: { contains: q, mode: 'insensitive' } },
              { registrationNumber: { contains: q, mode: 'insensitive' } },
              { city: { contains: q, mode: 'insensitive' } },
            ],
            deletedAt: null,
          },
          take: 5,
        }),
        this.prisma.qRCode.findMany({
          where: {
            qrValue: { contains: q, mode: 'insensitive' },
          },
          include: { animal: true },
          take: 5,
        }),
      ]);

      const results: Array<{
        type: string;
        title: string;
        desc: string;
        href: string;
      }> = [];

      animals.forEach((a) => {
        results.push({
          type: 'Animal',
          title: `${a.animalNumber} (${a.name || 'Unnamed'})`,
          desc: `${a.breed || 'Livestock'} • ${a.status}`,
          href: `/animals/${a.id}`,
        });
      });

      farms.forEach((f) => {
        results.push({
          type: 'Farm',
          title: f.name,
          desc: `${f.registrationNumber} • ${f.city || f.district || 'Active Farm'}`,
          href: `/settings`,
        });
      });

      qrCodes.forEach((qr) => {
        results.push({
          type: 'QR Tag',
          title: qr.qrValue,
          desc: qr.animal
            ? `Tag for ${qr.animal.animalNumber}`
            : 'Active QR Tag',
          href: qr.animal ? `/animals/${qr.animal.id}` : `/animals/qr`,
        });
      });

      return results;
    } catch {
      return [];
    }
  }

  async getSummary(period?: string, userId?: string) {
    const { farmIds } = await this.helpers.resolveAuthorizedFarms(userId);
    const animalFilter = this.helpers.buildAnimalFilter(farmIds, {});

    const totalAnimals = await this.prisma.animal.count({
      where: animalFilter,
    });
    const activeMilking = await this.prisma.animal.count({
      where: {
        ...animalFilter,
        status: AnimalStatus.ACTIVE,
        gender: AnimalGender.FEMALE,
      },
    });
    const quarantinedCount = await this.prisma.animal.count({
      where: { ...animalFilter, status: AnimalStatus.QUARANTINED },
    });
    const pregnantCount = await this.prisma.animal.count({
      where: {
        ...animalFilter,
        pregnancies: {
          some: { status: 'CONFIRMED' },
        },
      },
    });

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const yesterdayStart = new Date(todayStart.getTime() - 24 * 60 * 60 * 1000);
    const yesterdayEnd = new Date(todayEnd.getTime() - 24 * 60 * 60 * 1000);

    const [todayAgg, yesterdayAgg, activeAlertsCount, vaxTotal, vaxCompleted] =
      await Promise.all([
        this.prisma.milkProduction.aggregate({
          _sum: { quantityLiters: true },
          where: {
            productionDate: { gte: todayStart, lte: todayEnd },
            animal: animalFilter,
          },
        }),
        this.prisma.milkProduction.aggregate({
          _sum: { quantityLiters: true },
          where: {
            productionDate: { gte: yesterdayStart, lte: yesterdayEnd },
            animal: animalFilter,
          },
        }),
        this.prisma.healthRecord.count({
          where: {
            animal: animalFilter,
            healthStatus: { in: ['SICK', 'UNDER_TREATMENT', 'QUARANTINED'] },
          },
        }),
        this.prisma.vaccination.count({
          where: { animal: animalFilter },
        }),
        this.prisma.vaccination.count({
          where: { animal: animalFilter, status: 'COMPLETED' },
        }),
      ]);

    const totalMilkToday = Number(
      (todayAgg._sum.quantityLiters ?? 0).toFixed(1),
    );
    const totalMilkYesterday = Number(
      (yesterdayAgg._sum.quantityLiters ?? 0).toFixed(1),
    );

    const milkChangePercentage =
      totalMilkYesterday > 0
        ? Number(
            (
              ((totalMilkToday - totalMilkYesterday) / totalMilkYesterday) *
              100
            ).toFixed(1),
          )
        : 0;

    const vaccinationCoverageRate =
      vaxTotal > 0
        ? Number(((vaxCompleted / vaxTotal) * 100).toFixed(1))
        : 85.5;

    return {
      totalAnimals,
      activeMilkingAnimals: activeMilking,
      totalMilkToday,
      milkChangePercentage,
      activeAlertsCount,
      quarantinedCount,
      pregnantCount,
      vaccinationCoverageRate,
    };
  }

  async getMilkTrends(period: string = 'daily', userId?: string) {
    const { farmIds } = await this.helpers.resolveAuthorizedFarms(userId);
    const animalFilter = this.helpers.buildAnimalFilter(farmIds, {});

    const daysCount = period === 'weekly' ? 14 : period === 'monthly' ? 30 : 7;
    const now = new Date();
    const startDate = new Date(now.getTime() - daysCount * 24 * 60 * 60 * 1000);
    startDate.setHours(0, 0, 0, 0);

    const records = await this.prisma.milkProduction.findMany({
      where: {
        productionDate: { gte: startDate },
        animal: animalFilter,
      },
      orderBy: { productionDate: 'asc' },
    });

    const dayMap = new Map<
      string,
      { morning: number; evening: number; total: number }
    >();

    for (let i = daysCount - 1; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = d.toISOString().slice(0, 10);
      dayMap.set(dateStr, { morning: 0, evening: 0, total: 0 });
    }

    records.forEach((r) => {
      const dateStr = new Date(r.productionDate).toISOString().slice(0, 10);
      const entry = dayMap.get(dateStr) || { morning: 0, evening: 0, total: 0 };
      const liters = Number(r.quantityLiters);
      if (r.milkingSession === MilkingSession.MORNING) {
        entry.morning += liters;
      } else {
        entry.evening += liters;
      }
      entry.total += liters;
      dayMap.set(dateStr, entry);
    });

    return Array.from(dayMap.entries()).map(([date, data]) => ({
      date,
      morningYield: Number(data.morning.toFixed(1)),
      eveningYield: Number(data.evening.toFixed(1)),
      totalYield: Number(data.total.toFixed(1)),
      targetYield: 450,
    }));
  }

  async getAnimalStatusDistribution(userId?: string) {
    const { farmIds } = await this.helpers.resolveAuthorizedFarms(userId);
    const animalFilter = this.helpers.buildAnimalFilter(farmIds, {});

    const grouped = await this.prisma.animal.groupBy({
      by: ['status'],
      where: animalFilter,
      _count: { status: true },
    });

    const total = grouped.reduce((acc, curr) => acc + curr._count.status, 0);

    const statusColors: Record<string, string> = {
      ACTIVE: '#10B981',
      SOLD: '#6B7280',
      TRANSFERRED: '#8B5CF6',
      DECEASED: '#374151',
      MISSING: '#F59E0B',
      QUARANTINED: '#EF4444',
    };

    return grouped.map((g) => {
      const count = g._count.status;
      const pct = total > 0 ? Number(((count / total) * 100).toFixed(1)) : 0;
      return {
        status: g.status,
        label: g.status.charAt(0) + g.status.slice(1).toLowerCase(),
        count,
        percentage: pct,
        color: statusColors[g.status] || '#6366F1',
      };
    });
  }

  async quickAddAnimal(dto: QuickAddAnimalDto, userId?: string) {
    const { farmIds } = await this.helpers.resolveAuthorizedFarms(userId);
    const targetFarmId = farmIds[0];

    if (!targetFarmId) {
      throw new BadRequestException(
        'User is not associated with an active farm.',
      );
    }

    const farmIdToUse = targetFarmId;

    if (!farmIdToUse) {
      throw new BadRequestException(
        'No default farm available for animal creation.',
      );
    }

    const existing = await this.prisma.animal.findUnique({
      where: { animalNumber: dto.animalNumber },
    });

    if (existing) {
      throw new BadRequestException(
        `Animal tag #${dto.animalNumber} is already registered.`,
      );
    }

    const animal = await this.prisma.animal.create({
      data: {
        animalNumber: dto.animalNumber,
        species: 'CATTLE',
        name: dto.name || null,
        breed: dto.breed || 'Friesian Cross',
        gender: dto.gender || AnimalGender.FEMALE,
        status: AnimalStatus.ACTIVE,
        farmId: farmIdToUse,
        dateOfBirth: new Date(),
      },
    });

    return {
      success: true,
      message: `Animal #${animal.animalNumber} successfully registered!`,
      animal: {
        id: animal.id,
        animalNumber: animal.animalNumber,
        name: animal.name,
        breed: animal.breed,
        gender: animal.gender,
        status: animal.status,
        qrCode: {
          qrValue: `AITS-ANIMAL-${animal.id}`,
          qrImageUrl: `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=AITS-ANIMAL-${animal.id}`,
        },
      },
    };
  }
}
