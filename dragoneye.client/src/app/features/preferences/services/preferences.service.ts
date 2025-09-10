import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';

import { AppPreferences } from '../../../core/models/preferences.model';
import { PreferencesApiRepository } from '../../../core/repositories/http/preferences-api.repository';
import { DEFAULT_PREFERENCES } from '../../../core/constants/preferences.const';
import { ThemeService } from '../../../services/theme.service';

export interface PreferencesState {
  preferences: AppPreferences;
  isLoading: boolean;
  error?: string;
  isDefault: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class PreferencesService {
  private preferencesStateSubject = new BehaviorSubject<PreferencesState>({
    preferences: DEFAULT_PREFERENCES,
    isLoading: false,
    isDefault: true
  });

  public preferencesState$ = this.preferencesStateSubject.asObservable();
  public preferences$ = this.preferencesState$.pipe(
    map(state => state.preferences)
  );

  constructor(
    private preferencesApiRepository: PreferencesApiRepository,
    private themeService: ThemeService
  ) {
    console.log('🏗️ PreferencesService constructor - initializing...');
    
    // Subscribe to load preferences on initialization
    this.loadPreferences().subscribe({
      next: (preferences) => {
        console.log('✅ Initial preferences loaded successfully:', preferences);
      },
      error: (error) => {
        console.error('❌ Failed to load initial preferences:', error);
      }
    });
  }

  loadPreferences(): Observable<AppPreferences> {
    console.log('🔄 PreferencesService.loadPreferences called');
    this.updateState({ isLoading: true });

    return this.preferencesApiRepository.loadPreferences().pipe(
      map(response => {
        console.log('📥 Repository load response:', response);
        this.updateState({
          preferences: response.preferences,
          isLoading: false,
          isDefault: response.isDefault
        });
        
        // Apply theme from loaded preferences
        this.themeService.setTheme(response.preferences.theme as any);
        
        return response.preferences;
      }),
      catchError(error => {
        console.error('❌ Failed to load preferences in service:', error);
        this.updateState({
          preferences: DEFAULT_PREFERENCES,
          isLoading: false,
          isDefault: true
        });
        
        // Apply default theme
        this.themeService.setTheme(DEFAULT_PREFERENCES.theme as any);
        
        return [DEFAULT_PREFERENCES];
      })
    );
  }

  updatePreferences(preferences: AppPreferences): Observable<boolean> {
    console.log('🔄 PreferencesService.updatePreferences called with:', preferences);
    
    this.updateState({
      preferences: { ...preferences },
      isDefault: false
    });

    // Apply theme change immediately
    this.themeService.setTheme(preferences.theme as any);

    // Save to backend
    const request = { preferences };
    this.updateState({ isLoading: true });

    console.log('📤 Calling repository.savePreferences with request:', request);

    return this.preferencesApiRepository.savePreferences(request).pipe(
      map(response => {
        console.log('📥 Repository save response:', response);
        this.updateState({
          isLoading: false,
          isDefault: false
        });
        return response.saved;
      },
      catchError(error => {
        console.error('❌ Failed to save preferences in service:', error);
        this.updateState({ isLoading: false });
        throw error;
      })
      ));
  }

  updatePreferencesLocal(updates: Partial<AppPreferences>): void {
    const current = this.preferencesStateSubject.value.preferences;
    const updated = { ...current, ...updates };
    
    this.updateState({
      preferences: updated,
      isDefault: false
    });
  }

  savePreferences(): Observable<boolean> {
    const request = {
      preferences: this.preferencesStateSubject.value.preferences
    };

    this.updateState({ isLoading: true });

    return this.preferencesApiRepository.savePreferences(request).pipe(
      map(response => {
        this.updateState({
          isLoading: false,
          isDefault: false
        });
        return response.saved;
      }),
      catchError(error => {
        console.error('Failed to save preferences:', error);
        this.updateState({ isLoading: false });
        return [false];
      })
    );
  }

  resetToDefaults(): Observable<AppPreferences> {
    this.updateState({ isLoading: true });

    return this.preferencesApiRepository.resetToDefaults().pipe(
      map(response => {
        this.updateState({
          preferences: response.preferences,
          isLoading: false,
          isDefault: true
        });
        
        // Apply default theme
        this.themeService.setTheme(response.preferences.theme as any);
        
        return response.preferences;
      }),
      catchError(error => {
        console.error('Failed to reset preferences:', error);
        this.updateState({
          preferences: DEFAULT_PREFERENCES,
          isLoading: false,
          isDefault: true
        });
        
        // Apply default theme
        this.themeService.setTheme(DEFAULT_PREFERENCES.theme as any);
        
        return [DEFAULT_PREFERENCES];
      })
    );
  }

  // Get current preferences synchronously
  get currentPreferences(): AppPreferences {
    return this.preferencesStateSubject.value.preferences;
  }

  // Get current state synchronously  
  get currentState(): PreferencesState {
    return this.preferencesStateSubject.value;
  }

  private updateState(updates: Partial<PreferencesState>): void {
    const currentState = this.preferencesStateSubject.value;
    const newState = { ...currentState, ...updates };
    console.log('🔄 PreferencesService state update:', newState);
    this.preferencesStateSubject.next(newState);
  }
}
