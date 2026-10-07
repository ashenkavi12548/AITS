import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsUUID,
  IsDateString,
} from 'class-validator';
import { TaskPriority, TaskCategory } from '@prisma/client';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTaskDto {
  @ApiProperty({ description: 'The title of the task' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({ description: 'Description of the task' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    enum: TaskPriority,
    description: 'Priority of the task',
    default: TaskPriority.NORMAL,
  })
  @IsEnum(TaskPriority)
  @IsOptional()
  priority?: TaskPriority;

  @ApiPropertyOptional({
    enum: TaskCategory,
    description: 'Category of the task',
    default: TaskCategory.GENERAL,
  })
  @IsEnum(TaskCategory)
  @IsOptional()
  category?: TaskCategory;

  @ApiProperty({ description: 'Due date of the task' })
  @IsDateString()
  @IsNotEmpty()
  dueDate: string;

  @ApiPropertyOptional({ description: 'Start date of the task' })
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiProperty({ description: 'The UUID of the user the task is assigned to' })
  @IsUUID()
  @IsNotEmpty()
  assignedToId: string;

  @ApiPropertyOptional({
    description: 'The UUID of the related animal (if any)',
  })
  @IsUUID()
  @IsOptional()
  animalId?: string;

  @ApiPropertyOptional({
    description:
      'The UUID of the farm (if needed, otherwise taken from context)',
  })
  @IsUUID()
  @IsOptional()
  farmId?: string;
}
