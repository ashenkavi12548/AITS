'use client';

import React, { useRef } from 'react';
import { useTheme } from 'next-themes';
import { toast } from 'react-hot-toast';
import {
  Sun,
  Moon,
  Monitor,
  LayoutGrid,
  Scale,
  Calendar,
  Download,
  Upload,
  RotateCcw,
  Trash2,
} from 'lucide-react';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { TableDensity, UnitSystem, DateFormatOption } from '@/types/settings';

export default function PreferencesTab() {
  const { theme, setTheme } = useTheme();
  const {
    preferences,
    updatePreferences,
    resetToDefaults,
    exportSettingsJson,
    importSettingsJson,
  } = useSettingsStore();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    const jsonStr = exportSettingsJson();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `aits-settings-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Settings exported successfully as JSON');
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const success = importSettingsJson(content);
      if (success) {
        toast.success('Settings restored successfully from backup');
      } else {
        toast.error('Invalid backup JSON format');
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleResetDefaults = () => {
    if (window.confirm('Reset all custom RFID, alert, and UI preferences back to factory defaults?')) {
      resetToDefaults();
      setTheme('system');
      toast.success('All settings reset to defaults');
    }
  };

  const handleClearCache = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('aits-system-settings');
      toast.success('Local settings cache cleared');
      setTimeout(() => {
        window.location.reload();
      }, 600);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Theme & Visual Display */}
      <div className="bg-white dark:bg-[#262626] rounded-2xl border border-[#e5e5e5] dark:border-[#383838] p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-3 pb-4 border-b border-[#e5e5e5] dark:border-[#383838]">
          <div className="p-2.5 rounded-xl bg-[#10a37f]/10 text-[#10a37f]">
            <Sun className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#0d0d0d] dark:text-white">
              Display & Color Appearance
            </h3>
            <p className="text-xs text-[#737373] dark:text-[#8e8e8e]">
              Personalize interface contrast for bright sunlight pasture checks or dark control rooms.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          {/* Light Theme */}
          <button
            type="button"
            onClick={() => {
              setTheme('light');
              updatePreferences({ theme: 'light' });
              toast.success('Light theme activated');
            }}
            className={`p-4 rounded-xl border flex flex-col items-center gap-2 cursor-pointer transition-all ${
              theme === 'light'
                ? 'bg-[#10a37f]/10 border-[#10a37f] text-[#10a37f]'
                : 'bg-[#f9f9f9] dark:bg-[#1f1f1f] border-[#e5e5e5] dark:border-[#383838] text-[#737373] dark:text-[#8e8e8e] hover:text-[#0d0d0d] dark:hover:text-white'
            }`}
          >
            <Sun className="w-6 h-6" />
            <span className="text-xs font-semibold">Light Mode</span>
            <span className="text-[10px] text-[#737373] dark:text-[#8e8e8e]">Clean high-key contrast</span>
          </button>

          {/* Dark Theme */}
          <button
            type="button"
            onClick={() => {
              setTheme('dark');
              updatePreferences({ theme: 'dark' });
              toast.success('Dark theme activated');
            }}
            className={`p-4 rounded-xl border flex flex-col items-center gap-2 cursor-pointer transition-all ${
              theme === 'dark'
                ? 'bg-[#10a37f]/10 border-[#10a37f] text-[#10a37f]'
                : 'bg-[#f9f9f9] dark:bg-[#1f1f1f] border-[#e5e5e5] dark:border-[#383838] text-[#737373] dark:text-[#8e8e8e] hover:text-[#0d0d0d] dark:hover:text-white'
            }`}
          >
            <Moon className="w-6 h-6" />
            <span className="text-xs font-semibold">Dark Mode</span>
            <span className="text-[10px] text-[#737373] dark:text-[#8e8e8e]">Sleek low-glare dark</span>
          </button>

          {/* System Theme */}
          <button
            type="button"
            onClick={() => {
              setTheme('system');
              updatePreferences({ theme: 'system' });
              toast.success('System theme mode activated');
            }}
            className={`p-4 rounded-xl border flex flex-col items-center gap-2 cursor-pointer transition-all ${
              theme === 'system'
                ? 'bg-[#10a37f]/10 border-[#10a37f] text-[#10a37f]'
                : 'bg-[#f9f9f9] dark:bg-[#1f1f1f] border-[#e5e5e5] dark:border-[#383838] text-[#737373] dark:text-[#8e8e8e] hover:text-[#0d0d0d] dark:hover:text-white'
            }`}
          >
            <Monitor className="w-6 h-6" />
            <span className="text-xs font-semibold">Match System OS</span>
            <span className="text-[10px] text-[#737373] dark:text-[#8e8e8e]">Follows device setting</span>
          </button>
        </div>
      </div>

      {/* Regional Units & Table Formatting */}
      <div className="bg-white dark:bg-[#262626] rounded-2xl border border-[#e5e5e5] dark:border-[#383838] p-6 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-[#0d0d0d] dark:text-white pb-4 border-b border-[#e5e5e5] dark:border-[#383838]">
          Regional Units & Herd Ledger Layout
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
          {/* Table Density */}
          <div className="p-4 rounded-xl bg-[#f9f9f9] dark:bg-[#1f1f1f] border border-[#e5e5e5] dark:border-[#383838] space-y-2">
            <div className="flex items-center gap-2 text-[#737373] dark:text-[#8e8e8e]">
              <LayoutGrid className="w-4 h-4 text-[#10a37f]" />
              <span className="font-semibold text-[#0d0d0d] dark:text-white">Table Density</span>
            </div>
            <select
              value={preferences.tableDensity}
              onChange={(e) =>
                updatePreferences({ tableDensity: e.target.value as TableDensity })
              }
              className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#2b2b2b] border border-[#e5e5e5] dark:border-[#383838] text-[#0d0d0d] dark:text-white font-medium cursor-pointer"
            >
              <option value="compact">Compact (High Information Density)</option>
              <option value="comfortable">Comfortable (Balanced)</option>
              <option value="spacious">Spacious (Large Touch Targets)</option>
            </select>
          </div>

          {/* Unit System */}
          <div className="p-4 rounded-xl bg-[#f9f9f9] dark:bg-[#1f1f1f] border border-[#e5e5e5] dark:border-[#383838] space-y-2">
            <div className="flex items-center gap-2 text-[#737373] dark:text-[#8e8e8e]">
              <Scale className="w-4 h-4 text-[#10a37f]" />
              <span className="font-semibold text-[#0d0d0d] dark:text-white">Measurement Units</span>
            </div>
            <select
              value={preferences.unitSystem}
              onChange={(e) =>
                updatePreferences({ unitSystem: e.target.value as UnitSystem })
              }
              className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#2b2b2b] border border-[#e5e5e5] dark:border-[#383838] text-[#0d0d0d] dark:text-white font-medium cursor-pointer"
            >
              <option value="metric">Metric (Liters, Kilograms, °C)</option>
              <option value="imperial">Imperial (Gallons, Lbs, °F)</option>
            </select>
          </div>

          {/* Date Format */}
          <div className="p-4 rounded-xl bg-[#f9f9f9] dark:bg-[#1f1f1f] border border-[#e5e5e5] dark:border-[#383838] space-y-2">
            <div className="flex items-center gap-2 text-[#737373] dark:text-[#8e8e8e]">
              <Calendar className="w-4 h-4 text-[#10a37f]" />
              <span className="font-semibold text-[#0d0d0d] dark:text-white">Date Format</span>
            </div>
            <select
              value={preferences.dateFormat}
              onChange={(e) =>
                updatePreferences({ dateFormat: e.target.value as DateFormatOption })
              }
              className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#2b2b2b] border border-[#e5e5e5] dark:border-[#383838] text-[#0d0d0d] dark:text-white font-medium cursor-pointer"
            >
              <option value="DD/MM/YYYY">DD/MM/YYYY (Sri Lanka Standard)</option>
              <option value="YYYY-MM-DD">YYYY-MM-DD (ISO Standard)</option>
              <option value="MM/DD/YYYY">MM/DD/YYYY (US Format)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Backup, Export & Reset Tools */}
      <div className="bg-white dark:bg-[#262626] rounded-2xl border border-[#e5e5e5] dark:border-[#383838] p-6 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-[#0d0d0d] dark:text-white pb-4 border-b border-[#e5e5e5] dark:border-[#383838]">
          Data Management & Configuration Backup
        </h3>

        <div className="flex flex-wrap items-center gap-3 pt-1">
          {/* Export Settings */}
          <button
            type="button"
            onClick={handleExport}
            className="px-4 py-2 rounded-xl bg-[#10a37f]/10 hover:bg-[#10a37f]/20 text-[#10a37f] border border-[#10a37f]/30 text-xs font-semibold flex items-center gap-2 cursor-pointer transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Settings JSON</span>
          </button>

          {/* Import Settings */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImportFile}
            accept=".json"
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2 rounded-xl bg-[#f4f4f4] dark:bg-[#1f1f1f] hover:bg-[#ececec] dark:hover:bg-[#2f2f2f] text-[#0d0d0d] dark:text-white border border-[#e5e5e5] dark:border-[#383838] text-xs font-semibold flex items-center gap-2 cursor-pointer transition-colors"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Import Settings Backup</span>
          </button>

          {/* Clear Cache */}
          <button
            type="button"
            onClick={handleClearCache}
            className="px-4 py-2 rounded-xl bg-[#f4f4f4] dark:bg-[#1f1f1f] hover:bg-[#ececec] dark:hover:bg-[#2f2f2f] text-[#737373] dark:text-[#8e8e8e] hover:text-[#0d0d0d] dark:hover:text-white border border-[#e5e5e5] dark:border-[#383838] text-xs font-semibold flex items-center gap-2 cursor-pointer transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear Local Cache</span>
          </button>

          {/* Reset Defaults */}
          <button
            type="button"
            onClick={handleResetDefaults}
            className="px-4 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/20 text-xs font-semibold flex items-center gap-2 cursor-pointer transition-colors ml-auto"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset All to Defaults</span>
          </button>
        </div>
      </div>
    </div>
  );
}
