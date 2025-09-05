import { Injectable } from '@angular/core';

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

@Injectable({
  providedIn: 'root'
})
export class PreferencesService {
  private readonly COOKIE_NAME = 'dragoneye_preferences';
  private readonly defaultPreferences: AppPreferences = {
    undoLevels: 10,
    autoSave: true,
    autoSaveInterval: 5,
    theme: 'auto',
    showTooltips: true,
    defaultElement: 'arc',
    defaultCardType: 'Action',
    confirmDeleteActions: true,
    showWelcomeOnStartup: true
  };

  private currentPreferences: AppPreferences;

  constructor() {
    this.currentPreferences = this.loadPreferences();
  }

  get preferences(): AppPreferences {
    return { ...this.currentPreferences };
  }

  updatePreferences(newPreferences: Partial<AppPreferences>): void {
    this.currentPreferences = { ...this.currentPreferences, ...newPreferences };
    this.savePreferences();
  }

  resetToDefaults(): void {
    this.currentPreferences = { ...this.defaultPreferences };
    this.savePreferences();
  }

  private loadPreferences(): AppPreferences {
    try {
      const cookieValue = this.getCookie(this.COOKIE_NAME);
      if (cookieValue) {
        const savedPrefs = JSON.parse(decodeURIComponent(cookieValue));
        return { ...this.defaultPreferences, ...savedPrefs };
      }
    } catch (error) {
      console.warn('Failed to load preferences from cookie:', error);
    }
    return { ...this.defaultPreferences };
  }

  private savePreferences(): void {
    try {
      const prefsJson = JSON.stringify(this.currentPreferences);
      this.setCookie(this.COOKIE_NAME, encodeURIComponent(prefsJson), 365);
    } catch (error) {
      console.error('Failed to save preferences to cookie:', error);
    }
  }

  private setCookie(name: string, value: string, days: number): void {
    const expires = new Date();
    expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
    document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Lax`;
  }

  private getCookie(name: string): string | null {
    const nameEQ = name + "=";
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) === ' ') c = c.substring(1, c.length);
      if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
  }
}
