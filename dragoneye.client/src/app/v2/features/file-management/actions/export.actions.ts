import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

import { ExportService } from '../services/export.service';
import { CardData } from '../../../core/models/card.model';
import { ExportResult } from '../../../core/models/api.model';

export interface ExportOptions {
  format: 'json' | 'svg' | 'pdf';
  filename?: string;
  selectedCardsOnly?: boolean;
  selectedCards?: number[];
}

@Injectable({
  providedIn: 'root'
})
export class ExportActions {

  constructor(private exportService: ExportService) {}

  exportAsJson(cardData: CardData, filename?: string): Observable<ExportResult> {
    return new Observable(observer => {
      try {
        const jsonContent = JSON.stringify(cardData, null, 2);
        const finalFilename = filename || `${cardData.filename || 'cards'}.json`;
        
        this.downloadFile(jsonContent, finalFilename, 'application/json');
        
        observer.next({
          success: true,
          filename: finalFilename,
          format: 'json',
          size: jsonContent.length
        });
        observer.complete();
      } catch (error: any) {
        observer.next({
          success: false,
          error: `Export failed: ${error.message}`
        });
        observer.complete();
      }
    });
  }

  exportAsSvg(cardData: CardData, selectedCardTitle?: string): Observable<ExportResult> {
    return new Observable(observer => {
      try {
        // For now, just export metadata as SVG comment
        const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="400" height="600">
  <!-- Card Data: ${cardData.filename} -->
  <!-- Cards: ${cardData.groups.length} groups -->
  <rect width="400" height="600" fill="white" stroke="black"/>
  <text x="200" y="300" text-anchor="middle" font-family="Arial" font-size="16">
    SVG Export Placeholder
  </text>
  <text x="200" y="320" text-anchor="middle" font-family="Arial" font-size="12">
    ${cardData.groups.length} groups, ${this.getTotalCardCount(cardData)} cards
  </text>
</svg>`;

        const filename = selectedCardTitle 
          ? `${selectedCardTitle}.svg`
          : `${cardData.filename || 'cards'}.svg`;
        
        this.downloadFile(svgContent, filename, 'image/svg+xml');
        
        observer.next({
          success: true,
          filename,
          format: 'svg',
          size: svgContent.length
        });
        observer.complete();
      } catch (error: any) {
        observer.next({
          success: false,
          error: `SVG export failed: ${error.message}`
        });
        observer.complete();
      }
    });
  }

  exportWithOptions(cardData: CardData, options: ExportOptions): Observable<ExportResult> {
    let filteredCardData = cardData;
    
    // Filter cards if needed
    if (options.selectedCardsOnly && options.selectedCards && options.selectedCards.length > 0) {
      // Filter implementation would go here
      console.log('Filtering cards:', options.selectedCards);
    }

    switch (options.format) {
      case 'json':
        return this.exportAsJson(filteredCardData, options.filename);
      case 'svg':
        return this.exportAsSvg(filteredCardData);
      case 'pdf':
        return this.exportAsPdf(filteredCardData, options.filename);
      default:
        return of({
          success: false,
          error: `Unsupported export format: ${options.format}`
        });
    }
  }

  private exportAsPdf(cardData: CardData, filename?: string): Observable<ExportResult> {
    return new Observable(observer => {
      observer.next({
        success: false,
        error: 'PDF export not yet implemented'
      });
      observer.complete();
    });
  }

  private downloadFile(content: string, filename: string, mimeType: string): void {
    const blob = new Blob([content], { type: mimeType });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }

  private getTotalCardCount(cardData: CardData): number {
    return cardData.groups.reduce((total, group) => total + group.cards.length, 0);
  }
}
