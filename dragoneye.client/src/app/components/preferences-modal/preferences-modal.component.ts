import { Component, OnInit } from '@angular/core';
import { PreferencesService, AppPreferences } from '../../services/preferences.service';
import { CardService, ElementData } from '../../services/card.service';
import { ThemeService } from '../../services/theme.service';
import { StateService } from '../../services/state.service';

@Component({
  selector: 'app-preferences-modal',
  templateUrl: './preferences-modal.component.html',
  styleUrls: ['./preferences-modal.component.css'],
  standalone: false
})
export class PreferencesModalComponent implements OnInit {
  isVisible = false;
  preferences: AppPreferences;
  availableElements: ElementData[] = [];

  constructor(
    private preferencesService: PreferencesService,
    private cardService: CardService,
    private themeService: ThemeService,
    private stateService: StateService
  ) {
    this.preferences = this.preferencesService.preferences;
  }

  ngOnInit(): void {
    this.loadElements();
  }

  show(): void {
    this.preferences = this.preferencesService.preferences;
    this.loadElements();
    this.isVisible = true;
  }

  hide(): void {
    this.isVisible = false;
  }

  savePreferences(): void {
    this.preferencesService.updatePreferences(this.preferences);
    this.themeService.updateTheme(this.preferences.theme);
    this.stateService.refreshAutoSave();
    this.hide();
  }

  resetToDefaults(): void {
    if (confirm('Reset all preferences to default values? This cannot be undone.')) {
      this.preferencesService.resetToDefaults();
      this.preferences = this.preferencesService.preferences;
      this.themeService.updateTheme(this.preferences.theme);
      this.stateService.refreshAutoSave();
    }
  }

  cancel(): void {
    this.preferences = this.preferencesService.preferences;
    this.hide();
  }

  onThemeChange(): void {
    this.themeService.updateTheme(this.preferences.theme);
  }

  private loadElements(): void {
    this.availableElements = this.cardService.elementsArray;
    if (this.availableElements.length === 0) {
      setTimeout(() => this.loadElements(), 100);
    }
  }
}
