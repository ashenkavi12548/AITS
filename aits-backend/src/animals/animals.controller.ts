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
  Res,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  HttpCode,
  HttpStatus,
  Ip,
  Headers,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { AnimalsService } from './animals.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  CreateAnimalDto,
  UpdateAnimalDto,
  UpdateAnimalStatusDto,
  CreateIdentifierDto,
  ReplaceQrDto,
  DeactivateQrDto,
  AnimalQueryDto,
} from './dto';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';

export interface UploadedMulterFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
  destination?: string;
  filename?: string;
  path?: string;
}

import { IsOptional, IsString } from 'class-validator';

export class UploadImageBodyDto {
  @IsOptional()
  @IsString()
  imageData?: string;
}

@ApiTags('Animal Management & Identification')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller(['api/v1/animals', 'api/animals'])
export class AnimalsController {
  constructor(private readonly animalsService: AnimalsService) {}

  @Get('stats')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get live herd inventory statistics',
    description:
      'Returns server-aggregated counts for total, active, quarantined, deceased, transferred, and sold animals scoped to user authorization.',
  })
  @ApiQuery({
    name: 'farmId',
    required: false,
    description: 'Filter statistics by farm UUID',
  })
  @Permissions('animal:read')
  async getHerdStats(
    @CurrentUser('id') userId: string,
    @Query('farmId') farmId?: string,
  ) {
    return this.animalsService.getHerdStats(userId, farmId);
  }

  @Get('export')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Export filtered herd inventory as CSV',
    description:
      'Generates and streams a structured CSV document of authorized livestock matching active filters.',
  })
  @Permissions('animal:export')
  async exportAnimalsCsv(
    @Query() query: AnimalQueryDto,
    @CurrentUser('id') userId: string,
    @Res() res: Response,
  ) {
    const csvContent = await this.animalsService.exportAnimalsCsv(
      query,
      userId,
    );
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="aits-herd-inventory-${new Date().toISOString().split('T')[0]}.csv"`,
    );
    res.send(csvContent);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'List authorized herd inventory with server-side filtering and search',
  })
  @Permissions('animal:read')
  async findAll(
    @Query() query: AnimalQueryDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.animalsService.findAll(query, userId);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get detailed animal identity, genealogy, QR, and module links',
  })
  @ApiParam({ name: 'id', description: 'Animal UUID' })
  @Permissions('animal:read')
  async findOne(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.animalsService.findOne(id, userId);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary:
      'Register a new animal with ear tag, RFID, QR generation, and audit logging',
  })
  @Permissions('animal:create')
  async createAnimal(
    @Body() dto: CreateAnimalDto,
    @CurrentUser('id') userId: string,
    @Ip() ipAddress: string,
    @Headers('user-agent') userAgent?: string,
  ) {
    return this.animalsService.createAnimal(dto, userId, {
      ipAddress,
      userAgent,
    });
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update mutable animal identity and phenotypic attributes',
  })
  @ApiParam({ name: 'id', description: 'Animal UUID' })
  @Permissions('animal:update')
  async updateAnimal(
    @Param('id') id: string,
    @Body() dto: UpdateAnimalDto,
    @CurrentUser('id') userId: string,
    @Ip() ipAddress: string,
    @Headers('user-agent') userAgent?: string,
  ) {
    return this.animalsService.updateAnimal(id, dto, userId, {
      ipAddress,
      userAgent,
    });
  }

  @Put(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update animal details (PUT)' })
  @Permissions('animal:update')
  async updateAnimalPut(
    @Param('id') id: string,
    @Body() dto: UpdateAnimalDto,
    @CurrentUser('id') userId: string,
    @Ip() ipAddress: string,
    @Headers('user-agent') userAgent?: string,
  ) {
    return this.animalsService.updateAnimal(id, dto, userId, {
      ipAddress,
      userAgent,
    });
  }

  @Patch(':id/status')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Transition animal status (ACTIVE, QUARANTINED, SOLD, TRANSFERRED, DECEASED)',
  })
  @ApiParam({ name: 'id', description: 'Animal UUID' })
  @Permissions('animal:update')
  async updateAnimalStatus(
    @Param('id') id: string,
    @Body() dto: UpdateAnimalStatusDto,
    @CurrentUser('id') userId: string,
    @Ip() ipAddress: string,
    @Headers('user-agent') userAgent?: string,
  ) {
    return this.animalsService.updateAnimalStatus(id, dto, userId, {
      ipAddress,
      userAgent,
    });
  }

  @Get(':id/identifiers')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List all identifiers registered to an animal' })
  @ApiParam({ name: 'id', description: 'Animal UUID' })
  @Permissions('animal:read')
  async getAnimalIdentifiers(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.animalsService.getAnimalIdentifiers(id, userId);
  }

  @Post(':id/identifiers')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Add a new identifier (RFID, Ear Tag, National ID) to an animal',
  })
  @ApiParam({ name: 'id', description: 'Animal UUID' })
  @Permissions('animal:update')
  async addIdentifier(
    @Param('id') id: string,
    @Body() dto: CreateIdentifierDto,
    @CurrentUser('id') userId: string,
    @Ip() ipAddress: string,
    @Headers('user-agent') userAgent?: string,
  ) {
    return this.animalsService.addIdentifier(id, dto, userId, {
      ipAddress,
      userAgent,
    });
  }

  @Get(':id/qr')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get active QR code and complete QR history for an animal',
  })
  @ApiParam({ name: 'id', description: 'Animal UUID' })
  @Permissions('animal:read')
  async getAnimalQr(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.animalsService.getAnimalQr(id, userId);
  }

  @Post(':id/qr/replace')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Atomically replace a damaged/lost QR code while preserving history',
  })
  @ApiParam({ name: 'id', description: 'Animal UUID' })
  @Permissions('animal:update')
  async replaceQrCode(
    @Param('id') id: string,
    @Body() dto: ReplaceQrDto,
    @CurrentUser('id') userId: string,
    @Ip() ipAddress: string,
    @Headers('user-agent') userAgent?: string,
  ) {
    return this.animalsService.replaceQrCode(id, dto, userId, {
      ipAddress,
      userAgent,
    });
  }

  @Patch(':id/qr/:qrId/deactivate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Deactivate an animal QR code' })
  @ApiParam({ name: 'id', description: 'Animal UUID' })
  @ApiParam({ name: 'qrId', description: 'QRCode UUID' })
  @Permissions('animal:update')
  async deactivateQrCode(
    @Param('id') id: string,
    @Param('qrId') qrId: string,
    @Body() dto: DeactivateQrDto,
    @CurrentUser('id') userId: string,
    @Ip() ipAddress: string,
    @Headers('user-agent') userAgent?: string,
  ) {
    return this.animalsService.deactivateQrCode(id, qrId, dto, userId, {
      ipAddress,
      userAgent,
    });
  }

  @Get(':id/history')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get animal lifecycle and identity change audit timeline',
  })
  @ApiParam({ name: 'id', description: 'Animal UUID' })
  @Permissions('animal:read')
  async getAnimalHistory(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.animalsService.getAnimalHistory(id, userId);
  }

  @Post('upload-photo')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Upload animal photo to cloud storage' })
  @Permissions('animal:update')
  uploadPhoto(
    @UploadedFile() file?: UploadedMulterFile,
    @Body() body?: UploadImageBodyDto,
  ) {
    const target = file || body?.imageData || '';
    return this.animalsService.uploadAnimalPhoto(target);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Archive/Soft-delete an animal record' })
  @ApiParam({ name: 'id', description: 'Animal UUID' })
  @Permissions('animal:delete')
  async deleteAnimal(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Ip() ipAddress: string,
    @Headers('user-agent') userAgent?: string,
  ) {
    return this.animalsService.deleteAnimal(id, userId, {
      ipAddress,
      userAgent,
    });
  }
}
