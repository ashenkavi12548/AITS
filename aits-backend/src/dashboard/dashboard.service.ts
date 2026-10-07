import { Injectable } from '@nestjs/common';
import {
  ReportFilterDto,
  ReportDownloadRequestDto,
} from './dto/report-query.dto';
import { CreateScheduleEventDto } from './dto/create-schedule-event.dto';
import { QuickAddAnimalDto } from './dto/quick-add-animal.dto';
import { CalendarQueryDto } from './dto/calendar.dto';
import {
  ReportSummaryItem,
  ChartDataPoint,
  PaginatedResponse,
  ReportCatalogItem,
  ReportPreviewData,
} from './types/dashboard.types';
import { DashboardHelpersService } from './services/dashboard-helpers.service';
import { DashboardAnalyticsService } from './services/dashboard-analytics.service';
import { DashboardExportService } from './services/dashboard-export.service';
import { DashboardOperationsService } from './services/dashboard-operations.service';
import { DashboardCalendarService } from './services/dashboard-calendar.service';
import { DashboardAlertsService } from './services/dashboard-alerts.service';

// Re-export all types for backward compatibility
export type {
  ReportSummaryItem,
  ChartDataPoint,
  PaginatedResponse,
  ReportCatalogItem,
  ReportPreviewData,
};

@Injectable()
export class DashboardService {
  constructor(
    public readonly helpers: DashboardHelpersService,
    public readonly analytics: DashboardAnalyticsService,
    public readonly exportService: DashboardExportService,
    public readonly operations: DashboardOperationsService,
    public readonly calendar: DashboardCalendarService,
    public readonly alerts: DashboardAlertsService,
  ) {}

  // ===========================================================================
  // 1. ANALYTICS QUERIES (Delegated to DashboardAnalyticsService)
  // ===========================================================================

  getOverviewAnalytics(filters: ReportFilterDto, userId?: string) {
    return this.analytics.getOverviewAnalytics(filters, userId);
  }

  getProductionAnalytics(filters: ReportFilterDto, userId?: string) {
    return this.analytics.getProductionAnalytics(filters, userId);
  }

  getHealthAnalytics(filters: ReportFilterDto, userId?: string) {
    return this.analytics.getHealthAnalytics(filters, userId);
  }

  getFeedingAnalytics(filters: ReportFilterDto, userId?: string) {
    return this.analytics.getFeedingAnalytics(filters, userId);
  }

  getBreedingAnalytics(filters: ReportFilterDto, userId?: string) {
    return this.analytics.getBreedingAnalytics(filters, userId);
  }

  getTraceabilityAnalytics(filters: ReportFilterDto, userId?: string) {
    return this.analytics.getTraceabilityAnalytics(filters, userId);
  }

  // ===========================================================================
  // 2. EXPORT & METADATA (Delegated to DashboardExportService)
  // ===========================================================================

  getFiltersMeta(userId?: string) {
    return this.exportService.getFiltersMeta(userId);
  }

  generateReportPreview(dto: ReportDownloadRequestDto, userId?: string) {
    return this.exportService.generateReportPreview(dto, userId);
  }

  exportReportData(dto: ReportDownloadRequestDto, userId?: string) {
    return this.exportService.exportReportData(dto, userId);
  }

  // ===========================================================================
  // 3. DASHBOARD OPERATIONS (Core, Analytics, Operations)
  // ===========================================================================

  getCurrentUser(userId?: string) {
    return this.operations.getCurrentUser(userId);
  }

  searchRecords(query: string) {
    return this.operations.searchRecords(query);
  }

  getSummary(period?: string, userId?: string) {
    return this.operations.getSummary(period, userId);
  }

  getMilkTrends(period: string = 'daily', userId?: string) {
    return this.operations.getMilkTrends(period, userId);
  }

  getAnimalStatusDistribution(userId?: string) {
    return this.operations.getAnimalStatusDistribution(userId);
  }

  quickAddAnimal(dto: QuickAddAnimalDto, userId?: string) {
    return this.operations.quickAddAnimal(dto, userId);
  }

  // ===========================================================================
  // 4. CALENDAR OPERATIONS
  // ===========================================================================

  createScheduleEvent(dto: CreateScheduleEventDto, userId?: string) {
    return this.calendar.createScheduleEvent(dto, userId);
  }

  completeScheduleItem(id: string, userId?: string) {
    return this.calendar.completeScheduleItem(id, userId);
  }

  getCalendarEvents(query: CalendarQueryDto, userId?: string) {
    return this.calendar.getCalendarEvents(query, userId);
  }

  getUpcomingEvents(userId?: string) {
    return this.calendar.getUpcomingEvents(userId);
  }

  // Note: updateCalendarEvent and deleteCalendarEvent are called directly from controller usually, but if needed:

  // ===========================================================================
  // 5. ALERTS & NOTIFICATIONS
  // ===========================================================================

  getNotifications(userId?: string) {
    return this.alerts.getNotifications(userId);
  }

  markAllNotificationsRead(userId?: string) {
    return this.alerts.markAllNotificationsRead(userId);
  }

  getAnimalsRequiringAttention(userId?: string) {
    return this.alerts.getAnimalsRequiringAttention(userId);
  }

  resolveAttentionAlert(id: string, userId?: string) {
    return this.alerts.resolveAttentionAlert(id, userId);
  }
}
