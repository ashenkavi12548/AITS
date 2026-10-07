'use client';

import React, { useState } from 'react';
import { Search, ChevronLeft, ChevronRight, ArrowUpDown, AlertCircle, RotateCw, Database, Lock } from 'lucide-react';
import { ReportTableColumn, PaginatedResponse } from '@/types/report.types';

interface ReportDataTableProps<T> {
  title: string;
  subtitle?: string;
  columns: ReportTableColumn<T>[];
  paginatedData?: PaginatedResponse<T>;
  isLoading?: boolean;
  isError?: boolean;
  isAccessDenied?: boolean;
  errorMessage?: string;
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
  onPageChange?: (page: number) => void;
  onRetry?: () => void;
}

export function ReportDataTable<T>({
  title,
  subtitle,
  columns,
  paginatedData,
  isLoading,
  isError,
  isAccessDenied,
  errorMessage = 'Failed to load report data records.',
  searchQuery = '',
  onSearchChange,
  onPageChange,
  onRetry,
}: ReportDataTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortOrder('asc');
    }
  };

  // Local sorting if requested
  const sortedRows = React.useMemo(() => {
    const rawRows = paginatedData?.data || [];
    if (!sortKey) return rawRows;
    return [...rawRows].sort((a, b) => {
      const recordA = a as Record<string, unknown>;
      const recordB = b as Record<string, unknown>;
      const valA = String(recordA[sortKey] ?? '');
      const valB = String(recordB[sortKey] ?? '');
      return sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
    });
  }, [paginatedData?.data, sortKey, sortOrder]);

  return (
    <div className="bg-white dark:bg-[#2f2f2f] rounded-2xl border border-[#e5e5e5] dark:border-[#383838] shadow-xs overflow-hidden transition-colors duration-150">
      {/* Table Title Bar */}
      <div className="p-4 md:p-5 border-b border-[#e5e5e5] dark:border-[#383838] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-[#0d0d0d] dark:text-white flex items-center gap-2">
            <Database className="w-4 h-4 text-[#10a37f]" />
            {title}
          </h2>
          {subtitle && <p className="text-xs text-[#737373] dark:text-[#8e8e8e] mt-0.5">{subtitle}</p>}
        </div>

        {/* Search input */}
        {onSearchChange && (
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-[#737373] dark:text-[#8e8e8e]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search detailed records..."
              className="w-full h-9 pl-9 pr-3 text-xs rounded-xl bg-[#f8faf8] dark:bg-[#212121] text-[#0d0d0d] dark:text-white border border-[#e5e5e5] dark:border-[#383838] focus:outline-none focus:ring-1 focus:ring-[#10a37f]"
            />
          </div>
        )}
      </div>

      {/* Main Table / Cards View */}
      {isLoading ? (
        <div className="p-6 space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-12 rounded-xl bg-[#e5e5e5]/40 dark:bg-[#212121]/40 animate-pulse" />
          ))}
        </div>
      ) : isAccessDenied ? (
        <div className="p-8 text-center flex flex-col items-center justify-center">
          <Lock className="w-8 h-8 text-amber-500 mb-2" />
          <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 mb-2">You do not have permission to view this table.</p>
        </div>
      ) : isError ? (
        <div className="p-8 text-center flex flex-col items-center justify-center">
          <AlertCircle className="w-8 h-8 text-rose-500 mb-2" />
          <p className="text-xs font-semibold text-rose-600 dark:text-rose-400 mb-2">{errorMessage}</p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#10a37f] text-white text-xs font-semibold hover:bg-[#0e8c6d] transition-colors cursor-pointer"
            >
              <RotateCw className="w-3.5 h-3.5" /> Retry Table Load
            </button>
          )}
        </div>
      ) : sortedRows.length === 0 ? (
        <div className="p-12 text-center text-xs text-[#737373] dark:text-[#8e8e8e]">
          No report records found matching the current search or filter criteria.
        </div>
      ) : (
        <>
          {/* Desktop Table Layout */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse text-[11.5px] min-w-[950px]">
              <thead className="bg-[#f8faf8] dark:bg-[#252525] text-[#737373] dark:text-[#8e8e8e] uppercase tracking-wider font-bold text-[11px] border-b border-[#e5e5e5] dark:border-[#383838]">
                <tr>
                  {columns.map((col) => {
                    const alignClass =
                      col.align === 'right'
                        ? 'text-right'
                        : col.align === 'center'
                        ? 'text-center'
                        : 'text-left';

                    return (
                      <th
                        key={String(col.key)}
                        style={col.width ? { width: col.width } : undefined}
                        className={`py-2.5 px-3.5 whitespace-nowrap ${alignClass}`}
                      >
                        {col.sortable !== false ? (
                          <button
                            type="button"
                            onClick={() => handleSort(String(col.key))}
                            className={`inline-flex items-center gap-1 hover:text-[#0d0d0d] dark:hover:text-white transition-colors cursor-pointer ${
                              col.align === 'right' ? 'justify-end' : col.align === 'center' ? 'justify-center' : 'justify-start'
                            }`}
                          >
                            <span>{col.header}</span>
                            <ArrowUpDown className="w-3 h-3 text-[#a3a3a3]" />
                          </button>
                        ) : (
                          <span>{col.header}</span>
                        )}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e5e5e5]/70 dark:divide-[#383838]/70 text-[#0d0d0d] dark:text-[#e5e5e5]">
                {sortedRows.map((row, rowIdx) => {
                  const record = row as Record<string, unknown>;
                  const rowKey = String(record.id ?? rowIdx);
                  return (
                    <tr
                      key={rowKey}
                      className="hover:bg-[#f8faf8] dark:hover:bg-[#262626] transition-colors"
                    >
                      {columns.map((col) => {
                        const alignClass =
                          col.align === 'right'
                            ? 'text-right'
                            : col.align === 'center'
                            ? 'text-center'
                            : 'text-left';

                        return (
                          <td
                            key={String(col.key)}
                            style={col.width ? { width: col.width } : undefined}
                            className={`py-2.5 px-3.5 whitespace-nowrap ${alignClass}`}
                          >
                            {col.accessor
                              ? col.accessor(row)
                              : String(record[String(col.key)] ?? 'N/A')}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile / Tablet Card Layout */}
          <div className="md:hidden p-3.5 divide-y divide-[#e5e5e5] dark:divide-[#383838] space-y-3">
            {sortedRows.map((row, rowIdx) => {
              const record = row as Record<string, unknown>;
              const rowKey = String(record.id ?? rowIdx);
              return (
                <div key={rowKey} className="pt-3 first:pt-0 space-y-2 text-xs">
                  {columns.map((col) => (
                    <div key={String(col.key)} className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-[#737373] dark:text-[#8e8e8e]">{col.header}:</span>
                      <span className="font-medium text-[#0d0d0d] dark:text-white text-right">
                        {col.accessor ? col.accessor(row) : String(record[String(col.key)] ?? 'N/A')}
                      </span>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Compact Pagination Controls Footer */}
      {paginatedData && (
        <div className="px-4 py-2.5 bg-[#f8faf8] dark:bg-[#252525] border-t border-[#e5e5e5] dark:border-[#383838] flex flex-col sm:flex-row items-center justify-between gap-2.5 text-[11.5px]">
          <span className="text-[#737373] dark:text-[#8e8e8e]">
            Showing{' '}
            <strong className="font-semibold text-[#0d0d0d] dark:text-white">{sortedRows.length}</strong> of{' '}
            <strong className="font-semibold text-[#0d0d0d] dark:text-white">{paginatedData.total}</strong> records
          </span>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => onPageChange && onPageChange(paginatedData.page - 1)}
              disabled={paginatedData.page <= 1}
              className="p-1 rounded-lg border border-[#e5e5e5] dark:border-[#383838] bg-white dark:bg-[#2f2f2f] text-[#0d0d0d] dark:text-white hover:bg-[#f0f0f0] dark:hover:bg-[#383838] disabled:opacity-40 cursor-pointer transition-colors"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>

            <span className="px-2.5 py-0.5 font-semibold text-[#0d0d0d] dark:text-white">
              Page {paginatedData.page} of {paginatedData.totalPages || 1}
            </span>

            <button
              type="button"
              onClick={() => onPageChange && onPageChange(paginatedData.page + 1)}
              disabled={paginatedData.page >= paginatedData.totalPages}
              className="p-1 rounded-lg border border-[#e5e5e5] dark:border-[#383838] bg-white dark:bg-[#2f2f2f] text-[#0d0d0d] dark:text-white hover:bg-[#f0f0f0] dark:hover:bg-[#383838] disabled:opacity-40 cursor-pointer transition-colors"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
