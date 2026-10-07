'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { ReportFilters, ReportTab, ReportDownloadRequest, ReportType } from '@/types/report.types';
import { reportService } from '@/services/report.service';

const initialFilters: ReportFilters = {
  farmId: 'ALL',
  startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
  endDate: new Date().toISOString().slice(0, 10),
  animalId: '',
  breed: 'All Breeds',
  gender: 'All',
  animalStatus: 'All Statuses',
  reportStatus: 'All',
  compareWithPrevious: true,
  searchQuery: '',
  page: 1,
  limit: 10,
};

export function useReports() {
  const [activeTab, setActiveTab] = useState<ReportTab>('overview');
  const [filters, setFilters] = useState<ReportFilters>(initialFilters);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<string>(
    new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  );

  // Modals state
  const [downloadModalOpen, setDownloadModalOpen] = useState(false);
  const [selectedReportTypeForDownload, setSelectedReportTypeForDownload] = useState<ReportType>('OVERVIEW');
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // 1. Overview Query
  const overviewQuery = useQuery({
    queryKey: ['reports', 'overview', filters],
    queryFn: () => reportService.getReportsOverview(filters),
    enabled: activeTab === 'overview',
  });

  // 2. Production Query
  const productionQuery = useQuery({
    queryKey: ['reports', 'production', filters],
    queryFn: () => reportService.getProductionAnalytics(filters),
    enabled: activeTab === 'production',
  });

  // 3. Health Query
  const healthQuery = useQuery({
    queryKey: ['reports', 'health', filters],
    queryFn: () => reportService.getHealthAnalytics(filters),
    enabled: activeTab === 'health',
  });

  // 4. Feeding Query
  const feedingQuery = useQuery({
    queryKey: ['reports', 'feeding', filters],
    queryFn: () => reportService.getFeedingAnalytics(filters),
    enabled: activeTab === 'feeding',
  });

  // 5. Breeding Query
  const breedingQuery = useQuery({
    queryKey: ['reports', 'breeding', filters],
    queryFn: () => reportService.getBreedingAnalytics(filters),
    enabled: activeTab === 'breeding',
  });

  // 6. Traceability Query
  const traceabilityQuery = useQuery({
    queryKey: ['reports', 'traceability', filters],
    queryFn: () => reportService.getTraceabilityAnalytics(filters),
    enabled: activeTab === 'traceability',
  });

  // Refresh handler
  const handleRefresh = async () => {
    const toastId = toast.loading('Refreshing analytics telemetry...');
    try {
      if (activeTab === 'overview') await overviewQuery.refetch();
      else if (activeTab === 'production') await productionQuery.refetch();
      else if (activeTab === 'health') await healthQuery.refetch();
      else if (activeTab === 'feeding') await feedingQuery.refetch();
      else if (activeTab === 'breeding') await breedingQuery.refetch();
      else if (activeTab === 'traceability') await traceabilityQuery.refetch();

      setLastRefreshedAt(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
      toast.success('Analytics data successfully updated!', { id: toastId });
    } catch {
      toast.error('Failed to refresh analytics. Please check network connection.', { id: toastId });
    }
  };

  const handleFilterChange = (key: keyof ReportFilters, value: unknown) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
      page: key === 'page' ? (value as number) : 1, // Reset page on filter change
    }));
  };

  const handleClearFilters = () => {
    setFilters(initialFilters);
    toast.success('Report filters reset to default');
  };

  const handleOpenDownloadModal = (type?: ReportType) => {
    setSelectedReportTypeForDownload(type || (activeTab.toUpperCase() as ReportType));
    setDownloadModalOpen(true);
  };

  const handleExecuteDownload = async (req: ReportDownloadRequest) => {
    setIsExporting(true);
    const toastId = toast.loading(`Generating ${req.fileFormat} report file...`);
    try {
      if (req.fileFormat === 'CSV') {
        await reportService.exportReportCsv(req);
        toast.success(`${req.reportType} CSV report downloaded successfully!`, { id: toastId });
      } else if (req.fileFormat === 'PDF') {
        await reportService.exportReportPdf(req);
        toast.success(`${req.reportType} PDF report generated successfully!`, { id: toastId });
      } else if (req.fileFormat === 'PRINT') {
        toast.dismiss(toastId);
        setDownloadModalOpen(false);
        setPreviewModalOpen(true);
      }
      setDownloadModalOpen(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Report export failed.';
      toast.error(msg, { id: toastId });
    } finally {
      setIsExporting(false);
    }
  };

  // Quick Export Handler for Overview Bar buttons
  const handleQuickExport = async (tab: ReportTab, format: 'PDF' | 'CSV') => {
    const reportType = tab.toUpperCase() as ReportType;
    const req: ReportDownloadRequest = {
      reportType,
      farmId: filters.farmId,
      startDate: filters.startDate,
      endDate: filters.endDate,
      status: filters.animalStatus,
      fileFormat: format,
      pageOrientation: 'LANDSCAPE',
      includeSummaryCards: true,
      includeCharts: true,
      includeDetailedTable: true,
      includeConfidentialLabel: true,
      isExport: true,
    };
    await handleExecuteDownload(req);
  };

  // Quick Preview Generator for Overview Bar buttons
  const handleQuickPreview = (tab: ReportTab): ReportDownloadRequest => {
    const reportType = tab.toUpperCase() as ReportType;
    return {
      reportType,
      farmId: filters.farmId,
      startDate: filters.startDate,
      endDate: filters.endDate,
      status: filters.animalStatus,
      fileFormat: 'PDF',
      pageOrientation: 'LANDSCAPE',
      includeSummaryCards: true,
      includeCharts: true,
      includeDetailedTable: true,
      includeConfidentialLabel: true,
      isExport: true,
    };
  };

  return {
    activeTab,
    setActiveTab,
    filters,
    lastRefreshedAt,
    downloadModalOpen,
    setDownloadModalOpen,
    previewModalOpen,
    setPreviewModalOpen,
    selectedReportTypeForDownload,
    isExporting,

    // Data queries
    overviewQuery,
    productionQuery,
    healthQuery,
    feedingQuery,
    breedingQuery,
    traceabilityQuery,

    // Actions
    handleRefresh,
    handleFilterChange,
    handleClearFilters,
    handleOpenDownloadModal,
    handleExecuteDownload,
    handleQuickExport,
    handleQuickPreview,
  };
}
