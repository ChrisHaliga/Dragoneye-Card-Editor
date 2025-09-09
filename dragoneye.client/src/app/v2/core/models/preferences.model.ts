// Preferences models for the data layer
export interface AppPreferences {
  undoLevels: number;
  autoSave: boolean;
  autoSaveInterval: number;
  theme: 'light' | 'dark' | 'auto';
  showTooltips: boolean;
  defaultElement: string;
  defaultCardType: string;
  confirmDeleteActions: boolean;
  showWelcomeOnStartup: boolean;
}

export interface PreferencesState {
  current: AppPreferences;
  hasUnsavedChanges: boolean;
  isLoading: boolean;
  lastSaved?: Date;
}

export interface PreferencesValidation {
  undoLevels: { min: number; max: number };
  autoSaveInterval: { min: number; max: number };
  allowedThemes: ('light' | 'dark' | 'auto')[];
  allowedCardTypes: string[];
}

export interface PreferencesDefaults {
  preferences: AppPreferences;
  validation: PreferencesValidation;
}

export interface PreferencesStorage {
  LOCAL_STORAGE_KEY: string;
  COOKIE_NAME: string;
  COOKIE_DAYS: number;
}
