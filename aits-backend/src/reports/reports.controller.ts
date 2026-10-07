import {
  Controller,
  Get,
  Post,
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
import {
  Permissions,
  AnyPermissions,
} from '../auth/decorators/permissions.decorator';
import { DashboardService } from '../dashboard/dashboard.service';
import { TraceabilityService } from '../traceability/traceability.service';
import {
  ReportFilterDto,
  ReportDownloadRequestDto,
} from '../dashboard/dto/report-query.dto';

@ApiTags('Reports & Analytics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller(['api/v1/reports', 'api/reports'])
export class ReportsController {
  constructor(
    private readonly dashboardService: DashboardService,
    private readonly traceabilityService: TraceabilityService,
    private readonly jwtService: JwtService,
  ) {}

  private extractUserId(req: Request): string | undefined {
    const cookies = req.cookies as
      Record<string, string | undefined> | undefined;
    const cookieToken =
      typeof cookies?.accessToken === 'string'
        ? cookies.accessToken
        : undefined;
    const authHeader = req.headers.authorization;
    const bearerToken =
      typeof authHeader === 'string'
        ? authHeader.replace(/^Bearer\s+/i, '')
        : undefined;
    const token = cookieToken || bearerToken;

    if (token) {
      try {
        const decoded = this.jwtService.decode<{
          sub?: string;
          id?: string;
        }>(token);
        return decoded?.sub || decoded?.id;
      } catch {
        return undefined;
      }
    }
    return undefined;
  }

  @AnyPermissions('dashboard:view', 'reports:read')
  @Get('overview')
  getReportsOverview(@Req() req: Request, @Query() filters: ReportFilterDto) {
    const userId = this.extractUserId(req);
    return this.dashboardService.getOverviewAnalytics(filters, userId);
  }

  @AnyPermissions('milk:record', 'reports:read')
  @Get('production')
  getProductionAnalytics(
    @Req() req: Request,
    @Query() filters: ReportFilterDto,
  ) {
    const userId = this.extractUserId(req);
    return this.dashboardService.getProductionAnalytics(filters, userId);
  }

  @AnyPermissions('animal:read', 'health:record', 'reports:read')
  @Get('health')
  getHealthAnalytics(@Req() req: Request, @Query() filters: ReportFilterDto) {
    const userId = this.extractUserId(req);
    return this.dashboardService.getHealthAnalytics(filters, userId);
  }

  @AnyPermissions('feeding:record', 'reports:read')
  @Get('feeding')
  getFeedingAnalytics(@Req() req: Request, @Query() filters: ReportFilterDto) {
    const userId = this.extractUserId(req);
    return this.dashboardService.getFeedingAnalytics(filters, userId);
  }

  @AnyPermissions('breeding:record', 'reports:read')
  @Get('breeding')
  getBreedingAnalytics(@Req() req: Request, @Query() filters: ReportFilterDto) {
    const userId = this.extractUserId(req);
    return this.dashboardService.getBreedingAnalytics(filters, userId);
  }

  @AnyPermissions('traceability:read', 'reports:read')
  @Get('traceability')
  getTraceabilityAnalytics(
    @Req() req: Request,
    @Query() filters: ReportFilterDto,
  ) {
    const userId = this.extractUserId(req);
    return this.dashboardService.getTraceabilityAnalytics(filters, userId);
  }

  @AnyPermissions('traceability:read', 'reports:read')
  @Get('lifetime/:animalId')
  getAnimalLifetimeReport(
    @Req() req: Request,
    @Param('animalId') animalId: string,
    @Query() query?: Record<string, unknown>,
  ) {
    const userId = this.extractUserId(req);
    return this.traceabilityService.getAnimalLifetimeTrace(
      userId || '',
      animalId,
      query,
    );
  }

  @AnyPermissions('dashboard:view', 'reports:read')
  @Get('filters-meta')
  getFiltersMeta(@Req() req: Request) {
    const userId = this.extractUserId(req);
    return this.dashboardService.getFiltersMeta(userId);
  }

  @AnyPermissions('dashboard:view', 'reports:read')
  @Post('preview')
  generateReportPreview(
    @Req() req: Request,
    @Body() dto: ReportDownloadRequestDto,
  ) {
    const userId = this.extractUserId(req);
    return this.dashboardService.generateReportPreview(dto, userId);
  }

  @AnyPermissions('dashboard:view', 'reports:read')
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
}
