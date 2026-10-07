export type SettingsTabType =
  | 'profile'
  | 'farm'
  | 'security'
  | 'notifications'
  | 'preferences';

export interface NotificationSettings {
  channels: {
    email: boolean;
    sms: boolean;
    inApp: boolean;
  };
  alerts: {
    diseaseOutbreak: boolean;
    quarantineZone: boolean;
    vaccinationDueReminder: boolean;
    vaccinationReminderDays: number;
    estrousAndInsemination: boolean;
    expectedCalvingAlert: boolean;
    milkYieldAnomaly: boolean;
    milkDropThresholdPercent: number;
    unauthorizedMovement: boolean;
    systemMaintenance: boolean;
  };
}

export type TableDensity = 'compact' | 'comfortable' | 'spacious';
export type UnitSystem = 'metric' | 'imperial';
export type DateFormatOption = 'DD/MM/YYYY' | 'YYYY-MM-DD' | 'MM/DD/YYYY';

export interface SystemPreferences {
  theme: 'light' | 'dark' | 'system';
  tableDensity: TableDensity;
  unitSystem: UnitSystem;
  dateFormat: DateFormatOption;
  autoRefreshIntervalSeconds: number;
  enableAnimations: boolean;
}

export interface SessionDeviceInfo {
  id: string;
  deviceName: string;
  browser: string;
  ipAddress: string;
  location: string;
  lastActive: string;
  isCurrent: boolean;
}

export interface OperatorProfileExtended {
  firstName: string;
  lastName: string;
  phone: string;
  emergencyContact?: string;
  nationalIdNumber?: string;
  preferredLanguage: 'EN' | 'SI' | 'TA';
  notes?: string;
}
