import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { DashboardHelpersService } from './dashboard-helpers.service';
import { NotificationsService } from '../../notifications/notifications.service';
import { MailService } from '../../mail/mail.service';
import {
  Animal,
  VaccinationStatus,
  TreatmentStatus,
  NotificationType,
  NotificationPriority,
  PregnancyStatus,
  QuarantineStatus,
} from '@prisma/client';
import {
  ScheduleEventType,
  CreateScheduleEventDto,
  UpdateCalendarEventDto,
} from '../dto/create-schedule-event.dto';
import { CalendarQueryDto, CalendarEventDto } from '../dto/calendar.dto';
import { Prisma } from '@prisma/client';

type CalendarEventWithAnimal = Prisma.CalendarEventGetPayload<{
  include: { animal: { select: { id: true; animalNumber: true; name: true } } };
}>;
type VaccinationWithAnimal = Prisma.VaccinationGetPayload<{
  include: { animal: { select: { id: true; animalNumber: true; name: true } } };
}>;
type TreatmentWithAnimal = Prisma.TreatmentGetPayload<{
  include: { animal: { select: { id: true; animalNumber: true; name: true } } };
}>;
type PregnancyWithAnimal = Prisma.PregnancyGetPayload<{
  include: { animal: { select: { id: true; animalNumber: true; name: true } } };
}>;
type VetVisitWithAnimal = Prisma.VeterinaryVisitGetPayload<{
  include: { animal: { select: { id: true; animalNumber: true; name: true } } };
}>;

@Injectable()
export class DashboardCalendarService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly helpers: DashboardHelpersService,
    private readonly notificationsService: NotificationsService,
    private readonly mailService: MailService,
  ) {}

  async createScheduleEvent(dto: CreateScheduleEventDto, userId?: string) {
    const parsedDate = new Date(dto.scheduledDate);
    if (isNaN(parsedDate.getTime())) {
      throw new BadRequestException('Invalid scheduled date provided.');
    }

    const { farmIds } = await this.helpers.resolveAuthorizedFarms(userId);
    if (!farmIds || farmIds.length === 0) {
      throw new ForbiddenException('You do not have access to any farms.');
    }

    let animal: Animal | null = null;
    let targetFarmId: string | null = null;

    if (dto.animalTag) {
      animal = await this.prisma.animal.findFirst({
        where: {
          OR: [{ animalNumber: dto.animalTag }, { id: dto.animalTag }],
          deletedAt: null,
        },
      });

      if (!animal) {
        throw new NotFoundException(
          `Animal with tag "${dto.animalTag}" not found.`,
        );
      }

      if (!farmIds.includes(animal.farmId)) {
        throw new ForbiddenException(
          'You do not have permission to access this animal.',
        );
      }
      targetFarmId = animal.farmId;
    } else {
      if (dto.farmId) {
        if (!farmIds.includes(dto.farmId)) {
          throw new ForbiddenException(
            'You do not have permission to access this farm.',
          );
        }
        targetFarmId = dto.farmId;
      } else {
        if (farmIds.length === 1) {
          targetFarmId = farmIds[0];
        } else {
          throw new BadRequestException(
            'A valid farm ID is required when you manage multiple farms and no animal is specified.',
          );
        }
      }
    }

    let createdId = `evt-${Date.now()}`;
    const safeUserId = userId || targetFarmId; // fallback for system

    if (
      dto.eventType === ScheduleEventType.VACCINATION &&
      safeUserId &&
      animal
    ) {
      const vac = await this.prisma.vaccination.create({
        data: {
          animalId: animal.id,
          administeredById: safeUserId,
          vaccineName: dto.vaccineName || dto.title,
          dose: dto.dose || 'Standard',
          vaccinationDate: parsedDate,
          nextDueDate: parsedDate,
          notes: dto.notes || dto.instructions,
          status: VaccinationStatus.SCHEDULED,
        },
      });
      createdId = vac.id;
    } else if (
      dto.eventType === ScheduleEventType.TREATMENT &&
      safeUserId &&
      animal
    ) {
      const trt = await this.prisma.treatment.create({
        data: {
          animalId: animal.id,
          veterinarianId: safeUserId,
          treatmentName: dto.title,
          startDate: parsedDate,
          status: TreatmentStatus.IN_PROGRESS,
          instructions: dto.instructions || dto.notes,
        },
      });
      createdId = trt.id;
    } else if (
      dto.eventType === ScheduleEventType.VET_VISIT &&
      safeUserId &&
      animal
    ) {
      const visit = await this.prisma.veterinaryVisit.create({
        data: {
          animalId: animal.id,
          veterinarianId: safeUserId,
          visitDate: parsedDate,
          reason: dto.title,
          notes: dto.notes || dto.instructions,
        },
      });
      createdId = visit.id;
    } else {
      // CUSTOM or CALVING without a direct pregnancy link will use CalendarEvent
      const event = await this.prisma.calendarEvent.create({
        data: {
          farmId: targetFarmId,
          title: dto.title,
          description: dto.description || dto.notes || null,
          date: parsedDate,
          startTime: dto.startTime || null,
          endTime: dto.endTime || null,
          isAllDay: dto.isAllDay ?? true,
          color: dto.color || '#3B82F6',
          category: dto.eventType,
          animalId: animal?.id || null,
          createdById: safeUserId,
        },
      });
      createdId = event.id;
    }

    if (targetFarmId) {
      const notificationTitle =
        dto.eventType === ScheduleEventType.VACCINATION
          ? 'Vaccination Due Reminder'
          : `${dto.title} Scheduled`;

      const notificationMessage = `${dto.vaccineName || dto.title} scheduled${animal ? ` for ${animal.animalNumber}` : ''}`;
      const notifType =
        dto.eventType === ScheduleEventType.VACCINATION
          ? NotificationType.VACCINATION
          : NotificationType.HEALTH;

      void this.notificationsService
        .notifyFarmUsers(targetFarmId, {
          title: notificationTitle,
          message: notificationMessage,
          notificationType: notifType,
          category: notifType,
          priority: NotificationPriority.HIGH,
          referenceType: 'Animal',
          referenceId: animal?.id || targetFarmId,
          actionUrl: animal
            ? `/animals/${animal.id}/health`
            : '/dashboard/calendar',
          dedupKey: `schedule:${createdId}`,
        })
        .catch((err: unknown) => {
          console.error('Notification dispatch failed', err);
        });
    }

    if (dto.sendEmail && userId) {
      try {
        const user = await this.prisma.user.findUnique({
          where: { id: userId },
        });
        if (user?.email) {
          await this.mailService.sendScheduleAlertEmail({
            to: user.email,
            recipientName: user.firstName,
            eventTitle: dto.title,
            eventType: dto.eventType,
            animalNumber: animal?.animalNumber || 'N/A',
            scheduledDate: parsedDate.toISOString(),
            notes: dto.notes,
          });
        }
      } catch (error: unknown) {
        console.error('Mail delivery fallback triggered', error);
      }
    }

    return {
      success: true,
      message: `Event "${dto.title}" successfully scheduled${animal ? ` for animal #${animal.animalNumber}` : ''}`,
      eventId: createdId,
      scheduledDate: parsedDate.toISOString(),
    };
  }

  async completeScheduleItem(prefixedId: string, userId?: string) {
    const { farmIds } = await this.helpers.resolveAuthorizedFarms(userId);
    if (!farmIds || farmIds.length === 0) {
      throw new ForbiddenException('You do not have access to any farms.');
    }

    const farmFilter =
      farmIds.length > 0 ? { animal: { farmId: { in: farmIds } } } : {};

    try {
      if (
        prefixedId.startsWith('vac_sched_') ||
        prefixedId.startsWith('vac_boost_')
      ) {
        const id = prefixedId
          .replace('vac_sched_', '')
          .replace('vac_boost_', '');
        await this.prisma.vaccination.updateMany({
          where: { id, ...farmFilter },
          data: { status: VaccinationStatus.COMPLETED },
        });
      } else if (prefixedId.startsWith('trt_')) {
        const id = prefixedId.replace('trt_', '');
        await this.prisma.treatment.updateMany({
          where: { id, ...farmFilter },
          data: { status: TreatmentStatus.COMPLETED },
        });
      } else if (
        prefixedId.startsWith('custom_') ||
        prefixedId.startsWith('vet_') ||
        prefixedId.startsWith('prg_')
      ) {
        throw new BadRequestException(
          'This type of event cannot be marked as completed directly via the calendar.',
        );
      } else {
        // Fallback for raw IDs if passed directly
        await this.prisma.vaccination.updateMany({
          where: { id: prefixedId, ...farmFilter },
          data: { status: VaccinationStatus.COMPLETED },
        });
      }
    } catch (error: unknown) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      console.error('Failed to complete schedule item', error);
      throw new BadRequestException('Failed to process completion request.');
    }

    return {
      success: true,
      message: `Scheduled event marked as completed`,
      completedAt: new Date().toISOString(),
    };
  }

  async getCalendarEvents(query: CalendarQueryDto, userId?: string) {
    const { farmIds } = await this.helpers.resolveAuthorizedFarms(userId);
    const animalFilter = this.helpers.buildAnimalFilter(farmIds, {});

    const start = query.startDate ? new Date(query.startDate) : undefined;
    const end = query.endDate ? new Date(query.endDate) : undefined;

    const dateFilter = start && end ? { gte: start, lte: end } : undefined;

    const onlyCustom = query.filter === 'custom';
    const onlySystem = query.filter === 'system';

    const events: CalendarEventDto[] = [];

    // ── System events (skip if filter=custom) ──
    if (!onlyCustom) {
      // 1. Vaccinations
      const vaccinations: VaccinationWithAnimal[] =
        await this.prisma.vaccination.findMany({
          where: {
            animal: animalFilter,
            ...(dateFilter
              ? {
                  OR: [
                    { nextDueDate: dateFilter },
                    { vaccinationDate: dateFilter },
                  ],
                }
              : {}),
          },
          include: {
            animal: { select: { id: true, animalNumber: true, name: true } },
          },
        });

      vaccinations.forEach((v) => {
        if (
          new Date(v.vaccinationDate).getTime() > new Date().getTime() ||
          v.status === VaccinationStatus.SCHEDULED
        ) {
          events.push({
            id: `vac_sched_${v.id}`,
            title: `💉 ${v.vaccineName}`,
            start: v.vaccinationDate.toISOString().split('T')[0],
            allDay: true,
            type: 'VACCINATION',
            color: '#3B82F6',
            animalId: v.animal.id,
            animalNumber: v.animal.animalNumber,
            description: v.notes || undefined,
            source: 'VACCINATION',
            sourceId: v.id,
          });
        }
      });

      // 2. Treatments
      const treatments: TreatmentWithAnimal[] =
        await this.prisma.treatment.findMany({
          where: {
            animal: animalFilter,
            ...(dateFilter
              ? { startDate: dateFilter }
              : { status: TreatmentStatus.IN_PROGRESS }),
          },
          include: {
            animal: { select: { id: true, animalNumber: true, name: true } },
          },
        });

      treatments.forEach((t) => {
        events.push({
          id: `trt_${t.id}`,
          title: `🩺 ${t.animal.animalNumber}`,
          start: t.startDate.toISOString().split('T')[0],
          allDay: true,
          type: 'TREATMENT',
          color: '#EF4444',
          animalId: t.animal.id,
          animalNumber: t.animal.animalNumber,
          description: t.instructions || undefined,
          source: 'TREATMENT',
          sourceId: t.id,
        });
      });

      // 3. Calvings
      const pregnancies: PregnancyWithAnimal[] =
        await this.prisma.pregnancy.findMany({
          where: {
            animal: animalFilter,
            status: PregnancyStatus.CONFIRMED,
            expectedCalvingDate: dateFilter || undefined,
          },
          include: {
            animal: { select: { id: true, animalNumber: true, name: true } },
          },
        });

      pregnancies.forEach((p) => {
        if (p.expectedCalvingDate) {
          events.push({
            id: `prg_${p.id}`,
            title: `🐄 Expected Calving`,
            start: p.expectedCalvingDate.toISOString().split('T')[0],
            allDay: true,
            type: 'CALVING',
            color: '#EC4899',
            animalId: p.animal.id,
            animalNumber: p.animal.animalNumber,
            description: p.notes || undefined,
            source: 'PREGNANCY',
            sourceId: p.id,
          });
        }
      });

      // 4. Vet Visits
      const vetVisits: VetVisitWithAnimal[] =
        await this.prisma.veterinaryVisit.findMany({
          where: {
            animal: animalFilter,
            visitDate: dateFilter || undefined,
          },
          include: {
            animal: { select: { id: true, animalNumber: true, name: true } },
          },
        });

      vetVisits.forEach((v) => {
        events.push({
          id: `vet_${v.id}`,
          title: `🩺 Vet: ${v.reason}`,
          start: v.visitDate.toISOString().split('T')[0],
          allDay: true,
          type: 'VET_VISIT',
          color: '#F59E0B',
          animalId: v.animal.id,
          animalNumber: v.animal.animalNumber,
          description: v.findings || undefined,
          source: 'VETERINARY_VISIT',
          sourceId: v.id,
        });
      });

      // 5. Quarantine Releases
      const quarantines = await this.prisma.quarantineRecord.findMany({
        where: {
          animal: animalFilter,
          status: QuarantineStatus.ACTIVE,
          expectedRelease: dateFilter || undefined,
        },
        include: {
          animal: { select: { id: true, animalNumber: true, name: true } },
        },
      });

      quarantines.forEach((q) => {
        events.push({
          id: `qtn_${q.id}`,
          title: `🛑 Release: ${q.animal.animalNumber}`,
          start: q.expectedRelease.toISOString().split('T')[0],
          allDay: true,
          type: 'QUARANTINE',
          color: '#DC2626',
          animalId: q.animalId,
          animalNumber: q.animal.animalNumber,
          description: `Quarantine Release: ${q.reason}`,
          source: 'QUARANTINE',
          sourceId: q.id,
        });
      });
    }

    // ── Custom events (skip if filter=system) ──
    if (!onlySystem) {
      const customEvents: CalendarEventWithAnimal[] =
        await this.prisma.calendarEvent.findMany({
          where: {
            farmId: { in: farmIds },
            ...(dateFilter ? { date: dateFilter } : {}),
          },
          include: {
            animal: { select: { id: true, animalNumber: true, name: true } },
          },
        });

      customEvents.forEach((c) => {
        const dateStr = c.date.toISOString().split('T')[0];
        let startISO = dateStr;
        let endISO: string | undefined;

        if (!c.isAllDay && c.startTime) {
          startISO = `${dateStr}T${c.startTime}:00.000Z`;
          if (c.endTime) {
            endISO = `${dateStr}T${c.endTime}:00.000Z`;
          }
        }

        events.push({
          id: `custom_${c.id}`,
          title: c.title,
          start: startISO,
          end: endISO,
          allDay: c.isAllDay,
          type: 'CUSTOM',
          color: c.color || '#6B7280',
          animalId: c.animalId || undefined,
          animalNumber: c.animal?.animalNumber,
          farmId: c.farmId,
          description: c.description || undefined,
          source: 'CUSTOM',
          sourceId: c.id,
        });
      });
    }

    events.sort((a, b) => {
      const timeA = new Date(a.start).getTime();
      const timeB = new Date(b.start).getTime();
      if (isNaN(timeA) && isNaN(timeB)) return 0;
      if (isNaN(timeA)) return 1;
      if (isNaN(timeB)) return -1;
      return timeA - timeB;
    });

    return events;
  }

  async getUpcomingEvents(userId?: string) {
    const { farmIds } = await this.helpers.resolveAuthorizedFarms(userId);
    const animalFilter = this.helpers.buildAnimalFilter(farmIds, {});

    const upcomingVaccinations: VaccinationWithAnimal[] =
      await this.prisma.vaccination.findMany({
        where: {
          animal: animalFilter,
          status: VaccinationStatus.SCHEDULED,
        },
        take: 10,
        orderBy: { nextDueDate: 'asc' },
        include: {
          animal: { select: { id: true, animalNumber: true, name: true } },
        },
      });

    return upcomingVaccinations.map((v) => ({
      id: v.id,
      title: `${v.vaccineName} Booster`,
      animalId: v.animal.id,
      animalNumber: v.animal.animalNumber,
      eventType: 'VACCINATION',
      scheduledDate: (v.nextDueDate || v.vaccinationDate).toISOString(),
      priority: 'MEDIUM' as const,
      notes: v.notes || undefined,
      completed: v.status === VaccinationStatus.COMPLETED,
    }));
  }

  async updateCalendarEvent(
    id: string,
    dto: UpdateCalendarEventDto,
    userId?: string,
  ) {
    const { farmIds } = await this.helpers.resolveAuthorizedFarms(userId);

    const existing: Prisma.CalendarEventGetPayload<object> | null =
      await this.prisma.calendarEvent.findUnique({
        where: { id },
      });

    if (!existing) {
      throw new NotFoundException(`Calendar event not found.`);
    }

    if (!farmIds.includes(existing.farmId)) {
      throw new ForbiddenException(
        'You do not have permission to modify this event.',
      );
    }

    // Resolve animal if changing
    let animalId = existing.animalId;
    if (dto.animalTag !== undefined) {
      if (dto.animalTag) {
        const animal = await this.prisma.animal.findFirst({
          where: {
            OR: [{ animalNumber: dto.animalTag }, { id: dto.animalTag }],
            deletedAt: null,
          },
        });
        if (!animal) {
          throw new NotFoundException(
            `Animal with tag "${dto.animalTag}" not found.`,
          );
        }
        if (!farmIds.includes(animal.farmId)) {
          throw new ForbiddenException(
            'You do not have permission to access this animal.',
          );
        }
        animalId = animal.id;
      } else {
        animalId = null;
      }
    }

    const updated: Prisma.CalendarEventGetPayload<object> =
      await this.prisma.calendarEvent.update({
        where: { id },
        data: {
          ...(dto.title !== undefined && { title: dto.title }),
          ...(dto.description !== undefined && {
            description: dto.description,
          }),
          ...(dto.scheduledDate !== undefined && {
            date: new Date(dto.scheduledDate),
          }),
          ...(dto.startTime !== undefined && { startTime: dto.startTime }),
          ...(dto.endTime !== undefined && { endTime: dto.endTime }),
          ...(dto.isAllDay !== undefined && { isAllDay: dto.isAllDay }),
          ...(dto.color !== undefined && { color: dto.color }),
          ...(dto.notes !== undefined && { description: dto.notes }),
          animalId,
        },
      });

    return {
      success: true,
      message: 'Calendar event updated.',
      event: updated,
    };
  }

  async deleteCalendarEvent(id: string, userId?: string) {
    const { farmIds } = await this.helpers.resolveAuthorizedFarms(userId);

    const existing: Prisma.CalendarEventGetPayload<object> | null =
      await this.prisma.calendarEvent.findUnique({
        where: { id },
      });

    if (!existing) {
      throw new NotFoundException(`Calendar event not found.`);
    }

    if (!farmIds.includes(existing.farmId)) {
      throw new ForbiddenException(
        'You do not have permission to delete this event.',
      );
    }

    await this.prisma.calendarEvent.delete({ where: { id } });

    return {
      success: true,
      message: 'Calendar event deleted.',
    };
  }
}
