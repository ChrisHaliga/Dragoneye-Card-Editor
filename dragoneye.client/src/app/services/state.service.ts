import { Injectable } from '@angular/core';
import { interval, startWith } from 'rxjs';
import { CardService } from './card.service';
import { ToastService } from './toast.service';
import { PreferencesService } from './preferences.service';

@Injectable({
  providedIn: 'root'
})
export class StateService {
  private autoSaveInterval?: number;
  private lastSaveTime = 0;
  private lastAutoSavedData = '';
  private currentAutoSaveSettings: { enabled: boolean; interval: number } | null = null;

  constructor(
    private cardService: CardService,
    private toastService: ToastService,
    private preferencesService: PreferencesService
  ) {
    this.setupAutoSave();
    this.watchPreferences();
  }

  async saveData(): Promise<void> {
    try {
      const cardData = this.cardService.cardData;
      const filename = cardData.filename || 'card-set.json';
      
      const exists = await this.cardService.checkFileExists(filename);
      if (exists) {
        return Promise.reject('file_exists');
      } else {
        await this.cardService.saveDataWithOverwrite();
        this.updateAutoSaveChecksum();
        this.toastService.show('File saved successfully!', 'success', 3000);
      }
    } catch (error) {
      this.toastService.show('Failed to save file', 'error', 4000);
      throw error;
    }
  }

  async saveAsData(filename: string): Promise<void> {
    try {
      const cardData = { ...this.cardService.cardData };
      cardData.filename = filename;
      
      const exists = await this.cardService.checkFileExists(filename);
      if (exists) {
        return Promise.reject('file_exists');
      } else {
        this.cardService.updateCardDataInMemory(cardData);
        await this.cardService.saveDataWithOverwrite();
        this.updateAutoSaveChecksum();
        this.toastService.show(`Saved as ${filename}!`, 'success', 3000);
      }
    } catch (error) {
      this.toastService.show('Failed to save file', 'error', 4000);
      throw error;
    }
  }

  async saveWithOverwrite(): Promise<void> {
    try {
      await this.cardService.saveDataWithOverwrite(true);
      this.updateAutoSaveChecksum();
      this.toastService.show('File saved successfully!', 'success', 3000);
    } catch (error) {
      this.toastService.show('Failed to save file', 'error', 4000);
      throw error;
    }
  }

  async saveAsWithOverwrite(filename: string): Promise<void> {
    try {
      const cardData = { ...this.cardService.cardData };
      cardData.filename = filename;
      this.cardService.updateCardDataInMemory(cardData);
      await this.cardService.saveDataWithOverwrite(true);
      this.updateAutoSaveChecksum();
      this.toastService.show(`Saved as ${filename}!`, 'success', 3000);
    } catch (error) {
      this.toastService.show('Failed to save file', 'error', 4000);
      throw error;
    }
  }

  async loadFile(filename: string): Promise<void> {
    try {
      this.clearAutoSaveInterval();
      await this.cardService.loadFile(filename);
      this.updateAutoSaveChecksum();
      this.toastService.show(`Loaded ${filename}`, 'success', 3000);
      setTimeout(() => this.setupAutoSave(), 1000);
    } catch (error) {
      this.toastService.show(`Failed to load ${filename}`, 'error', 4000);
      this.setupAutoSave();
      throw error;
    }
  }

  async importFile(event: Event): Promise<void> {
    try {
      this.clearAutoSaveInterval();
      await this.cardService.importFile(event);
      this.updateAutoSaveChecksum();
      this.toastService.show('File imported successfully!', 'success', 3000);
      setTimeout(() => this.setupAutoSave(), 1000);
    } catch (error) {
      this.toastService.show('Failed to import file', 'error', 4000);
      this.setupAutoSave();
      throw error;
    }
  }

  exportData(): void {
    try {
      this.cardService.exportData();
      this.toastService.show('File exported successfully!', 'success', 3000);
    } catch (error) {
      this.toastService.show('Failed to export file', 'error', 4000);
    }
  }

  exportAsSVG(cardTitle?: string): void {
    try {
      const svgElement = document.querySelector('.displayed-card') as SVGElement;
      if (!svgElement) {
        this.toastService.show('No card is currently displayed', 'warning', 4000);
        return;
      }

      const svgClone = svgElement.cloneNode(true) as SVGElement;
      const svgString = new XMLSerializer().serializeToString(svgClone);
      const blob = new Blob([svgString], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${cardTitle || 'card'}.svg`;
      link.click();
      URL.revokeObjectURL(url);

      this.toastService.show('Card exported as SVG!', 'success', 3000);
    } catch (error) {
      this.toastService.show('Failed to export SVG', 'error', 4000);
    }
  }

  deleteCard(groupIndex: number, cardIndex: number, cardTitle: string): void {
    this.cardService.removeCard(groupIndex, cardIndex);
    this.toastService.show(`Deleted "${cardTitle}"`, 'info', 2500);
  }

  duplicateCard(groupIndex: number, cardIndex: number, cardTitle: string): void {
    this.cardService.duplicateCard(groupIndex, cardIndex);
    this.toastService.show(`Duplicated "${cardTitle}"`, 'success', 2500);
  }

  addCard(groupIndex: number): void {
    const newCard = this.cardService.addCard(groupIndex);
    this.toastService.show(`Added "${newCard.title}"`, 'success', 2500);
  }

  refreshAutoSave(): void {
    this.currentAutoSaveSettings = null;
    this.setupAutoSave();
  }

  private setupAutoSave(): void {
    const prefs = this.preferencesService.preferences;
    this.clearAutoSaveInterval();

    if (prefs.autoSave) {
      const intervalMs = prefs.autoSaveInterval * 60 * 1000;
      this.autoSaveInterval = window.setInterval(() => {
        this.performAutoSave();
      }, intervalMs);
    }
  }

  private watchPreferences(): void {
    interval(5000).pipe(startWith(0)).subscribe(() => {
      const prefs = this.preferencesService.preferences;
      const newSettings = { enabled: prefs.autoSave, interval: prefs.autoSaveInterval };

      if (!this.currentAutoSaveSettings ||
          this.currentAutoSaveSettings.enabled !== newSettings.enabled ||
          this.currentAutoSaveSettings.interval !== newSettings.interval) {
        
        this.currentAutoSaveSettings = newSettings;
        this.setupAutoSave();
      }
    });
  }

  private clearAutoSaveInterval(): void {
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval);
      this.autoSaveInterval = undefined;
    }
  }

  private updateAutoSaveChecksum(): void {
    this.lastAutoSavedData = JSON.stringify(this.cardService.cardData);
  }

  private hasDataChanged(): boolean {
    const currentDataString = JSON.stringify(this.cardService.cardData);
    return this.lastAutoSavedData !== currentDataString;
  }

  private async performAutoSave(): Promise<void> {
    const now = Date.now();
    if (now - this.lastSaveTime < 2000 || !this.cardService.hasCards || !this.hasDataChanged()) {
      return;
    }

    try {
      this.lastSaveTime = now;
      this.toastService.showAutoSaveToast();
      
      const currentData = this.cardService.cardData;
      this.cardService.updateCardData(currentData);
      this.updateAutoSaveChecksum();
      
      setTimeout(() => this.toastService.show('Auto-saved', 'success', 2000), 1500);
    } catch (error) {
      console.error('Auto-save failed:', error);
      this.toastService.show('Auto-save failed', 'error', 3000);
    }
  }
}
