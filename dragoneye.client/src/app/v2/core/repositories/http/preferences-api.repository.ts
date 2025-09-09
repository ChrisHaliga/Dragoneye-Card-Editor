import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

import { IPreferencesApiRepository } from '../interfaces/preferences-api.interface';
import { AppPreferences } from '../../models/preferences.model';
import { 
  PreferencesRequest, 
  PreferencesResponse, 
  PreferencesLoadResponse 
} from '../../models/api.model';
import { DEFAULT_PREFERENCES, PREFERENCES_STORAGE } from '../../constants/preferences.const';

@Injectable({
  providedIn: 'root'
})
export class PreferencesApiRepository implements IPreferencesApiRepository {
  
  loadPreferences(): Observable<PreferencesLoadResponse> {
    return new Observable(observer => {
      try {
        console.log('🔄 Loading preferences from storage...');
        
        // Try localStorage first, fall back to cookies
        let savedPrefs: AppPreferences | null = null;
        let isDefault = true;
        
        const localStorageData = localStorage.getItem(PREFERENCES_STORAGE.LOCAL_STORAGE_KEY);
        console.log('📦 LocalStorage data:', localStorageData);
        
        if (localStorageData) {
          savedPrefs = JSON.parse(localStorageData);
          isDefault = false;
          console.log('✅ Loaded from localStorage:', savedPrefs);
        } else {
          // Fall back to cookie
          const cookieValue = this.getCookie(PREFERENCES_STORAGE.COOKIE_NAME);
          console.log('🍪 Cookie data:', cookieValue);
          
          if (cookieValue) {
            savedPrefs = JSON.parse(decodeURIComponent(cookieValue));
            isDefault = false;
            console.log('✅ Loaded from cookie:', savedPrefs);
          }
        }
        
        const preferences = savedPrefs 
          ? { ...DEFAULT_PREFERENCES, ...savedPrefs }
          : DEFAULT_PREFERENCES;
          
        console.log('🎯 Final preferences:', preferences);
        console.log('🏠 Is default:', isDefault);
          
        observer.next({ preferences, isDefault });
        observer.complete();
      } catch (error) {
        console.warn('❌ Failed to load preferences:', error);
        observer.next({ 
          preferences: DEFAULT_PREFERENCES, 
          isDefault: true 
        });
        observer.complete();
      }
    });
  }

  savePreferences(request: PreferencesRequest): Observable<PreferencesResponse> {
    return new Observable(observer => {
      try {
        console.log('💾 Saving preferences:', request.preferences);
        
        const prefsJson = JSON.stringify(request.preferences);
        console.log('📝 Preferences JSON:', prefsJson);
        
        // Save to localStorage
        localStorage.setItem(PREFERENCES_STORAGE.LOCAL_STORAGE_KEY, prefsJson);
        console.log('✅ Saved to localStorage with key:', PREFERENCES_STORAGE.LOCAL_STORAGE_KEY);
        
        // Verify localStorage save
        const verify = localStorage.getItem(PREFERENCES_STORAGE.LOCAL_STORAGE_KEY);
        console.log('🔍 Verification read from localStorage:', verify);
        
        // Also save to cookie as backup
        this.setCookie(
          PREFERENCES_STORAGE.COOKIE_NAME, 
          encodeURIComponent(prefsJson), 
          PREFERENCES_STORAGE.COOKIE_DAYS
        );
        console.log('🍪 Saved to cookie with name:', PREFERENCES_STORAGE.COOKIE_NAME);
        
        observer.next({ 
          preferences: request.preferences, 
          saved: true 
        });
        observer.complete();
      } catch (error) {
        console.error('❌ Failed to save preferences:', error);
        observer.next({ 
          preferences: request.preferences, 
          saved: false 
        });
        observer.complete();
      }
    });
  }

  resetToDefaults(): Observable<PreferencesResponse> {
    return new Observable(observer => {
      try {
        // Clear stored preferences
        localStorage.removeItem(PREFERENCES_STORAGE.LOCAL_STORAGE_KEY);
        this.deleteCookie(PREFERENCES_STORAGE.COOKIE_NAME);
        
        observer.next({ 
          preferences: DEFAULT_PREFERENCES, 
          saved: true 
        });
        observer.complete();
      } catch (error) {
        console.error('Failed to reset preferences:', error);
        observer.next({ 
          preferences: DEFAULT_PREFERENCES, 
          saved: false 
        });
        observer.complete();
      }
    });
  }

  validatePreferences(preferences: AppPreferences): Observable<boolean> {
    return new Observable(observer => {
      try {
        // Basic validation logic
        const isValid = this.isValidPreferences(preferences);
        observer.next(isValid);
        observer.complete();
      } catch (error) {
        observer.next(false);
        observer.complete();
      }
    });
  }

  private isValidPreferences(preferences: AppPreferences): boolean {
    if (!preferences) return false;
    
    // Validate undo levels
    if (preferences.undoLevels < 1 || preferences.undoLevels > 50) return false;
    
    // Validate auto save interval
    if (preferences.autoSaveInterval < 1 || preferences.autoSaveInterval > 60) return false;
    
    // Validate theme
    if (!['light', 'dark', 'auto'].includes(preferences.theme)) return false;
    
    // Validate booleans
    if (typeof preferences.autoSave !== 'boolean') return false;
    if (typeof preferences.showTooltips !== 'boolean') return false;
    if (typeof preferences.confirmDeleteActions !== 'boolean') return false;
    if (typeof preferences.showWelcomeOnStartup !== 'boolean') return false;
    
    return true;
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

  private deleteCookie(name: string): void {
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
  }
}
