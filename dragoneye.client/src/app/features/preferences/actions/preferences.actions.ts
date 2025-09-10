import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { AppPreferences } from '../../../core/models/preferences.model';
import { PreferencesService } from '../services/preferences.service';

export interface PreferencesActionResult {
  success: boolean;
  preferences?: AppPreferences;
  error?: string;
}

@Injectable({
  providedIn: 'root'
})
export class PreferencesActions {

  constructor(private preferencesService: PreferencesService) {}

  updatePreferences(updates: Partial<AppPreferences>): PreferencesActionResult {
    try {
      const currentPrefs = this.preferencesService.currentPreferences;
      const updatedPrefs = { ...currentPrefs, ...updates };
      
      const validationErrors = this.preferencesService.getValidationErrors(updatedPrefs);
      if (validationErrors.length > 0) {
        return {
          success: false,
          error: validationErrors.join('; ')
        };
      }

      this.preferencesService.updatePreferences(updates);
      
      return {
        success: true,
        preferences: this.preferencesService.currentPreferences
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to update preferences'
      };
    }
  }

  savePreferences(): Observable<PreferencesActionResult> {
    return this.preferencesService.savePreferences().pipe(
      map(saved => ({
        success: saved,
        preferences: saved ? this.preferencesService.currentPreferences : undefined,
        error: saved ? undefined : 'Failed to save preferences'
      }))
    );
  }

  resetToDefaults(): Observable<PreferencesActionResult> {
    return this.preferencesService.resetToDefaults().pipe(
      map(preferences => ({
        success: true,
        preferences
      }))
    );
  }

  loadPreferences(): Observable<PreferencesActionResult> {
    return this.preferencesService.loadPreferences().pipe(
      map(preferences => ({
        success: true,
        preferences
      }))
    );
  }

  updateTheme(theme: AppPreferences['theme']): PreferencesActionResult {
    return this.updatePreferences({ theme });
  }

  updateAutoSave(autoSave: boolean, interval?: number): PreferencesActionResult {
    const updates: Partial<AppPreferences> = { autoSave };
    if (interval !== undefined) {
      updates.autoSaveInterval = interval;
    }
    return this.updatePreferences(updates);
  }

  updateDefaultCard(element: string, cardType: string): PreferencesActionResult {
    return this.updatePreferences({ 
      defaultElement: element, 
      defaultCardType: cardType 
    });
  }

  updateUiPreferences(preferences: {
    showTooltips?: boolean;
    showWelcomeOnStartup?: boolean;
    confirmDeleteActions?: boolean;
  }): PreferencesActionResult {
    return this.updatePreferences(preferences);
  }

  updateUndoLevels(undoLevels: number): PreferencesActionResult {
    if (undoLevels < 1 || undoLevels > 50) {
      return {
        success: false,
        error: 'Undo levels must be between 1 and 50'
      };
    }
    
    return this.updatePreferences({ undoLevels });
  }

  exportPreferences(): string {
    const preferences = this.preferencesService.currentPreferences;
    return JSON.stringify(preferences, null, 2);
  }

  importPreferences(preferencesJson: string): PreferencesActionResult {
    try {
      const preferences = JSON.parse(preferencesJson) as AppPreferences;
      
      const validationErrors = this.preferencesService.getValidationErrors(preferences);
      if (validationErrors.length > 0) {
        return {
          success: false,
          error: `Invalid preferences: ${validationErrors.join('; ')}`
        };
      }

      this.preferencesService.updatePreferences(preferences);
      
      return {
        success: true,
        preferences: this.preferencesService.currentPreferences
      };
    } catch (error: any) {
      return {
        success: false,
        error: 'Invalid JSON format'
      };
    }
  }

  hasUnsavedChanges(): boolean {
    return this.preferencesService.hasUnsavedChanges;
  }

  getCurrentPreferences(): AppPreferences {
    return this.preferencesService.currentPreferences;
  }
}
