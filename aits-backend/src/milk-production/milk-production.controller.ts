import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
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
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { MilkProductionService } from './milk-production.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import {
  CreateMilkProductionDto,
  UpdateMilkProductionDto,
  MilkProductionQueryDto,
  VoidMilkProductionDto,
} from './dto';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';

@ApiTags('Milk Production Tracking')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller(['api/v1/milk-production', 'api/milk-production'])
export class MilkProductionController {
  constructor(private readonly milkProductionService: MilkProductionService) {}

  @Get('stats')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get milk production summary KPIs',
    description:
      'Returns aggregate volume metrics for today, morning/evening session yields, animals milked, and comparative stats.',
  })
  @ApiResponse({ status: 200, description: 'Summary statistics computed' })
  @Permissions('dashboard:view', 'milk:read')
  async getSummaryStats(
    @CurrentUser('id') userId: string,
    @Query('farmId') farmId?: string,
  ) {
    return this.milkProductionService.getSummaryStats(userId, farmId);
  }

  @Get('analytics')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get milk production analytics payload for charts',
    description:
      'Provides daily yield trends over 7 days, session comparisons, top 5 producing animals, and farm distribution.',
  })
  @ApiResponse({ status: 200, description: 'Analytics data computed' })
  @Permissions('milk:read')
  async getAnalyticsData(
    @CurrentUser('id') userId: string,
    @Query('farmId') farmId?: string,
  ) {
    return this.milkProductionService.getAnalyticsData(userId, farmId);
  }

  @Get('farms')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get farm dropdown options accessible to user' })
  @Permissions('milk:read')
  async getFarms(@CurrentUser('id') userId: string) {
    return this.milkProductionService.getFarms(userId);
  }

  @Get('animals')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get animal dropdown options accessible to user' })
  @Permissions('milk:read')
  async getAnimals(
    @CurrentUser('id') userId: string,
    @Query('farmId') farmId?: string,
  ) {
    return this.milkProductionService.getAnimals(userId, farmId);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get milk production record by ID' })
  @ApiParam({ name: 'id', description: 'Milk production record UUID' })
  @ApiResponse({ status: 200, description: 'Milk production record details' })
  @ApiResponse({ status: 404, description: 'Record not found' })
  @Permissions('milk:read')
  async getRecordById(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
  ) {
    return this.milkProductionService.getRecordById(userId, id);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'List paginated milk production records',
    description:
      'Retrieves records with server-side filtering, text search, sorting, and pagination scoped to user authorization.',
  })
  @ApiResponse({
    status: 200,
    description: 'Paginated milk production records',
  })
  @Permissions('milk:read')
  async getRecords(
    @CurrentUser('id') userId: string,
    @Query() query: MilkProductionQueryDto,
  ) {
    return this.milkProductionService.getRecords(userId, query);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Log a new milk production yield',
    description:
      'Creates a new milk production record atomically linked to the authenticated user and target farm.',
  })
  @ApiResponse({ status: 201, description: 'Milk production record created' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 409, description: 'Duplicate record conflict' })
  @Permissions('milk:record')
  async createRecord(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateMilkProductionDto,
  ) {
    return this.milkProductionService.createRecord(userId, dto);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update an existing milk production record' })
  @ApiParam({ name: 'id', description: 'Milk production record UUID' })
  @ApiResponse({ status: 200, description: 'Record updated' })
  @ApiResponse({ status: 404, description: 'Record not found' })
  @Permissions('milk:update')
  async updateRecord(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateMilkProductionDto,
  ) {
    return this.milkProductionService.updateRecord(userId, id, dto);
  }

  @Post(':id/void')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Void a milk production record (non-destructive audit workflow)',
  })
  @ApiParam({ name: 'id', description: 'Milk production record UUID' })
  @ApiResponse({
    status: 200,
    description: 'Record successfully marked as voided',
  })
  @ApiResponse({
    status: 400,
    description: 'Record already voided or invalid reason',
  })
  @ApiResponse({ status: 404, description: 'Record not found' })
  @Permissions('milk:update')
  async voidRecord(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: VoidMilkProductionDto,
  ) {
    return this.milkProductionService.voidRecord(userId, id, dto.reason);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a milk production record permanently' })
  @ApiParam({ name: 'id', description: 'Milk production record UUID' })
  @ApiResponse({ status: 200, description: 'Record deleted successfully' })
  @ApiResponse({ status: 404, description: 'Record not found' })
  @Permissions('milk:delete-permanent')
  async deleteRecord(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
  ) {
    return this.milkProductionService.deleteRecordPermanent(userId, id);
  }
}
