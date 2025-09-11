import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { ElementData } from '../../../core/models/element.model';
import { CardApiRepository } from '../../../core/repositories/http/card-api.repository';
import { ELEMENT_SYMBOLS, ELEMENT_IMAGES, ELEMENT_CSS_CLASSES, DEFAULT_ELEMENT_KEY, DEFAULT_ELEMENT_SYMBOL, DEFAULT_ELEMENT_IMAGE } from '../../../core/constants/elements.const';

@Injectable({
  providedIn: 'root'
})
export class ElementService {
  private elementsCache: ElementData[] = [];
  private elementsMap = new Map<string, ElementData>();

  constructor(private cardApiRepository: CardApiRepository) {
    this.loadElements();
  }

  get elements(): ElementData[] {
    return [...this.elementsCache];
  }

  private async loadElements(): Promise<void> {
    try {
      const elements = await this.cardApiRepository.getElements().toPromise();
      if (elements) {
        this.elementsCache = elements.map(el => ({
          ...el,
          symbol: ELEMENT_SYMBOLS[el.key] || el.key.charAt(0).toUpperCase(),
          imagePath: ELEMENT_IMAGES[el.key] || DEFAULT_ELEMENT_IMAGE
        }));
        this.elementsMap = new Map(this.elementsCache.map(el => [el.key, el]));
      }
    } catch (error) {
      console.error('Failed to load elements:', error);
      // Fallback to default elements
      this.createDefaultElements();
    }
  }

  private createDefaultElements(): void {
    this.elementsCache = Object.entries(ELEMENT_SYMBOLS).map(([key, symbol]) => ({
      key,
      name: key,
      symbol,
      imagePath: ELEMENT_IMAGES[key] || DEFAULT_ELEMENT_IMAGE
    }));
    this.elementsMap = new Map(this.elementsCache.map(el => [el.key, el]));
  }

  getElement(key: string): ElementData {
    const element = this.elementsMap.get(key.toLowerCase());
    if (element) {
      return element;
    }

    // Check if it's a special UI element (nat, duo) that might not be in the cache
    if (ELEMENT_SYMBOLS[key] && ELEMENT_IMAGES[key]) {
      return {
        key: key,
        name: key,
        symbol: ELEMENT_SYMBOLS[key],
        imagePath: ELEMENT_IMAGES[key]
      };
    }

    // Return default element if not found
    return {
      key: DEFAULT_ELEMENT_KEY,
      name: key,
      symbol: DEFAULT_ELEMENT_SYMBOL,
      imagePath: DEFAULT_ELEMENT_IMAGE
    };
  }

  getElementSymbol(key: string): string {
    return this.getElement(key).symbol;
  }

  getElementImagePath(key: string): string {
    return this.getElement(key).imagePath;
  }

  getElementName(key: string): string {
    return this.getElement(key).name;
  }

  getElementCssClass(key: string): string {
    const elementKey = this.getElement(key).key;
    return ELEMENT_CSS_CLASSES[elementKey] || 'element-default';
  }

  getElementDisplayData(key: string): ElementData {
    return this.getElement(key);
  }

  isValidElement(key: string): boolean {
    return this.elementsMap.has(key.toLowerCase());
  }

  getAllElementKeys(): string[] {
    return this.elementsCache.map(el => el.key);
  }

  getAllElementSymbols(): string[] {
    return this.elementsCache.map(el => el.symbol);
  }

  getElementBySymbol(symbol: string): ElementData | null {
    return this.elementsCache.find(el => el.symbol === symbol) || null;
  }

  searchElements(query: string): ElementData[] {
    const lowerQuery = query.toLowerCase();
    return this.elementsCache.filter(element =>
      element.key.toLowerCase().includes(lowerQuery) ||
      element.name.toLowerCase().includes(lowerQuery) ||
      element.symbol.includes(query)
    );
  }

  getElementsForDropdown(): Array<{ value: string; label: string; symbol: string }> {
    return this.elementsCache.map(element => ({
      value: element.key,
      label: element.name,
      symbol: element.symbol
    }));
  }

  getRandomElement(): ElementData {
    const randomIndex = Math.floor(Math.random() * this.elementsCache.length);
    return this.elementsCache[randomIndex] || this.getElement(DEFAULT_ELEMENT_KEY);
  }

  validateElementKey(key: string): { isValid: boolean; suggestion?: string } {
    if (this.isValidElement(key)) {
      return { isValid: true };
    }

    // Try to find a close match
    const lowerKey = key.toLowerCase();
    const suggestion = this.elementsCache.find(el =>
      el.key.toLowerCase().startsWith(lowerKey) ||
      el.name.toLowerCase().startsWith(lowerKey)
    );

    return {
      isValid: false,
      suggestion: suggestion?.key
    };
  }

  getElementStats(): { [key: string]: number } {
    const stats: { [key: string]: number } = {};
    this.elementsCache.forEach(element => {
      stats[element.key] = 0;
    });
    return stats;
  }

  getElements(): Observable<ElementData[]> {
    // Return cached elements immediately, or refresh if empty
    if (this.elementsCache.length > 0) {
      return new Observable(observer => {
        observer.next([...this.elementsCache]);
        observer.complete();
      });
    } else {
      return this.refreshElements();
    }
  }

  refreshElements(): Observable<ElementData[]> {
    return this.cardApiRepository.getElements().pipe(
      map(elements => {
        if (elements) {
          this.elementsCache = elements.map(el => ({
            ...el,
            symbol: ELEMENT_SYMBOLS[el.key] || el.key.charAt(0).toUpperCase(),
            imagePath: ELEMENT_IMAGES[el.key] || DEFAULT_ELEMENT_IMAGE
          }));
          this.elementsMap = new Map(this.elementsCache.map(el => [el.key, el]));
        }
        return this.elementsCache;
      })
    );
  }

  getDefaultElement(): ElementData {
    return this.getElement(DEFAULT_ELEMENT_KEY);
  }

  getElementHexColor(key: string): string {
    // Map element keys to hex colors for theming
    const colorMap: { [key: string]: string } = {
      'pyr': '#ff4444', // Red
      'hyd': '#4444ff', // Blue
      'geo': '#44aa44', // Green
      'aer': '#ffff44', // Yellow
      'nyx': '#444444', // Dark gray
      'lux': '#ffaa44', // Light orange
      'arc': '#aa44ff'  // Purple
    };

    const elementKey = this.getElement(key).key;
    return colorMap[elementKey] || '#888888';
  }
}
