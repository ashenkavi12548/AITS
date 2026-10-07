'use client';

import React from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useReports } from '@/hooks/useReports';
import { ReportsHeader } from '@/features/reports/ReportsHeader';
import { ReportTabs } from '@/features/reports/ReportTabs';
import { ReportFilters } from '@/features/reports/ReportFilters';
import { ReportsOverview } from '@/features/reports/ReportsOverview';
import { ProductionAnalytics } from '@/features/reports/ProductionAnalytics';
import { HealthAnalytics } from '@/features/reports/HealthAnalytics';
import { FeedingAnalytics } from '@/features/reports/FeedingAnalytics';
import { BreedingAnalytics } from '@/features/reports/BreedingAnalytics';
import { TraceabilityAnalytics } from '@/features/reports/TraceabilityAnalytics';
import { ReportDownloadModal } from '@/features/reports/ReportDownloadModal';
import { ReportPreviewModal } from '@/features/reports/ReportPreviewModal';
import { ReportDownloadRequest, ReportTab } from '@/types/report.types';
import { AxiosError } from 'axios';

const checkIsAccessDenied = (error: unknown) => {
  if (error instanceof AxiosError) {
    return error.response?.status === 403;
  }
  return false;
};

export default function DashboardPage() {
  const {
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

    // Queries
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
  } = useReports();

  const [activePreviewRequest, setActivePreviewRequest] = React.useState<ReportDownloadRequest | null>(null);

  const handleOpenPreview = (req: ReportDownloadRequest) => {
    setActivePreviewRequest(req);
    setDownloadModalOpen(false);
    setPreviewModalOpen(true);
  };

  const handleQuickPreviewTab = (tab: ReportTab) => {
    const req = handleQuickPreview(tab);
    handleOpenPreview(req);
  };

  const isCurrentRefreshing =
    overviewQuery.isFetching ||
    productionQuery.isFetching ||
    healthQuery.isFetching ||
    feedingQuery.isFetching ||
    breedingQuery.isFetching ||
    traceabilityQuery.isFetching;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <ReportsHeader
          title="Dashboard"
          lastUpdated={lastRefreshedAt}
          isRefreshing={isCurrentRefreshing}
          onRefresh={handleRefresh}
          onOpenDownloadModal={() => handleOpenDownloadModal()}
          activeTab={activeTab}
          onQuickExport={handleQuickExport}
          onQuickPreview={handleQuickPreviewTab}
          isExporting={isExporting}
        />

        {/* Tab Navigation with Integrated Direct PDF, CSV, Preview & All Reports Modal Button */}
        <ReportTabs
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onQuickExport={handleQuickExport}
          onQuickPreview={handleQuickPreviewTab}
          onOpenDownloadModal={(type) => handleOpenDownloadModal(type)}
          isExporting={isExporting}
        />

        {/* Reusable Filter Bar */}
        <ReportFilters
          activeTab={activeTab}
          filters={filters}
          onFilterChange={handleFilterChange}
          onClearFilters={handleClearFilters}
        />

        {/* Tab Views */}
        {activeTab === 'overview' && (
          <ReportsOverview
            data={overviewQuery.data}
            isLoading={overviewQuery.isLoading}
            isError={overviewQuery.isError}
            isAccessDenied={checkIsAccessDenied(overviewQuery.error)}
            onRetry={overviewQuery.refetch}
            compareWithPrevious={filters.compareWithPrevious}
          />
        )}

        {activeTab === 'production' && (
          <ProductionAnalytics
            data={productionQuery.data}
            isLoading={productionQuery.isLoading}
            isError={productionQuery.isError}
            isAccessDenied={checkIsAccessDenied(productionQuery.error)}
            onRetry={productionQuery.refetch}
            compareWithPrevious={filters.compareWithPrevious}
            searchQuery={filters.searchQuery}
            onSearchChange={(q) => handleFilterChange('searchQuery', q)}
            onPageChange={(p) => handleFilterChange('page', p)}
          />
        )}

        {activeTab === 'health' && (
          <HealthAnalytics
            data={healthQuery.data}
            isLoading={healthQuery.isLoading}
            isError={healthQuery.isError}
            isAccessDenied={checkIsAccessDenied(healthQuery.error)}
            onRetry={healthQuery.refetch}
            compareWithPrevious={filters.compareWithPrevious}
            searchQuery={filters.searchQuery}
            onSearchChange={(q) => handleFilterChange('searchQuery', q)}
            onPageChange={(p) => handleFilterChange('page', p)}
          />
        )}

        {activeTab === 'feeding' && (
          <FeedingAnalytics
            data={feedingQuery.data}
            isLoading={feedingQuery.isLoading}
            isError={feedingQuery.isError}
            isAccessDenied={checkIsAccessDenied(feedingQuery.error)}
            onRetry={feedingQuery.refetch}
            compareWithPrevious={filters.compareWithPrevious}
            searchQuery={filters.searchQuery}
            onSearchChange={(q) => handleFilterChange('searchQuery', q)}
            onPageChange={(p) => handleFilterChange('page', p)}
          />
        )}

        {activeTab === 'breeding' && (
          <BreedingAnalytics
            data={breedingQuery.data}
            isLoading={breedingQuery.isLoading}
            isError={breedingQuery.isError}
            isAccessDenied={checkIsAccessDenied(breedingQuery.error)}
            onRetry={breedingQuery.refetch}
            compareWithPrevious={filters.compareWithPrevious}
            searchQuery={filters.searchQuery}
            onSearchChange={(q) => handleFilterChange('searchQuery', q)}
            onPageChange={(p) => handleFilterChange('page', p)}
          />
        )}

        {activeTab === 'traceability' && (
          <TraceabilityAnalytics
            data={traceabilityQuery.data}
            isLoading={traceabilityQuery.isLoading}
            isError={traceabilityQuery.isError}
            isAccessDenied={checkIsAccessDenied(traceabilityQuery.error)}
            onRetry={traceabilityQuery.refetch}
            compareWithPrevious={filters.compareWithPrevious}
            searchQuery={filters.searchQuery}
            onSearchChange={(q) => handleFilterChange('searchQuery', q)}
            onPageChange={(p) => handleFilterChange('page', p)}
          />
        )}
      </div>

      {/* Download Modal */}
      <ReportDownloadModal
        isOpen={downloadModalOpen}
        initialReportType={selectedReportTypeForDownload}
        isExporting={isExporting}
        onClose={() => setDownloadModalOpen(false)}
        onExecuteDownload={handleExecuteDownload}
        onOpenPreview={handleOpenPreview}
      />

      {/* Report Preview Modal */}
      {activePreviewRequest && (
        <ReportPreviewModal
          isOpen={previewModalOpen}
          request={activePreviewRequest}
          onClose={() => setPreviewModalOpen(false)}
          onExecuteDownload={handleExecuteDownload}
        />
      )}
    </DashboardLayout>
  );
}
