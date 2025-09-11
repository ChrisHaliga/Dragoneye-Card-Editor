import { ElementData } from '../../../core/models/element.model';
import { ELEMENT_SYMBOLS, ELEMENT_CSS_CLASSES, DEFAULT_ELEMENT_KEY, DEFAULT_ELEMENT_SYMBOL } from '../../../core/constants/elements.const';

export class ElementFormatter {
  
  /**
   * Format element for display with symbol and name
   */
  static formatElementDisplay(element: ElementData | string): string {
    const elementData = typeof element === 'string' 
      ? this.getElementData(element)
      : element;
    
    return `${elementData.symbol} ${elementData.name}`;
  }

  /**
   * Format element for compact display (symbol only)
   */
  static formatElementCompact(element: ElementData | string): string {
    const elementData = typeof element === 'string' 
      ? this.getElementData(element)
      : element;
    
    return elementData.symbol;
  }

  /**
   * Get element symbol from key
   */
  static getElementSymbol(elementKey: string): string {
    return ELEMENT_SYMBOLS[elementKey.toLowerCase()] || DEFAULT_ELEMENT_SYMBOL;
  }

  /**
   * Get element CSS class from key
   */
  static getElementCssClass(elementKey: string): string {
    return ELEMENT_CSS_CLASSES[elementKey.toLowerCase()] || 'element-default';
  }

  /**
   * Get element data object from key
   */
  static getElementData(elementKey: string): ElementData {
    const key = elementKey.toLowerCase();
    return {
      key,
      name: elementKey,
      symbol: ELEMENT_SYMBOLS[key] || DEFAULT_ELEMENT_SYMBOL,
      imagePath: `/images/elements/${key}.png` // Simple path construction
    };
  }

  /**
   * Format element for dropdown/select options
   */
  static formatElementOption(element: ElementData | string): { value: string; label: string; symbol: string } {
    const elementData = typeof element === 'string' 
      ? this.getElementData(element)
      : element;
    
    return {
      value: elementData.key,
      label: elementData.name,
      symbol: elementData.symbol
    };
  }

  /**
   * Generate CSS custom properties for element theming
   */
  static getElementCssVariables(elementKey: string): { [key: string]: string } {
    const colors = this.getElementColorPalette(elementKey);
    
    return {
      '--element-primary': colors.primary,
      '--element-secondary': colors.secondary,
      '--element-accent': colors.accent,
      '--element-text': colors.text,
      '--element-background': colors.background
    };
  }

  /**
   * Get color palette for element
   */
  static getElementColorPalette(elementKey: string): {
    primary: string;
    secondary: string;
    accent: string;
    text: string;
    background: string;
  } {
    const colorMaps: { [key: string]: any } = {
      'pyr': {
        primary: '#ff4444',
        secondary: '#ff6666',
        accent: '#ff8888',
        text: '#ffffff',
        background: '#ffeeee'
      },
      'hyd': {
        primary: '#4444ff',
        secondary: '#6666ff',
        accent: '#8888ff',
        text: '#ffffff',
        background: '#eeeeff'
      },
      'geo': {
        primary: '#44aa44',
        secondary: '#66bb66',
        accent: '#88cc88',
        text: '#ffffff',
        background: '#eeffee'
      },
      'aer': {
        primary: '#ffff44',
        secondary: '#ffff66',
        accent: '#ffff88',
        text: '#000000',
        background: '#ffffee'
      },
      'nyx': {
        primary: '#444444',
        secondary: '#666666',
        accent: '#888888',
        text: '#ffffff',
        background: '#f0f0f0'
      },
      'lux': {
        primary: '#ffaa44',
        secondary: '#ffbb66',
        accent: '#ffcc88',
        text: '#000000',
        background: '#fff8ee'
      },
      'arc': {
        primary: '#aa44ff',
        secondary: '#bb66ff',
        accent: '#cc88ff',
        text: '#ffffff',
        background: '#f8eeff'
      }
    };

    return colorMaps[elementKey.toLowerCase()] || colorMaps['arc'];
  }

  /**
   * Validate element key format
   */
  static isValidElementKey(elementKey: string): boolean {
    if (!elementKey || typeof elementKey !== 'string') {
      return false;
    }

    // Check if it's a known element
    return Object.keys(ELEMENT_SYMBOLS).includes(elementKey.toLowerCase());
  }

  /**
   * Suggest element key based on partial input
   */
  static suggestElementKey(partialKey: string): string[] {
    if (!partialKey) return Object.keys(ELEMENT_SYMBOLS);

    const lowerPartial = partialKey.toLowerCase();
    const suggestions: string[] = [];

    // Exact matches first
    for (const key of Object.keys(ELEMENT_SYMBOLS)) {
      if (key === lowerPartial) {
        suggestions.unshift(key);
      } else if (key.startsWith(lowerPartial)) {
        suggestions.push(key);
      }
    }

    // Partial matches
    for (const key of Object.keys(ELEMENT_SYMBOLS)) {
      if (key.includes(lowerPartial) && !suggestions.includes(key)) {
        suggestions.push(key);
      }
    }

    return suggestions;
  }

  /**
   * Format element for accessibility (screen readers)
   */
  static formatElementAccessible(element: ElementData | string): string {
    const elementData = typeof element === 'string' 
      ? this.getElementData(element)
      : element;
    
    return `${elementData.name} element`;
  }

  /**
   * Get element symbol by Unicode character
   */
  static getElementKeyBySymbol(symbol: string): string | null {
    for (const [key, elementSymbol] of Object.entries(ELEMENT_SYMBOLS)) {
      if (elementSymbol === symbol) {
        return key;
      }
    }
    return null;
  }

  /**
   * Generate element badge HTML
   */
  static generateElementBadge(elementKey: string, includeText: boolean = true): string {
    const elementData = this.getElementData(elementKey);
    const cssClass = this.getElementCssClass(elementKey);
    const textPart = includeText ? ` ${elementData.name}` : '';
    
    return `<span class="element-badge ${cssClass}">${elementData.symbol}${textPart}</span>`;
  }

  /**
   * Sort elements by display order
   */
  static sortElementsByOrder(elements: ElementData[]): ElementData[] {
    const order = ['pyr', 'hyd', 'geo', 'aer', 'lux', 'nyx', 'arc'];
    
    return elements.sort((a, b) => {
      const indexA = order.indexOf(a.key.toLowerCase());
      const indexB = order.indexOf(b.key.toLowerCase());
      
      // Unknown elements go to the end
      if (indexA === -1 && indexB === -1) {
        return a.key.localeCompare(b.key);
      }
      if (indexA === -1) return 1;
      if (indexB === -1) return -1;
      
      return indexA - indexB;
    });
  }

  /**
   * Get element type classification
   */
  static getElementType(elementKey: string): 'primary' | 'secondary' | 'special' {
    const primaryElements = ['pyr', 'hyd', 'geo', 'aer'];
    const specialElements = ['lux', 'nyx'];
    
    const key = elementKey.toLowerCase();
    
    if (primaryElements.includes(key)) {
      return 'primary';
    } else if (specialElements.includes(key)) {
      return 'special';
    } else {
      return 'secondary';
    }
  }

  /**
   * Get contrasting text color for element background
   */
  static getContrastingTextColor(elementKey: string): string {
    const palette = this.getElementColorPalette(elementKey);
    return palette.text;
  }

  /**
   * Generate element style object for dynamic styling
   */
  static getElementStyles(elementKey: string): { [key: string]: string } {
    const palette = this.getElementColorPalette(elementKey);
    const cssClass = this.getElementCssClass(elementKey);
    
    return {
      backgroundColor: palette.primary,
      color: palette.text,
      borderColor: palette.secondary,
      className: cssClass
    };
  }
}
