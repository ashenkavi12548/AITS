import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  SettingsTabType,
  NotificationSettings,
  SystemPreferences,
} from '@/types/settings';

interface SettingsState {
  activeTab: SettingsTabType;
  searchQuery: string;
  notifications: NotificationSettings;
  preferences: SystemPreferences;

  // Actions
  setActiveTab: (tab: SettingsTabType) => void;
  setSearchQuery: (query: string) => void;
  updateNotificationChannels: (updates: Partial<NotificationSettings['channels']>) => void;
  updateNotificationAlerts: (updates: Partial<NotificationSettings['alerts']>) => void;
  updatePreferences: (updates: Partial<SystemPreferences>) => void;
  resetToDefaults: () => void;
  exportSettingsJson: () => string;
  importSettingsJson: (json: string) => boolean;
}

const defaultNotifications: NotificationSettings = {
  channels: {
    email: true,
    sms: true,
    inApp: true,
  },
  alerts: {
    diseaseOutbreak: true,
    quarantineZone: true,
    vaccinationDueReminder: true,
    vaccinationReminderDays: 3,
    estrousAndInsemination: true,
    expectedCalvingAlert: true,
    milkYieldAnomaly: true,
    milkDropThresholdPercent: 15,
    unauthorizedMovement: true,
    systemMaintenance: false,
  },
};

const defaultPreferences: SystemPreferences = {
  theme: 'system',
  tableDensity: 'comfortable',
  unitSystem: 'metric',
  dateFormat: 'DD/MM/YYYY',
  autoRefreshIntervalSeconds: 30,
  enableAnimations: true,
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      activeTab: 'profile',
      searchQuery: '',
      notifications: defaultNotifications,
      preferences: defaultPreferences,

      setActiveTab: (tab: SettingsTabType) => set({ activeTab: tab }),

      setSearchQuery: (query: string) => set({ searchQuery: query }),

      updateNotificationChannels: (updates: Partial<NotificationSettings['channels']>) =>
        set((state) => ({
          notifications: {
            ...state.notifications,
            channels: { ...state.notifications.channels, ...updates },
          },
        })),

      updateNotificationAlerts: (updates: Partial<NotificationSettings['alerts']>) =>
        set((state) => ({
          notifications: {
            ...state.notifications,
            alerts: { ...state.notifications.alerts, ...updates },
          },
        })),

      updatePreferences: (updates: Partial<SystemPreferences>) =>
        set((state) => ({
          preferences: { ...state.preferences, ...updates },
        })),

      resetToDefaults: () =>
        set({
          notifications: defaultNotifications,
          preferences: defaultPreferences,
        }),

      exportSettingsJson: () => {
        const { notifications, preferences } = get();
        return JSON.stringify(
          {
            version: '2.0',
            exportedAt: new Date().toISOString(),
            notifications,
            preferences,
          },
          null,
          2,
        );
      },

      importSettingsJson: (jsonString: string) => {
        try {
          const parsed = JSON.parse(jsonString) as {
            notifications?: Partial<NotificationSettings>;
            preferences?: Partial<SystemPreferences>;
          };
          if (!parsed || typeof parsed !== 'object') return false;

          set((state) => ({
            notifications: parsed.notifications
              ? {
                  channels: {
                    ...state.notifications.channels,
                    ...(parsed.notifications.channels || {}),
                  },
                  alerts: {
                    ...state.notifications.alerts,
                    ...(parsed.notifications.alerts || {}),
                  },
                }
              : state.notifications,
            preferences: parsed.preferences
              ? { ...state.preferences, ...parsed.preferences }
              : state.preferences,
          }));
          return true;
        } catch {
          return false;
        }
      },
    }),
    {
      name: 'aits-system-settings',
      partialize: (state) => ({
        notifications: state.notifications,
        preferences: state.preferences,
      }),
    },
  ),
);
