import {
  Controller,
  Get,
  Post,
  Delete,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { TraceabilityService } from './traceability.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import {
  CreateDailyActivityDto,
  CreateFarmTransferDto,
  ConfirmArrivalDto,
  CancelTransferDto,
} from './dto';
import {
  DailyActivityType,
  ActivitySession,
  ActivityStatus,
  FarmTransferStatus,
  FarmTransferReason,
} from '@prisma/client';

@ApiTags('Livestock Traceability')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller(['api/v1/traceability', 'api/traceability'])
export class TraceabilityController {
  constructor(private readonly traceabilityService: TraceabilityService) {}

  // ─── Farms & Animals ─────────────────────────────────────────────────────

  @Get('farms')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get active farms accessible to the current user' })
  @Permissions('traceability:read')
  async getActiveFarms(@CurrentUser('id') userId: string) {
    return this.traceabilityService.getActiveFarms(userId);
  }

  @Get('animals')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get eligible animals for traceability activities' })
  @ApiQuery({ name: 'farmId', required: false })
  @Permissions('traceability:read')
  async getEligibleAnimals(
    @CurrentUser('id') userId: string,
    @Query('farmId') farmId?: string,
  ) {
    return this.traceabilityService.getEligibleAnimals(userId, farmId);
  }

  // ─── Overview ─────────────────────────────────────────────────────────────

  @Get('overview')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get traceability KPI stats for the overview dashboard',
  })
  @ApiQuery({ name: 'farmId', required: false })
  @ApiQuery({
    name: 'date',
    required: false,
    description: 'YYYY-MM-DD date for daily stats',
  })
  @Permissions('dashboard:view', 'traceability:read')
  async getTraceabilityOverview(
    @CurrentUser('id') userId: string,
    @Query('farmId') farmId?: string,
    @Query('date') date?: string,
  ) {
    return this.traceabilityService.getTraceabilityOverview(
      userId,
      farmId,
      date,
    );
  }

  // ─── Daily Activities ────────────────────────────────────────────────────

  @Get('daily-activities')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'List daily activity logs with filters and pagination',
  })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'farmId', required: false })
  @Permissions('traceability:read')
  @ApiQuery({ name: 'animalId', required: false })
  @ApiQuery({ name: 'activityType', required: false })
  @ApiQuery({ name: 'session', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  @ApiQuery({ name: 'sortBy', required: false })
  @ApiQuery({ name: 'sortOrder', required: false })
  async getDailyActivities(
    @CurrentUser('id') userId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('farmId') farmId?: string,
    @Query('animalId') animalId?: string,
    @Query('activityType') activityType?: string,
    @Query('session') session?: string,
    @Query('status') status?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: string,
  ) {
    return this.traceabilityService.getDailyActivities(userId, {
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 10,
      search,
      farmId,
      animalId,
      activityType: activityType as DailyActivityType | 'ALL' | undefined,
      session: session as ActivitySession | 'ALL' | undefined,
      status: status as ActivityStatus | 'ALL' | undefined,
      startDate,
      endDate,
      sortBy,
      sortOrder: (sortOrder as 'asc' | 'desc') ?? 'desc',
    });
  }

  @Post('daily-activities')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new daily activity log' })
  @Permissions('traceability:record')
  async createDailyActivity(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateDailyActivityDto,
  ) {
    return this.traceabilityService.createDailyActivity(userId, dto);
  }

  @Delete('daily-activities/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Soft-delete a daily activity log' })
  @ApiParam({ name: 'id', description: 'Daily activity log UUID' })
  @Permissions('traceability:record')
  async deleteDailyActivity(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
  ) {
    return this.traceabilityService.deleteDailyActivity(userId, id);
  }

  // ─── Farm Transfers ──────────────────────────────────────────────────────

  @Get('farm-transfers')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'List farm transfer records with filters and pagination',
  })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'fromFarmId', required: false })
  @ApiQuery({ name: 'toFarmId', required: false })
  @ApiQuery({ name: 'animalId', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'reason', required: false })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  @Permissions('traceability:read')
  async getFarmTransfers(
    @CurrentUser('id') userId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('fromFarmId') fromFarmId?: string,
    @Query('toFarmId') toFarmId?: string,
    @Query('animalId') animalId?: string,
    @Query('status') status?: string,
    @Query('reason') reason?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.traceabilityService.getFarmTransfers(userId, {
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 10,
      search,
      fromFarmId,
      toFarmId,
      animalId,
      status: status as FarmTransferStatus | 'ALL' | undefined,
      reason: reason as FarmTransferReason | 'ALL' | undefined,
      startDate,
      endDate,
    });
  }

  @Post('farm-transfers')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Record a new farm-to-farm animal movement' })
  @Permissions('traceability:record')
  async createFarmTransfer(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateFarmTransferDto,
  ) {
    return this.traceabilityService.createFarmTransfer(userId, dto);
  }

  @Patch('farm-transfers/:id/in-transit')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark a farm transfer as IN_TRANSIT' })
  @ApiParam({ name: 'id', description: 'Farm transfer UUID' })
  @Permissions('traceability:record')
  async markInTransit(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
  ) {
    return this.traceabilityService.markInTransit(userId, id);
  }

  @Patch('farm-transfers/:id/confirm-arrival')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Confirm animal arrival at destination farm' })
  @ApiParam({ name: 'id', description: 'Farm transfer UUID' })
  @Permissions('traceability:record')
  async confirmArrival(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: ConfirmArrivalDto,
  ) {
    return this.traceabilityService.confirmArrival(userId, id, dto);
  }

  @Patch('farm-transfers/:id/complete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Complete a farm transfer (updates animal farm assignment)',
  })
  @ApiParam({ name: 'id', description: 'Farm transfer UUID' })
  @Permissions('traceability:record')
  async completeTransfer(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
  ) {
    return this.traceabilityService.completeTransfer(userId, id);
  }

  @Patch('farm-transfers/:id/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel a farm transfer' })
  @ApiParam({ name: 'id', description: 'Farm transfer UUID' })
  @Permissions('traceability:record')
  async cancelTransfer(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: CancelTransferDto,
  ) {
    return this.traceabilityService.cancelTransfer(userId, id, dto);
  }

  // ─── Lifetime Trace ──────────────────────────────────────────────────────

  @Get('lifetime/:animalId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get aggregated lifetime event timeline for an animal',
  })
  @ApiParam({ name: 'animalId', description: 'Animal UUID' })
  @ApiQuery({ name: 'category', required: false })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  @ApiQuery({ name: 'sortOrder', required: false })
  @Permissions('traceability:read')
  async getAnimalLifetimeTrace(
    @CurrentUser('id') userId: string,
    @Param('animalId') animalId: string,
    @Query('category') category?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('sortOrder') sortOrder?: string,
  ) {
    return this.traceabilityService.getAnimalLifetimeTrace(userId, animalId, {
      category,
      startDate,
      endDate,
      sortOrder: (sortOrder as 'newest' | 'oldest') ?? 'newest',
    });
  }
}
