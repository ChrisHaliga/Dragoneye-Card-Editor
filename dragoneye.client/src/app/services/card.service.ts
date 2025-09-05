import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { CardApiService } from './card-api.service';
import { PreferencesService } from './preferences.service';

export interface CardDetail {
  name: string;
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

  constructor(
    private apiService: CardApiService,
    private preferencesService: PreferencesService
  ) {
    this.loadInitialData();
  }

  private async loadInitialData(): Promise<void> {
    try {
      const elements = await this.apiService.getElements().toPromise();
      if (elements) {
        this.elementsArrayCache = elements.map(el => ({
          ...el,
          symbol: this.elementSymbols.get(el.key) || el.key.charAt(0).toUpperCase()
        }));
        this.elementsMap = new Map(this.elementsArrayCache.map(el => [el.key, el]));
      }

      const cardData = await this.apiService.getCardData().toPromise();
      if (cardData) {
        this.cardDataSubject.next(cardData);
      }
    } catch (error) {
      console.error('Failed to load initial data:', error);
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

  /**
   * Update card data in memory only (no backend save)
   */
  updateCardDataInMemory(data: CardData): void {
    this.cardDataSubject.next(data);
  }

  /**
   * Update card data and save to backend
   */
  updateCardData(data: CardData): void {
    this.cardDataSubject.next(data);
    
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
    const data = { ...this.cardData };
    data.groups = [...data.groups, { name: 'New Group', cards: [], expanded: true }];
    this.updateCardDataInMemory(data);
  }

  removeGroup(index: number): void {
    if (this.cardData.groups.length <= 1) return;
    const data = { ...this.cardData };
    data.groups = data.groups.filter((_, i) => i !== index);
    this.updateCardDataInMemory(data);
  }

  duplicateGroup(index: number): void {
    const data = { ...this.cardData };
    const original = data.groups[index];
    const duplicate = {
      ...original,
      name: original.name + ' Copy',
      cards: original.cards.map(card => ({ 
        ...card, 
        details: card.details.map(detail => ({ ...detail }))
      }))
    };
    data.groups = [
      ...data.groups.slice(0, index + 1),
      duplicate,
      ...data.groups.slice(index + 1)
    ];
    this.updateCardDataInMemory(data);
  }

  toggleGroup(index: number): void {
    const data = { ...this.cardData };
    data.groups = data.groups.map((group, i) => 
      i === index ? { ...group, expanded: !group.expanded } : group
    );
    this.updateCardDataInMemory(data);
  }

  addCard(groupIndex: number): Card {
    const data = { ...this.cardData };
    const prefs = this.preferencesService.preferences;
    
    const newCard: Card = {
      title: 'New Card',
      type: prefs.defaultCardType,
      element: prefs.defaultElement,
      backgroundImage: '',
      details: [{ name: 'Action', details: 'Enter description here', apCost: 1, spCost: 0 }]
    };

    data.groups = data.groups.map((group, i) => 
      i === groupIndex 
        ? { ...group, cards: [...group.cards, newCard] }
        : group
    );
    
    this.updateCardDataInMemory(data);
    return newCard;
  }

  removeCard(groupIndex: number, cardIndex: number): void {
    const data = { ...this.cardData };
    data.groups = data.groups.map((group, i) => 
      i === groupIndex 
        ? { ...group, cards: group.cards.filter((_, j) => j !== cardIndex) }
        : group
    );
    this.updateCardDataInMemory(data);
  }

  duplicateCard(groupIndex: number, cardIndex: number): Card {
    const data = { ...this.cardData };
    const original = data.groups[groupIndex].cards[cardIndex];
    const duplicate = { 
      ...original, 
      title: original.title + ' Copy', 
      details: original.details.map(detail => ({ ...detail }))
    };

    data.groups = data.groups.map((group, i) => 
      i === groupIndex 
        ? { 
            ...group, 
            cards: [
              ...group.cards.slice(0, cardIndex + 1),
              duplicate,
              ...group.cards.slice(cardIndex + 1)
            ]
          }
        : group
    );
    
    this.updateCardDataInMemory(data);
    return duplicate;
  }

  addDetail(card: Card): CardDetail {
    const detail: CardDetail = { name: 'New Action', details: 'Enter description here', apCost: 1, spCost: 0 };
    
    const data = { ...this.cardData };
    data.groups = data.groups.map(group => ({
      ...group,
      cards: group.cards.map(c => 
        c === card 
          ? { ...c, details: [...c.details, detail] }
          : c
      )
    }));
    
    this.updateCardDataInMemory(data);
    return detail;
  }

  removeDetail(card: Card, index: number): void {
    if (card.details.length <= 1) return;
    
    const data = { ...this.cardData };
    data.groups = data.groups.map(group => ({
      ...group,
      cards: group.cards.map(c => 
        c === card 
          ? { ...c, details: c.details.filter((_, i) => i !== index) }
          : c
      )
    }));
    
    this.updateCardDataInMemory(data);
  }

  duplicateDetail(card: Card, index: number): CardDetail {
    const original = card.details[index];
    const duplicate = { ...original, name: original.name + ' Copy' };
    
    const data = { ...this.cardData };
    data.groups = data.groups.map(group => ({
      ...group,
      cards: group.cards.map(c => 
        c === card 
          ? { 
              ...c, 
              details: [
                ...c.details.slice(0, index + 1),
                duplicate,
                ...c.details.slice(index + 1)
              ]
            }
          : c
      )
    }));
    
    this.updateCardDataInMemory(data);
    return duplicate;
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

  exportData(): void {
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
          this.cardDataSubject.next(data);
          resolve();
        } catch {
          reject('Invalid JSON file');
        }
      };
      reader.readAsText(file);
      (event.target as HTMLInputElement).value = '';
    });
  }
}
