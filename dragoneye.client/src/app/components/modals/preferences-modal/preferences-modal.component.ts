import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { ModalService } from '../../../features/ui-state/services/modal.service';
import { PreferencesService } from '../../../features/preferences/services/preferences.service';
import { ElementService } from '../../../features/card-management/services/element.service';
import { NotificationService } from '../../../features/ui-state/services/notification.service';
import { AppPreferences } from '../../../core/models/preferences.model';
import { ElementData } from '../../../core/models/element.model';

@Component({
  selector: 'app-preferences-modal',
  templateUrl: './preferences-modal.component.html',
  styleUrls: ['./preferences-modal.component.css'],
  standalone: false
})
export class PreferencesModalComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  isVisible = false;
  preferences: AppPreferences = {
    undoLevels: 10,
    autoSave: false,
    autoSaveInterval: 5,
    theme: 'auto',
    showTooltips: true,
    defaultElement: 'arc',
    defaultCardType: 'Action',
    confirmDeleteActions: true,
    showWelcomeOnStartup: true
  };
  
  originalPreferences: AppPreferences = { ...this.preferences };
  availableElements: ElementData[] = [];
  availableCardTypes = ['Action', 'Passive', 'Equipment', 'Consumable'];
  
  isLoading = false;
  hasUnsavedChanges = false;

  constructor(
    private modalService: ModalService,
    private preferencesService: PreferencesService,
    private elementService: ElementService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    // Subscribe to modal state
    this.modalService.modalState$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(state => {
      if (state.preferencesOpen && !this.isVisible) {
        this.show();
      } else if (!state.preferencesOpen && this.isVisible) {
        this.hide();
      }
    });

    // Load available elements
    this.loadElements();
    
    // Load current preferences
    this.loadPreferences();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private show(): void {
    this.isVisible = true;
    this.loadPreferences();
    this.checkForChanges();
  }

  private hide(): void {
    this.isVisible = false;
  }

  private loadElements(): void {
    this.elementService.getElements().subscribe({
      next: (elements: ElementData[]) => {
        this.availableElements = elements;
      },
      error: (error: any) => {
        console.error('Failed to load elements:', error);
        // Use fallback elements
        this.availableElements = [
          { key: 'pyr', name: 'Pyro', symbol: '🔥', imagePath: '/runes/pyr.png' },
          { key: 'hyd', name: 'Hydro', symbol: '💧', imagePath: '/runes/hyd.png' },
          { key: 'geo', name: 'Geo', symbol: '🌍', imagePath: '/runes/geo.png' },
          { key: 'aer', name: 'Aero', symbol: '💨', imagePath: '/runes/aer.png' },
          { key: 'nyx', name: 'Nyx', symbol: '🌑', imagePath: '/runes/nyx.png' },
          { key: 'lux', name: 'Lux', symbol: '☀️', imagePath: '/runes/lux.png' },
          { key: 'arc', name: 'Arcane', symbol: '✨', imagePath: '/runes/arc.png' }
        ];
      }
    });
  }

  private loadPreferences(): void {
    this.isLoading = true;
    
    this.preferencesService.preferences$.pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (prefs) => {
        this.preferences = { ...prefs };
        this.originalPreferences = { ...prefs };
        this.isLoading = false;
        this.checkForChanges();
      },
      error: (error) => {
        console.error('Failed to load preferences:', error);
        this.isLoading = false;
        this.notificationService.error('Failed to load preferences', error.message);
      }
    });
  }

  savePreferences(): void {
    if (!this.hasUnsavedChanges) {
      this.close();
      return;
    }

    this.isLoading = true;
    
    this.preferencesService.updatePreferences(this.preferences).subscribe({
      next: () => {
        this.originalPreferences = { ...this.preferences };
        this.hasUnsavedChanges = false;
        this.isLoading = false;
        this.notificationService.success('Preferences Saved', 'Your preferences have been updated successfully');
        this.close();
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Failed to save preferences:', error);
        this.notificationService.error('Save Failed', 'Failed to save preferences: ' + error.message);
      }
    });
  }

  resetToDefaults(): void {
    const confirmed = confirm('Reset all preferences to default values? This cannot be undone.');
    if (confirmed) {
      this.preferencesService.resetToDefaults().subscribe({
        next: (defaultPrefs) => {
          this.preferences = { ...defaultPrefs };
          this.notificationService.info('Preferences Reset', 'All preferences have been reset to default values');
          this.checkForChanges();
        },
        error: (error) => {
          console.error('Failed to reset preferences:', error);
          this.notificationService.error('Reset Failed', 'Failed to reset preferences: ' + error.message);
        }
      });
    }
  }

  cancel(): void {
    if (this.hasUnsavedChanges) {
      const confirmed = confirm('You have unsaved changes. Are you sure you want to cancel?');
      if (!confirmed) {
        return;
      }
    }
    
    // Revert changes
    this.preferences = { ...this.originalPreferences };
    this.hasUnsavedChanges = false;
    this.close();
  }

  close(): void {
    this.modalService.closePreferences();
  }

  onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.cancel();
    }
  }

  onThemeChange(): void {
    // Just mark as changed - no preview
    this.checkForChanges();
  }

  onPreferenceChange(): void {
    this.checkForChanges();
  }

  private checkForChanges(): void {
    this.hasUnsavedChanges = !this.preferencesEqual(this.preferences, this.originalPreferences);
  }

  private preferencesEqual(a: AppPreferences, b: AppPreferences): boolean {
    return JSON.stringify(a) === JSON.stringify(b);
  }

  // Validation helpers
  isUndoLevelsValid(): boolean {
    return this.preferences.undoLevels >= 1 && this.preferences.undoLevels <= 50;
  }

  isAutoSaveIntervalValid(): boolean {
    return this.preferences.autoSaveInterval >= 1 && this.preferences.autoSaveInterval <= 60;
  }

  canSave(): boolean {
    return this.hasUnsavedChanges && 
           this.isUndoLevelsValid() && 
           this.isAutoSaveIntervalValid() && 
           !this.isLoading;
  }
}
