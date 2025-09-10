import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { CardData } from '../../../core/models/card.model';
import { ExportOptions, ExportRequest } from '../../../core/models/api.model';
import { FileApiRepository } from '../../../core/repositories/http/file-api.repository';

@Injectable({
  providedIn: 'root'
})
export class ExportService {

  constructor(private fileApiRepository: FileApiRepository) {}

  exportAsJson(cardData: CardData, filename?: string): void {
    const dataStr = JSON.stringify(cardData, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    this.downloadBlob(blob, filename || cardData.filename || 'card-data.json');
  }

  exportAsSvg(cardData: CardData, selectedCardTitle?: string): Observable<void> {
    const options: ExportOptions = {
      format: 'svg',
      includeImages: true
    };

    const request: ExportRequest = {
      cardData,
      options
    };

    return this.fileApiRepository.exportData(request).pipe(
      map(blob => {
        const filename = selectedCardTitle 
          ? `${this.sanitizeFilename(selectedCardTitle)}.svg`
          : 'card-export.svg';
        this.downloadBlob(blob, filename);
      })
    );
  }

  exportAsPdf(cardData: CardData, options?: Partial<ExportOptions>): Observable<void> {
    const exportOptions: ExportOptions = {
      format: 'pdf',
      includeImages: true,
      compressionLevel: 0.8,
      ...options
    };

    const request: ExportRequest = {
      cardData,
      options: exportOptions
    };

    return this.fileApiRepository.exportData(request).pipe(
      map(blob => {
        const filename = `${cardData.filename || 'card-data'}.pdf`;
        this.downloadBlob(blob, filename);
      })
    );
  }

  exportSelectedCards(cardData: CardData, selectedCards: number[], format: 'json' | 'svg' | 'pdf' = 'json'): Observable<void> {
    const options: ExportOptions = {
      format,
      includeImages: true,
      compressionLevel: format === 'pdf' ? 0.8 : undefined
    };

    const request: ExportRequest = {
      cardData,
      options,
      selectedCards
    };

    return this.fileApiRepository.exportData(request).pipe(
      map(blob => {
        const filename = `selected-cards.${format}`;
        this.downloadBlob(blob, filename);
      })
    );
  }

  importFromFile(file: File): Observable<CardData> {
    return this.fileApiRepository.importData(file);
  }

  validateImportFile(file: File): Observable<boolean> {
    return this.fileApiRepository.validateFile(file);
  }

  private downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up the URL object
    URL.revokeObjectURL(url);
  }

  private sanitizeFilename(filename: string): string {
    return filename
      .replace(/[^a-z0-9]/gi, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '')
      .toLowerCase();
  }
}
