import { AppPreferences, PreferencesDefaults } from '../models/preferences.model';

export const DEFAULT_PREFERENCES: AppPreferences = {
  theme: 'auto',
  autoSave: true,
  autoSaveInterval: 5,
  undoLevels: 10,
  showTooltips: true,
  defaultElement: 'arc',
  defaultCardType: 'Action',
  confirmDeleteActions: true,
  showWelcomeOnStartup: true
};

export const PREFERENCES_VALIDATION = {
  undoLevels: { min: 1, max: 50 },
  autoSaveInterval: { min: 1, max: 60 },
  allowedThemes: ['light', 'dark', 'auto'] as ('light' | 'dark' | 'auto')[],
  allowedCardTypes: ['Action', 'Passive', 'Spell', 'Equipment', 'Ritual']
};

export const PREFERENCES_DEFAULTS: PreferencesDefaults = {
  preferences: DEFAULT_PREFERENCES,
  validation: PREFERENCES_VALIDATION
};

export const PREFERENCES_STORAGE = {
  LOCAL_STORAGE_KEY: 'dragoneye-preferences',
  COOKIE_NAME: 'dragoneye-prefs',
  COOKIE_DAYS: 365
} as const;
