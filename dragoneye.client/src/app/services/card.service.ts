import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { CardApiService } from './card-api.service';

export interface CardDetail {
  type: string;
  details: string;
  apCost: number;
  spCost: number;
}

export interface Card {
  title: string;
  type: string;
  element: string;
  backgroundImage?: string;
  details: CardDetail[];
}

export interface CardGroup {
  name: string;
  cards: Card[];
  expanded?: boolean;
}

export interface CardData {
  filename: string;
  groups: CardGroup[];
}

export interface ElementData {
  key: string;
  name: string;
  symbol: string;
}

@Injectable({ providedIn: 'root' })
export class CardService {
  private readonly elementSymbols = new Map<string, string>([
    ['pyr', '🔥'],
    ['hyd', '💧'],
    ['geo', '🌍'],
    ['aer', '💨'],
    ['nyx', '🌑'],
    ['lux', '☀️'],
    ['arc', '✶']
  ]);

  private elementsMap = new Map<string, ElementData>();
  private elementsArrayCache: ElementData[] = [];

  private cardDataSubject = new BehaviorSubject<CardData>({
    filename: '',
    groups: []
  });

  public cardData$: Observable<CardData> = this.cardDataSubject.asObservable();

  constructor(private apiService: CardApiService) {
    this.loadInitialData();
  }

  private async loadInitialData(): Promise<void> {
    try {
      // Load elements from backend and map symbols
      const elements = await this.apiService.getElements().toPromise();
      if (elements) {
        this.elementsArrayCache = elements.map(el => ({
          ...el,
          symbol: this.elementSymbols.get(el.key) || el.key.charAt(0).toUpperCase()
        }));
        this.elementsMap = new Map(this.elementsArrayCache.map(el => [el.key, el]));
      }

      // Load card data
      const cardData = await this.apiService.getCardData().toPromise();
      if (cardData) {
        this.cardDataSubject.next(cardData);
      }
    } catch (error) {
      console.error('Failed to load initial data:', error);
      // Fallback to empty state
      this.cardDataSubject.next({ filename: 'my-card-set.json', groups: [] });
    }
  }

  get cardData(): CardData { return this.cardDataSubject.value; }
  get elementsArray(): ElementData[] { return this.elementsArrayCache; }
  get hasCards(): boolean { return this.cardData.groups.some(group => group.cards.length > 0); }

  getElement(key: string): ElementData {
    return this.elementsMap.get(key.toLowerCase()) || { 
      key: 'arc', 
      name: key, 
      symbol: this.elementSymbols.get('arc') || '✶'
    };
  }

  getElementSymbol(key: string): string { return this.getElement(key).symbol; }
  getElementName(key: string): string { return this.getElement(key).name; }
  getElementCssClass(key: string): string { return this.getElement(key).key; }

  updateCardData(data: CardData): void {
    this.cardDataSubject.next(data);
    // Save to backend
    this.apiService.updateCardData(data).subscribe({
      next: (savedData) => {
        console.log('Data saved to backend');
      },
      error: (error) => {
        console.error('Failed to save data to backend:', error);
      }
    });
  }

  addGroup(): void {
    const data = this.cardData;
    data.groups.push({ name: 'New Group', cards: [], expanded: true });
    this.updateCardData(data);
  }

  removeGroup(index: number): void {
    if (this.cardData.groups.length <= 1) return;
    const data = this.cardData;
    data.groups.splice(index, 1);
    this.updateCardData(data);
  }

  duplicateGroup(index: number): void {
    const data = this.cardData;
    const original = data.groups[index];
    const duplicate = {
      ...original,
      name: original.name + ' Copy',
      cards: original.cards.map(card => ({ ...card, details: [...card.details] }))
    };
    data.groups.splice(index + 1, 0, duplicate);
    this.updateCardData(data);
  }

  toggleGroup(index: number): void {
    const data = this.cardData;
    data.groups[index].expanded = !data.groups[index].expanded;
    this.updateCardData(data);
  }

  addCard(groupIndex: number): Card {
    const data = this.cardData;
    const newCard: Card = {
      title: 'New Card',
      type: 'Creature',
      element: 'arc',
      backgroundImage: '',
      details: [{ type: 'Action', details: 'Enter description here', apCost: 1, spCost: 0 }]
    };
    data.groups[groupIndex].cards.push(newCard);
    this.updateCardData(data);
    return newCard;
  }

  removeCard(groupIndex: number, cardIndex: number): void {
    const data = this.cardData;
    data.groups[groupIndex].cards.splice(cardIndex, 1);
    this.updateCardData(data);
  }

  duplicateCard(groupIndex: number, cardIndex: number): Card {
    const data = this.cardData;
    const original = data.groups[groupIndex].cards[cardIndex];
    const duplicate = { ...original, title: original.title + ' Copy', details: [...original.details] };
    data.groups[groupIndex].cards.splice(cardIndex + 1, 0, duplicate);
    this.updateCardData(data);
    return duplicate;
  }

  addDetail(card: Card): CardDetail {
    const detail: CardDetail = { type: 'New Action', details: 'Enter description here', apCost: 1, spCost: 0 };
    card.details.push(detail);
    this.updateCardData(this.cardData);
    return detail;
  }

  removeDetail(card: Card, index: number): void {
    if (card.details.length <= 1) return;
    card.details.splice(index, 1);
    this.updateCardData(this.cardData);
  }

  duplicateDetail(card: Card, index: number): CardDetail {
    const original = card.details[index];
    const duplicate = { ...original, type: original.type + ' Copy' };
    card.details.splice(index + 1, 0, duplicate);
    this.updateCardData(this.cardData);
    return duplicate;
  }

  saveData(): void {
    // Save to backend via API (uses POST for new save with unique filename)
    this.apiService.saveCardData(this.cardData).subscribe({
      next: (savedData) => {
        console.log('Data saved to backend');
        this.cardDataSubject.next(savedData);
        // Could show a success toast here
      },
      error: (error) => {
        console.error('Failed to save data to backend:', error);
        // Could show an error toast here
      }
    });
  }

  exportData(): void {
    // Export as JSON file download
    const dataStr = JSON.stringify(this.cardData, null, 2);
    const url = URL.createObjectURL(new Blob([dataStr], { type: 'application/json' }));
    const link = Object.assign(document.createElement('a'), {
      href: url,
      download: this.cardData.filename || 'card-data.json'
    });
    link.click();
    URL.revokeObjectURL(url);
  }

  importFile(event: Event): Promise<void> {
    // Import from JSON file upload
    return new Promise((resolve, reject) => {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (!file?.type.includes('json')) {
        reject('Invalid file type');
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target?.result as string);
          this.updateCardData(data);
          resolve();
        } catch {
          reject('Invalid JSON file');
        }
      };
      reader.readAsText(file);
      (event.target as HTMLInputElement).value = '';
    });
  }

  loadFile(filename: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.apiService.getCardDataByFilename(filename).subscribe({
        next: (data) => {
          this.cardDataSubject.next(data);
          resolve();
        },
        error: (error) => {
          console.error('Failed to load file:', error);
          reject(error);
        }
      });
    });
  }

  async checkFileExists(filename: string): Promise<boolean> {
    try {
      const result = await this.apiService.fileExists(filename).toPromise();
      return result || false;
    } catch (error) {
      console.error('Error checking file existence:', error);
      return false;
    }
  }

  saveDataWithOverwrite(allowOverwrite: boolean = false): Promise<void> {
    return new Promise((resolve, reject) => {
      this.apiService.saveCardData(this.cardData).subscribe({
        next: (savedData) => {
          console.log('Data saved to backend');
          this.cardDataSubject.next(savedData);
          resolve();
        },
        error: (error) => {
          console.error('Failed to save data to backend:', error);
          reject(error);
        }
      });
    });
  }
}
