import { Component, Input, Output, EventEmitter } from '@angular/core';

import { Card, CardDetail } from '../../../core/models/card.model';
import { ElementService } from '../../../features/card-management/services/element.service';

interface DetailLayout {
  detail: CardDetail;
  yPosition: number;
  titleX: number;
  lines: { text: string }[];
}

@Component({
  selector: 'app-card-display',
  templateUrl: './card-display.component.html',
  styleUrls: ['./card-display.component.css'],
  standalone: false
})
export class CardDisplayComponent {
  @Input() card!: Card;
  @Input() groupIndex!: number;
  @Input() cardIndex!: number;
  @Input() isSelected = false;

  @Output() cardClick = new EventEmitter<void>();

  constructor(private elementService: ElementService) {}

  onCardClick(event?: Event): void {
    // Prevent event from bubbling to viewport (which might cause panning)
    if (event) {
      event.stopPropagation();
    }
    
    this.cardClick.emit();
  }

  getElementSymbol(elementKey: string): string {
    if (!elementKey) return '?';
    return this.elementService.getElementSymbol(elementKey);
  }

  getElementImagePath(elementKey: string): string {
    if (!elementKey) return '/runes/arc.png'; // Default fallback
    return this.elementService.getElementImagePath(elementKey);
  }

  getCardElements(card: Card): string[] {
    return card.elements || [];
  }

  // UI-only method to handle special element combinations for display
  getDisplayElements(card: Card): string[] {
    const elements = [...(card.elements || [])]; // Create a copy
    const displayElements: string[] = [];
    
    // Track which elements we've already processed
    const processed = new Set<string>();
    
    // Check for all 4 natural elements (earth, water, fire, air)
    const naturalElements = ['geo', 'hyd', 'pyr', 'aer'];
    const hasAllNatural = naturalElements.every(element => elements.includes(element));
    
    if (hasAllNatural) {
      displayElements.push('nat');
      naturalElements.forEach(element => processed.add(element));
    }
    
    // Check for light + dark combination
    const hasLightAndDark = elements.includes('lux') && elements.includes('nyx');
    
    if (hasLightAndDark) {
      displayElements.push('duo');
      processed.add('lux');
      processed.add('nyx');
    }
    
    // Add any remaining elements that weren't part of special combinations
    elements.forEach(element => {
      if (!processed.has(element)) {
        displayElements.push(element);
      }
    });
    
    return displayElements;
  }

  onElementImageError(event: Event): void {
    // Hide the image and show the fallback text
    const image = event.target as SVGImageElement;
    if (image) {
      image.style.display = 'none';
      // Find the fallback text element and show it
      const fallbackText = image.parentElement?.querySelector('.element-fallback-text') as SVGTextElement;
      if (fallbackText) {
        fallbackText.style.display = 'block';
      }
    }
  }

  getDetailLayoutsForCard(card: Card): DetailLayout[] {
    if (!card) return [];
    
    const layouts: DetailLayout[] = [];
    let currentY = 190;
    const visibleDetails = card.details.slice(0, 3);

    visibleDetails.forEach((detail, index) => {
      const titleX = 28 + Math.max(detail.apCost + detail.spCost, 0) * 8; // Reduced from 8 to 3
      const lines = this.wrapText(detail.details, 30, 6);
      
      layouts.push({
        detail,
        yPosition: currentY,
        titleX,
        lines
      });

      // Move down for next detail: name + lines + spacing
      currentY += 8 + (lines.length * 7) + 6;
    });

    return layouts;
  }

  getHiddenDetailsCountForCard(card: Card): number {
    if (!card) return 0;
    return Math.max(0, card.details.length - 3);
  }

  getCircles(count: number): any[] {
    return Array(count).fill(0);
  }

  private wrapText(text: string, maxLength: number, fontSize: number): { text: string }[] {
    const words = text.split(' ');
    const lines: { text: string }[] = [];
    let currentLine = '';

    words.forEach(word => {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      if (testLine.length <= 35) { // Increased to 35 - closer to using full width
        currentLine = testLine;
      } else {
        if (currentLine) {
          lines.push({ text: currentLine });
        }
        currentLine = word;
      }
    });

    if (currentLine) {
      lines.push({ text: currentLine });
    }

    return lines.slice(0, 3); // Limit to 3 lines max
  }
}
