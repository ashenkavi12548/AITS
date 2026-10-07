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
import { BreedingService } from './breeding.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import {
  CreateBreedingDto,
  UpdateBreedingDto,
  BreedingQueryDto,
  CreatePregnancyCheckDto,
  PregnancyQueryDto,
  CreateCalvingDto,
  CalvingQueryDto,
} from './dto';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';

@ApiTags('Breeding & Reproduction Management')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller(['api/v1/breeding', 'api/breeding'])
export class BreedingController {
  constructor(private readonly breedingService: BreedingService) {}

  // ==========================================================================
  // DASHBOARD & ANALYTICS
  // ==========================================================================

  @Get('stats')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get breeding dashboard summary KPI statistics' })
  @ApiResponse({ status: 200, description: 'Summary statistics computed' })
  @Permissions('dashboard:view', 'breeding:read') // Typically dashboard/breeding specific
  async getBreedingSummary(
    @CurrentUser('id') userId: string,
    @Query('farmId') farmId?: string,
  ) {
    return this.breedingService.getBreedingSummary(userId, farmId);
  }

  @Get('analytics')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get breeding analytics payload for charts' })
  @ApiResponse({ status: 200, description: 'Analytics dataset generated' })
  @Permissions('breeding:read')
  async getAnalyticsData(@CurrentUser('id') userId: string) {
    return this.breedingService.getAnalyticsData(userId);
  }

  @Get('upcoming')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get upcoming breeding and pregnancy activities' })
  @ApiResponse({ status: 200, description: 'Upcoming activity timeline' })
  @Permissions('breeding:read')
  async getUpcomingActivities(@CurrentUser('id') userId: string) {
    return this.breedingService.getUpcomingActivities(userId);
  }

  // ==========================================================================
  // DROPDOWNS & INVENTORY
  // ==========================================================================

  @Get('options/females')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get eligible female cattle for breeding' })
  @Permissions('breeding:read')
  async getEligibleFemaleAnimals(
    @CurrentUser('id') userId: string,
    @Query('farmId') farmId?: string,
  ) {
    return this.breedingService.getEligibleFemaleAnimals(userId, farmId);
  }

  @Get('options/bulls')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get available sire bulls for natural breeding' })
  @Permissions('breeding:read')
  async getAvailableBulls(
    @CurrentUser('id') userId: string,
    @Query('farmId') farmId?: string,
  ) {
    return this.breedingService.getAvailableBulls(userId, farmId);
  }

  @Get('options/semen-straws')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get available semen straw inventory' })
  @Permissions('breeding:read')
  getSemenInventory() {
    return this.breedingService.getSemenInventory();
  }

  // ==========================================================================
  // PREGNANCY TRACKING SUB-ENDPOINTS
  // ==========================================================================

  @Get('pregnancies/stats')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get pregnancy tracking KPI statistics' })
  @Permissions('breeding:read')
  async getPregnancySummary(
    @CurrentUser('id') userId: string,
    @Query('farmId') farmId?: string,
  ) {
    return this.breedingService.getPregnancySummary(userId, farmId);
  }

  @Get('pregnancies')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List paginated pregnancy check records' })
  @Permissions('breeding:read')
  async getPregnancyChecks(
    @CurrentUser('id') userId: string,
    @Query() query: PregnancyQueryDto,
  ) {
    return this.breedingService.getPregnancyChecks(userId, query);
  }

  @Post('pregnancies')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Record a new pregnancy diagnosis check' })
  @Permissions('breeding:update')
  async createPregnancyCheck(
    @CurrentUser('id') userId: string,
    @Body() dto: CreatePregnancyCheckDto,
  ) {
    return this.breedingService.createPregnancyCheck(userId, dto);
  }

  // ==========================================================================
  // CALVING SUB-ENDPOINTS
  // ==========================================================================

  @Get('calvings/stats')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get calving management KPI statistics' })
  @Permissions('breeding:read')
  async getCalvingSummary(
    @CurrentUser('id') userId: string,
    @Query('farmId') farmId?: string,
  ) {
    return this.breedingService.getCalvingSummary(userId, farmId);
  }

  @Get('calvings')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List paginated calving records' })
  @Permissions('breeding:read')
  async getCalvingRecords(
    @CurrentUser('id') userId: string,
    @Query() query: CalvingQueryDto,
  ) {
    return this.breedingService.getCalvingRecords(userId, query);
  }

  @Post('calvings')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Record a new calving event' })
  @Permissions('breeding:update')
  async createCalvingRecord(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateCalvingDto,
  ) {
    return this.breedingService.createCalvingRecord(userId, dto);
  }

  // ==========================================================================
  // BREEDING SERVICES CRUD
  // ==========================================================================

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get breeding record by ID' })
  @ApiParam({ name: 'id', description: 'Breeding record UUID' })
  @Permissions('breeding:read')
  async getBreedingRecordById(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
  ) {
    return this.breedingService.getBreedingRecordById(userId, id);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List paginated breeding service records' })
  @Permissions('breeding:read')
  async getBreedingRecords(
    @CurrentUser('id') userId: string,
    @Query() query: BreedingQueryDto,
  ) {
    return this.breedingService.getBreedingRecords(userId, query);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Log a new breeding service (AI or Natural)' })
  @Permissions('breeding:create')
  async createBreedingRecord(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateBreedingDto,
  ) {
    return this.breedingService.createBreedingRecord(userId, dto);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update an existing breeding record' })
  @Permissions('breeding:update')
  async updateBreedingRecord(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateBreedingDto,
  ) {
    return this.breedingService.updateBreedingRecord(userId, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a breeding record' })
  @Permissions('breeding:delete')
  async deleteBreedingRecord(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
  ) {
    return this.breedingService.deleteBreedingRecord(userId, id);
  }
}
