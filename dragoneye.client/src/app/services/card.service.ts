import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

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
  private readonly elements = new Map<string, ElementData>([
    ['fire', { key: 'fire', name: 'Fire', symbol: '🔥' }],
    ['water', { key: 'water', name: 'Water', symbol: '💧' }],
    ['earth', { key: 'earth', name: 'Earth', symbol: '🌍' }],
    ['air', { key: 'air', name: 'Air', symbol: '💨' }],
    ['dark', { key: 'dark', name: 'Dark', symbol: '🌑' }],
    ['light', { key: 'light', name: 'Light', symbol: '☀️' }],
    ['arcane', { key: 'arcane', name: 'Arcane', symbol: '✶' }]
  ]);

  private cardDataSubject = new BehaviorSubject<CardData>({
    filename: 'my-card-set.json',
    groups: [{
      name: 'Fire Cards',
      expanded: true,
      cards: [{
        title: 'Flame Strike',
        type: 'Spell',
        element: 'fire',
        backgroundImage: '',
        details: [{ type: 'Attack', details: 'Deal 3 damage to target enemy', apCost: 2, spCost: 1 }]
      }]
    }]
  });

  public cardData$: Observable<CardData> = this.cardDataSubject.asObservable();

  get cardData(): CardData { return this.cardDataSubject.value; }
  get elementsArray(): ElementData[] { return Array.from(this.elements.values()); }
  get hasCards(): boolean { return this.cardData.groups.some(group => group.cards.length > 0); }

  getElement(key: string): ElementData {
    return this.elements.get(key.toLowerCase()) || { key: 'arcane', name: key, symbol: key.charAt(0).toUpperCase() };
  }

  getElementSymbol(key: string): string { return this.getElement(key).symbol; }
  getElementName(key: string): string { return this.getElement(key).name; }
  getElementCssClass(key: string): string { return this.getElement(key).key; }

  updateCardData(data: CardData): void {
    this.cardDataSubject.next(data);
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
      element: 'arcane',
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
    const dataStr = JSON.stringify(this.cardData, null, 2);
    const url = URL.createObjectURL(new Blob([dataStr], { type: 'application/json' }));
    const link = Object.assign(document.createElement('a'), {
      href: url,
      download: this.cardData.filename || 'card-data.json'
    });
    link.click();
    URL.revokeObjectURL(url);
  }

  loadFile(event: Event): Promise<void> {
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
}
