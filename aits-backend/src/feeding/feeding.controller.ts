import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { FeedingService } from './feeding.service';
import { CreateFeedingRecordDto } from './dto/create-feeding-record.dto';
import { UpdateFeedingRecordDto } from './dto/update-feeding-record.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import type { RequestWithUser } from '../auth/decorators/current-user.decorator';

@Controller('api/v1/feeding')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
export class FeedingController {
  constructor(private readonly feedingService: FeedingService) {}

  @Get('feed-types')
  // We assume anyone with feed:read can view feed types, or we can leave it open for authenticated users with farm access
  async getFeedTypes() {
    return this.feedingService.getFeedTypes();
  }

  @Get('records')
  async getAllFeedingRecords(@Req() req: RequestWithUser) {
    return this.feedingService.getAllFeedingRecords(req.user!.id);
  }

  @Get('records/:animalId')
  async getFeedingRecords(
    @Param('animalId') animalId: string,
    @Req() req: RequestWithUser,
  ) {
    return this.feedingService.getFeedingRecordsForAnimal(
      animalId,
      req.user!.id,
    );
  }

  @Post('records')
  async createFeedingRecord(
    @Body() dto: CreateFeedingRecordDto,
    @Req() req: RequestWithUser,
  ) {
    return this.feedingService.createFeedingRecord(dto, req.user!.id);
  }

  @Patch('records/:id')
  async updateFeedingRecord(
    @Param('id') id: string,
    @Body() dto: UpdateFeedingRecordDto,
    @Req() req: RequestWithUser,
  ) {
    return this.feedingService.updateFeedingRecord(id, dto, req.user!.id);
  }

  @Delete('records/:id')
  async deleteFeedingRecord(
    @Param('id') id: string,
    @Req() req: RequestWithUser,
  ) {
    return this.feedingService.deleteFeedingRecord(id, req.user!.id);
  }
}
