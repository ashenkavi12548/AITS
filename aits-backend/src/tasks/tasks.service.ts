import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { Prisma, TaskStatus } from '@prisma/client';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

@Injectable()
export class TasksService {
  constructor(private prisma: PrismaService) {}

  async create(createTaskDto: CreateTaskDto, userId: string, farmId: string) {
    const targetFarmId = createTaskDto.farmId || farmId;

    // Validate assigned employee
    const employee = await this.prisma.farmUser.findFirst({
      where: {
        userId: createTaskDto.assignedToId,
        farmId: targetFarmId,
        status: 'ACTIVE',
      },
    });

    if (!employee) {
      throw new ForbiddenException(
        'Assigned employee is not an active member of this farm',
      );
    }

    // Validate animal if provided
    if (createTaskDto.animalId) {
      const animal = await this.prisma.animal.findFirst({
        where: {
          id: createTaskDto.animalId,
          farmId: targetFarmId,
        },
      });
      if (!animal) {
        throw new NotFoundException(
          'Related The requested animal could not be found. in this farm',
        );
      }
    }

    return this.prisma.task.create({
      data: {
        ...createTaskDto,
        farmId: targetFarmId,
        createdById: userId,
      },
    });
  }

  async findAll(farmId: string, userId?: string, status?: TaskStatus) {
    const where: Prisma.TaskWhereInput = { farmId, deletedAt: null };

    if (userId) {
      where.assignedToId = userId;
    }

    if (status) {
      where.status = status;
    }

    return this.prisma.task.findMany({
      where,
      orderBy: [{ dueDate: 'asc' }, { priority: 'desc' }],
      include: {
        assignedTo: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profileImageUrl: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        animal: {
          select: {
            id: true,
            animalNumber: true,
            name: true,
          },
        },
      },
    });
  }

  async findOne(id: string, farmId: string) {
    const task = await this.prisma.task.findFirst({
      where: { id, farmId, deletedAt: null },
      include: {
        assignedTo: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profileImageUrl: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        animal: {
          select: {
            id: true,
            animalNumber: true,
            name: true,
          },
        },
      },
    });

    if (!task) {
      throw new NotFoundException(`The specified task could not be found.`);
    }

    return task;
  }

  async update(
    id: string,
    updateTaskDto: UpdateTaskDto,
    farmId: string,
    userId: string,
  ) {
    const task = await this.findOne(id, farmId);

    // If task is being marked as completed, record who did it and when
    let completedData = {};
    if (updateTaskDto.status === 'COMPLETED' && task.status !== 'COMPLETED') {
      completedData = {
        completedAt: new Date(),
        completedById: userId,
      };
    } else if (
      updateTaskDto.status &&
      updateTaskDto.status !== 'COMPLETED' &&
      task.status === 'COMPLETED'
    ) {
      // If reverting from completed, remove completed details
      completedData = {
        completedAt: null,
        completedById: null,
      };
    }

    return this.prisma.task.update({
      where: { id },
      data: {
        ...updateTaskDto,
        ...completedData,
      },
    });
  }

  async remove(id: string, farmId: string) {
    await this.findOne(id, farmId);

    return this.prisma.task.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
