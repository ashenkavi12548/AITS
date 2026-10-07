import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Res,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { JwtService } from '@nestjs/jwt';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { AuthenticatedUser } from '../auth/decorators/current-user.decorator';
import { DashboardService } from './dashboard.service';
import {
  ReportFilterDto,
  ReportDownloadRequestDto,
} from './dto/report-query.dto';
import {
  CreateScheduleEventDto,
  UpdateCalendarEventDto,
} from './dto/create-schedule-event.dto';
import { QuickAddAnimalDto } from './dto/quick-add-animal.dto';
import { CalendarQueryDto } from './dto/calendar.dto';

@ApiTags('Dashboard & Reports Analytics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller(['api/v1/dashboard', 'api/dashboard'])
export class DashboardController {
  constructor(
    private readonly dashboardService: DashboardService,
    private readonly jwtService: JwtService,
  ) {}

  private extractUserId(req: unknown): string | undefined {
    return (req as { user?: AuthenticatedUser }).user?.id;
  }

  // ---------------------------------------------------------------------------
  // Dashboard & Reports Analytics
  // ---------------------------------------------------------------------------
  @Permissions('dashboard:view')
  @Get('summary')
  getSummary(@Req() req: Request, @Query('period') period?: string) {
    const userId = this.extractUserId(req);
    return this.dashboardService.getSummary(period, userId);
  }

  @Permissions('dashboard:view')
  @Get('milk-trends')
  getMilkTrends(@Req() req: Request, @Query('period') period?: string) {
    const userId = this.extractUserId(req);
    return this.dashboardService.getMilkTrends(period || 'daily', userId);
  }

  @Permissions('dashboard:view')
  @Get('animal-status')
  getAnimalStatusDistribution(@Req() req: Request) {
    const userId = this.extractUserId(req);
    return this.dashboardService.getAnimalStatusDistribution(userId);
  }

  @Permissions('dashboard:view', 'calendar:read')
  @Get('upcoming-events')
  getUpcomingEvents(@Req() req: Request) {
    const userId = this.extractUserId(req);
    return this.dashboardService.getUpcomingEvents(userId);
  }

  @Permissions('calendar:read')
  @Get('calendar')
  getCalendarEvents(@Req() req: Request, @Query() query: CalendarQueryDto) {
    const userId = this.extractUserId(req);
    return this.dashboardService.getCalendarEvents(query, userId);
  }

  @Permissions('dashboard:view')
  @Get('animals-attention')
  getAnimalsRequiringAttention(@Req() req: Request) {
    const userId = this.extractUserId(req);
    return this.dashboardService.getAnimalsRequiringAttention(userId);
  }

  @Permissions('animal:create')
  @Post('quick-add-animal')
  quickAddAnimal(@Req() req: Request, @Body() dto: QuickAddAnimalDto) {
    const userId = this.extractUserId(req);
    return this.dashboardService.quickAddAnimal(dto, userId);
  }

  @Permissions('animal:update')
  @Post('resolve-attention/:id')
  resolveAttentionAlert(@Req() req: Request, @Param('id') id: string) {
    const userId = this.extractUserId(req);
    return this.dashboardService.resolveAttentionAlert(id, userId);
  }

  @Permissions('reports:read')
  @Get('overview')
  getOverviewAnalytics(@Req() req: Request, @Query() filters: ReportFilterDto) {
    const userId = this.extractUserId(req);
    return this.dashboardService.getOverviewAnalytics(filters, userId);
  }

  @Permissions('reports:read')
  @Get('production')
  getProductionAnalytics(
    @Req() req: Request,
    @Query() filters: ReportFilterDto,
  ) {
    const userId = this.extractUserId(req);
    return this.dashboardService.getProductionAnalytics(filters, userId);
  }

  @Permissions('reports:read')
  @Get('health')
  getHealthAnalytics(@Req() req: Request, @Query() filters: ReportFilterDto) {
    const userId = this.extractUserId(req);
    return this.dashboardService.getHealthAnalytics(filters, userId);
  }

  @Permissions('reports:read')
  @Get('feeding')
  getFeedingAnalytics(@Req() req: Request, @Query() filters: ReportFilterDto) {
    const userId = this.extractUserId(req);
    return this.dashboardService.getFeedingAnalytics(filters, userId);
  }

  @Permissions('reports:read')
  @Get('breeding')
  getBreedingAnalytics(@Req() req: Request, @Query() filters: ReportFilterDto) {
    const userId = this.extractUserId(req);
    return this.dashboardService.getBreedingAnalytics(filters, userId);
  }

  @Permissions('reports:read', 'traceability:read')
  @Get('traceability')
  getTraceabilityAnalytics(
    @Req() req: Request,
    @Query() filters: ReportFilterDto,
  ) {
    const userId = this.extractUserId(req);
    return this.dashboardService.getTraceabilityAnalytics(filters, userId);
  }

  @Permissions('reports:read')
  @Get('filters-meta')
  getFiltersMeta(@Req() req: Request) {
    const userId = this.extractUserId(req);
    return this.dashboardService.getFiltersMeta(userId);
  }

  @Permissions('reports:read')
  @Post('preview')
  generateReportPreview(
    @Req() req: Request,
    @Body() dto: ReportDownloadRequestDto,
  ) {
    const userId = this.extractUserId(req);
    return this.dashboardService.generateReportPreview(dto, userId);
  }

  @Permissions('reports:read')
  @Post('export')
  async exportReportData(
    @Req() req: Request,
    @Body() dto: ReportDownloadRequestDto,
    @Res() res: Response,
  ) {
    const userId = this.extractUserId(req);
    const report = await this.dashboardService.exportReportData(dto, userId);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${report.filename}"`,
    );
    return res.send(report.content);
  }

  // ---------------------------------------------------------------------------
  // Global Header & Scheduling Utilities
  // ---------------------------------------------------------------------------
  @Get('me')
  async getCurrentUser(@Req() req: Request) {
    const userId = this.extractUserId(req);
    return this.dashboardService.getCurrentUser(userId);
  }

  @Permissions('notification:read')
  @Get('notifications')
  getNotifications(@Req() req: Request) {
    const userId = this.extractUserId(req);
    return this.dashboardService.getNotifications(userId);
  }

  @Permissions('notification:read')
  @Post('notifications/read-all')
  markAllNotificationsRead(@Req() req: Request) {
    const userId = this.extractUserId(req);
    return this.dashboardService.markAllNotificationsRead(userId);
  }

  @Permissions('notification:read')
  @Patch('notifications/read-all')
  markAllNotificationsReadPatch(@Req() req: Request) {
    const userId = this.extractUserId(req);
    return this.dashboardService.markAllNotificationsRead(userId);
  }

  @Get('search')
  searchRecords(@Query('q') query?: string) {
    return this.dashboardService.searchRecords(query || '');
  }

  // ---------------------------------------------------------------------------
  // Calendar Event CRUD
  // ---------------------------------------------------------------------------
  @Permissions('calendar:read')
  @Post('schedules')
  createScheduleEvent(
    @Req() req: Request,
    @Body() dto: CreateScheduleEventDto,
  ) {
    const userId = this.extractUserId(req);
    return this.dashboardService.createScheduleEvent(dto, userId);
  }

  @Permissions('calendar:read')
  @Patch('schedules/:id/complete')
  completeScheduleItem(@Req() req: Request, @Param('id') id: string) {
    const userId = this.extractUserId(req);
    return this.dashboardService.completeScheduleItem(id, userId);
  }

  @Permissions('calendar:read')
  @Patch('calendar-events/:id')
  updateCalendarEvent(
    @Req() req: Request,
    @Param('id') id: string,
    @Body() dto: UpdateCalendarEventDto,
  ) {
    const userId = this.extractUserId(req);
    return this.dashboardService.calendar.updateCalendarEvent(id, dto, userId);
  }

  @Permissions('calendar:read')
  @Delete('calendar-events/:id')
  deleteCalendarEvent(@Req() req: Request, @Param('id') id: string) {
    const userId = this.extractUserId(req);
    return this.dashboardService.calendar.deleteCalendarEvent(id, userId);
  }
}
