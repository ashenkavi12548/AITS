import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  Ip,
  Headers,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { FarmsService } from './farms.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import {
  CreateFarmDto,
  UpdateFarmDto,
  FarmQueryDto,
  CreateEmployeeDto,
  UpdateEmployeeDto,
  EmployeeQueryDto,
  ResetEmployeePasswordDto,
  TransferOwnershipDto,
} from './dto';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';

@ApiTags('Farms & Staff Management')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller(['api/v1/farms', 'api/farms'])
export class FarmsController {
  constructor(private readonly farmsService: FarmsService) {}

  @Get('my-farm')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get current user primary farm facility',
    description:
      'Retrieves the primary farm facility owned by or associated with the authenticated user with real-time counters.',
  })
  @ApiResponse({ status: 200, description: 'Farm facility found' })
  @ApiResponse({ status: 404, description: 'No farm facility registered yet' })
  async getMyFarm(@CurrentUser('id') userId: string) {
    return this.farmsService.getMyFarm(userId);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'List farm facilities',
    description:
      'Retrieves paginated farm facilities accessible to the authenticated user with filtering and search.',
  })
  @ApiResponse({ status: 200, description: 'Paginated farm list' })
  async getFarms(
    @CurrentUser('id') userId: string,
    @Query() query: FarmQueryDto,
  ) {
    return this.farmsService.getFarms(userId, query);
  }

  @Get('search')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Search all registered farm facilities',
    description:
      'Retrieves a list of all farms for autocomplete purposes (e.g. transfers, clearances).',
  })
  @ApiResponse({ status: 200, description: 'List of matching farms' })
  async searchAllFarms(@Query('q') query?: string) {
    return this.farmsService.searchAllFarms(query);
  }

  @Get(':farmId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get farm facility details by ID' })
  @ApiParam({ name: 'farmId', description: 'Farm facility UUID' })
  @ApiResponse({ status: 200, description: 'Farm facility details' })
  @ApiResponse({ status: 404, description: 'Farm not found' })
  @Permissions('farm:read')
  async getFarmById(
    @CurrentUser('id') userId: string,
    @Param('farmId') farmId: string,
  ) {
    return this.farmsService.getFarmById(userId, farmId);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Register a new farm facility',
    description:
      'Creates a new farm facility and links the authenticated user as the OWNER atomically.',
  })
  @ApiResponse({ status: 201, description: 'Farm facility registered' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @Permissions('farm:create')
  async createFarm(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateFarmDto,
    @Ip() ipAddress: string,
    @Headers('user-agent') userAgent?: string,
  ) {
    return this.farmsService.createFarm(userId, dto, { ipAddress, userAgent });
  }

  @Patch(':farmId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update farm facility information (PATCH)' })
  @ApiParam({ name: 'farmId', description: 'Farm facility UUID' })
  @ApiResponse({ status: 200, description: 'Farm facility updated' })
  @Permissions('farm:update')
  async updateFarmPatch(
    @CurrentUser('id') userId: string,
    @Param('farmId') farmId: string,
    @Body() dto: UpdateFarmDto,
    @Ip() ipAddress: string,
    @Headers('user-agent') userAgent?: string,
  ) {
    return this.farmsService.updateFarm(userId, farmId, dto, {
      ipAddress,
      userAgent,
    });
  }

  @Put(':farmId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update farm facility information (PUT)' })
  @ApiParam({ name: 'farmId', description: 'Farm facility UUID' })
  @Permissions('farm:update')
  async updateFarmPut(
    @CurrentUser('id') userId: string,
    @Param('farmId') farmId: string,
    @Body() dto: UpdateFarmDto,
    @Ip() ipAddress: string,
    @Headers('user-agent') userAgent?: string,
  ) {
    return this.farmsService.updateFarm(userId, farmId, dto, {
      ipAddress,
      userAgent,
    });
  }

  @Delete(':farmId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Deactivate farm facility',
    description:
      'Soft-deactivates the farm facility while preserving all animal traceability and historical records.',
  })
  @Permissions('farm:delete')
  async deactivateFarm(
    @CurrentUser('id') userId: string,
    @Param('farmId') farmId: string,
    @Ip() ipAddress: string,
    @Headers('user-agent') userAgent?: string,
  ) {
    return this.farmsService.deactivateFarm(userId, farmId, {
      ipAddress,
      userAgent,
    });
  }

  @Get(':farmId/employees')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List all employees/workers for a farm facility' })
  @ApiParam({ name: 'farmId', description: 'Farm facility UUID' })
  @Permissions('farm_member:read')
  async getFarmEmployees(
    @CurrentUser('id') userId: string,
    @Param('farmId') farmId: string,
    @Query() query: EmployeeQueryDto,
  ) {
    return this.farmsService.getFarmEmployees(userId, farmId, query);
  }

  @Post(':farmId/employees')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Add a new employee / worker to the farm facility',
    description:
      'Creates credentials, farm membership, and permissions for a farm worker.',
  })
  @Permissions('farm_member:manage')
  async createFarmEmployee(
    @CurrentUser('id') userId: string,
    @Param('farmId') farmId: string,
    @Body() dto: CreateEmployeeDto,
    @Ip() ipAddress: string,
    @Headers('user-agent') userAgent?: string,
  ) {
    return this.farmsService.createFarmEmployee(userId, farmId, dto, {
      ipAddress,
      userAgent,
    });
  }

  @Patch(':farmId/employees/:employeeId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update employee role, status, or details (PATCH)' })
  @Permissions('farm_member:manage')
  async updateFarmEmployeePatch(
    @CurrentUser('id') userId: string,
    @Param('farmId') farmId: string,
    @Param('employeeId') employeeId: string,
    @Body() dto: UpdateEmployeeDto,
    @Ip() ipAddress: string,
    @Headers('user-agent') userAgent?: string,
  ) {
    return this.farmsService.updateFarmEmployee(
      userId,
      farmId,
      employeeId,
      dto,
      { ipAddress, userAgent },
    );
  }

  @Put(':farmId/employees/:employeeId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update employee role, status, or details (PUT)' })
  @Permissions('farm_member:manage')
  async updateFarmEmployeePut(
    @CurrentUser('id') userId: string,
    @Param('farmId') farmId: string,
    @Param('employeeId') employeeId: string,
    @Body() dto: UpdateEmployeeDto,
    @Ip() ipAddress: string,
    @Headers('user-agent') userAgent?: string,
  ) {
    return this.farmsService.updateFarmEmployee(
      userId,
      farmId,
      employeeId,
      dto,
      { ipAddress, userAgent },
    );
  }

  @Post(':farmId/employees/:employeeId/reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Reset employee password by farm owner or manager',
  })
  @Permissions('farm_member:manage')
  async resetEmployeePassword(
    @CurrentUser('id') userId: string,
    @Param('farmId') farmId: string,
    @Param('employeeId') employeeId: string,
    @Body() dto: ResetEmployeePasswordDto,
    @Ip() ipAddress: string,
    @Headers('user-agent') userAgent?: string,
  ) {
    return this.farmsService.resetEmployeePassword(
      userId,
      farmId,
      employeeId,
      dto.newPassword,
      { ipAddress, userAgent },
    );
  }

  @Delete(':farmId/employees/:employeeId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Remove employee membership from farm facility',
    description:
      'Removes the user association from the farm without deleting the global user account.',
  })
  async removeFarmEmployee(
    @CurrentUser('id') userId: string,
    @Param('farmId') farmId: string,
    @Param('employeeId') employeeId: string,
    @Ip() ipAddress: string,
    @Headers('user-agent') userAgent?: string,
  ) {
    return this.farmsService.removeFarmEmployee(userId, farmId, employeeId, {
      ipAddress,
      userAgent,
    });
  }

  @Post(':farmId/transfer-ownership')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Transfer farm facility ownership',
    description:
      'Safely and transactionally transfers farm ownership to another verified user.',
  })
  async transferFarmOwnership(
    @CurrentUser('id') userId: string,
    @Param('farmId') farmId: string,
    @Body() dto: TransferOwnershipDto,
    @Ip() ipAddress: string,
    @Headers('user-agent') userAgent?: string,
  ) {
    return this.farmsService.transferFarmOwnership(userId, farmId, dto, {
      ipAddress,
      userAgent,
    });
  }

  @Get(':farmId/stats')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get comprehensive live farm statistics',
    description:
      'Returns database-aggregated counts of animals by status, gender, staff by role, and total milk yield.',
  })
  async getFarmStats(
    @CurrentUser('id') userId: string,
    @Param('farmId') farmId: string,
  ) {
    return this.farmsService.getFarmStats(userId, farmId);
  }

  @Post('upload-photo')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Upload employee profile photo to cloud storage' })
  @Permissions('farm_member:manage')
  uploadEmployeePhoto(@UploadedFile() file?: Express.Multer.File) {
    return this.farmsService.uploadEmployeePhoto(file);
  }
}
