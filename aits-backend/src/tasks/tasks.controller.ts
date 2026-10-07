import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
} from '@nestjs/swagger';
import { TaskStatus } from '@prisma/client';

@ApiTags('tasks')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller(['api/v1/tasks', 'api/tasks'])
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  @Permissions('task:create')
  @ApiOperation({ summary: 'Create a new task' })
  create(
    @Body() createTaskDto: CreateTaskDto,
    @CurrentUser('id') userId: string,
  ) {
    // If farmId is not in DTO, we might need a default or expect it to be in DTO.
    // Ensure farmId is passed from frontend since it's required in TasksService
    return this.tasksService.create(
      createTaskDto,
      userId,
      createTaskDto.farmId || '',
    );
  }

  @Get()
  @Permissions('task:read')
  @ApiOperation({ summary: 'Get tasks' })
  @ApiQuery({ name: 'farmId', required: true })
  @ApiQuery({ name: 'userId', required: false })
  @ApiQuery({ name: 'status', required: false, enum: TaskStatus })
  findAll(
    @Query('farmId') farmId: string,
    @Query('userId') assignedUserId?: string,
    @Query('status') status?: TaskStatus,
  ) {
    return this.tasksService.findAll(farmId, assignedUserId, status);
  }

  @Get(':id')
  @Permissions('task:read')
  @ApiOperation({ summary: 'Get a specific task by ID' })
  @ApiQuery({ name: 'farmId', required: true })
  findOne(@Param('id') id: string, @Query('farmId') farmId: string) {
    return this.tasksService.findOne(id, farmId);
  }

  @Patch(':id')
  @Permissions('task:update')
  @ApiOperation({ summary: 'Update a task' })
  @ApiQuery({ name: 'farmId', required: true })
  update(
    @Param('id') id: string,
    @Body() updateTaskDto: UpdateTaskDto,
    @Query('farmId') farmId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.tasksService.update(id, updateTaskDto, farmId, userId);
  }

  @Delete(':id')
  @Permissions('task:delete')
  @ApiOperation({ summary: 'Delete a task' })
  @ApiQuery({ name: 'farmId', required: true })
  remove(@Param('id') id: string, @Query('farmId') farmId: string) {
    return this.tasksService.remove(id, farmId);
  }
}
