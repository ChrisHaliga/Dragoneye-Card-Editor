import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

import { CardData } from '../../../core/models/card.model';
import { CardDataService } from '../../card-management/services/card-data.service';
import { FileStateService } from '../services/file-state.service';
import { CardApiRepository } from '../../../core/repositories/http/card-api.repository';
import { FileApiRepository } from '../../../core/repositories/http/file-api.repository';
import { LoadResult } from '../../../core/models/api.model';

@Injectable({
  providedIn: 'root'
})
export class LoadActions {

  constructor(
    private cardDataService: CardDataService,
    private fileStateService: FileStateService,
    private cardApiRepository: CardApiRepository,
    private fileApiRepository: FileApiRepository
  ) {}

  loadFile(filename: string): Observable<LoadResult> {
    return new Observable(observer => {
      this.cardApiRepository.loadCardDataFromFile(filename).subscribe({
        next: (cardData) => {
          this.cardDataService.setCardData(cardData);
          this.fileStateService.setCurrentFilename(filename);
          this.fileStateService.markAsSaved();
          
          observer.next({
            success: true,
            cardData,
            filename
          });
          observer.complete();
        },
        error: (error) => {
          observer.next({
            success: false,
            error: `Failed to load file '${filename}': ${error.message || 'Unknown error'}`
          });
          observer.complete();
        }
      });
    });
  }

  loadCurrentFile(): Observable<LoadResult> {
    return new Observable(observer => {
      this.cardApiRepository.getCardData().subscribe({
        next: (cardData) => {
          this.cardDataService.setCardData(cardData);
          this.fileStateService.setCurrentFilename(cardData.filename);
          this.fileStateService.markAsSaved();
          
          observer.next({
            success: true,
            cardData,
            filename: cardData.filename
          });
          observer.complete();
        },
        error: (error) => {
          observer.next({
            success: false,
            error: `Failed to load current file: ${error.message || 'Unknown error'}`
          });
          observer.complete();
        }
      });
    });
  }

  getAvailableFiles(): Observable<string[]> {
    return this.cardApiRepository.getAvailableFiles().pipe(
      catchError(error => {
        console.error('Failed to get available files:', error);
        return of([]);
      })
    );
  }

  loadFileWithPrompt(): Observable<LoadResult> {
    return new Observable(observer => {
      this.getAvailableFiles().subscribe({
        next: (files) => {
          if (files.length === 0) {
            observer.next({
              success: false,
              error: 'No saved files available'
            });
            observer.complete();
            return;
          }

          // Create a simple selection dialog
          const fileList = files.map((file, index) => `${index + 1}. ${file}`).join('\n');
          const selection = prompt(`Select a file to load:\n\n${fileList}\n\nEnter the number (1-${files.length}):`);
          
          if (selection) {
            const index = parseInt(selection) - 1;
            if (index >= 0 && index < files.length) {
              const selectedFile = files[index];
              this.loadFile(selectedFile).subscribe({
                next: (result) => observer.next(result),
                error: (error) => observer.error(error),
                complete: () => observer.complete()
              });
            } else {
              observer.next({
                success: false,
                error: 'Invalid selection'
              });
              observer.complete();
            }
          } else {
            observer.next({
              success: false,
              error: 'Load cancelled'
            });
            observer.complete();
          }
        },
        error: (error) => {
          observer.next({
            success: false,
            error: `Failed to get file list: ${error.message || 'Unknown error'}`
          });
          observer.complete();
        }
      });
    });
  }

  loadFromUrl(url: string): Observable<LoadResult> {
    return this.fileApiRepository.loadFromUrl(url).pipe(
      map((cardData: CardData) => {
        this.cardDataService.setCardData(cardData);
        this.fileStateService.setCurrentFilename(this.extractFilenameFromUrl(url));
        this.fileStateService.markAsSaved();
        
        return {
          success: true,
          cardData,
          filename: this.extractFilenameFromUrl(url)
        };
      }),
      catchError(error => {
        console.error('Failed to load from URL:', error);
        return of({
          success: false,
          error: `Failed to load from URL: ${error.message || 'Unknown error'}`
        });
      })
    );
  }

  loadFromText(jsonText: string, filename?: string): Observable<LoadResult> {
    return new Observable(observer => {
      try {
        const cardData = JSON.parse(jsonText) as CardData;
        this.cardDataService.setCardData(cardData);
        
        const finalFilename = filename || this.fileStateService.currentState.currentFilename || 'imported.json';
        this.fileStateService.setCurrentFilename(finalFilename);
        this.fileStateService.markAsSaved();
        
        observer.next({
          success: true,
          cardData,
          filename: finalFilename
        });
        observer.complete();
      } catch (error: any) {
        observer.next({
          success: false,
          error: `Failed to parse JSON: ${error.message}`
        });
        observer.complete();
      }
    });
  }

  loadFromFile(file: File): Observable<LoadResult> {
    return new Observable(observer => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          const cardData = JSON.parse(content) as CardData;
          
          // Save the imported data to the backend
          this.cardApiRepository.saveCardData(cardData).subscribe({
            next: (savedData) => {
              this.cardDataService.setCardData(savedData);
              this.fileStateService.setCurrentFilename(savedData.filename);
              this.fileStateService.markAsSaved();
              
              observer.next({
                success: true,
                cardData: savedData,
                filename: savedData.filename
              });
              observer.complete();
            },
            error: (error) => {
              observer.next({
                success: false,
                error: `Failed to save imported data: ${error.message}`
              });
              observer.complete();
            }
          });
        } catch (error: any) {
          observer.next({
            success: false,
            error: `Failed to parse file: ${error.message}`
          });
          observer.complete();
        }
      };
      
      reader.onerror = () => {
        observer.next({
          success: false,
          error: 'Failed to read file'
        });
        observer.complete();
      };
      
      reader.readAsText(file);
    });
  }

  reloadCurrentFile(): Observable<LoadResult> {
    const currentFilename = this.fileStateService.currentState.currentFilename;
    
    if (!currentFilename || currentFilename === 'untitled.json') {
      return this.loadCurrentFile();
    }
    
    return this.loadFile(currentFilename);
  }

  private extractFilenameFromUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;
      const filename = pathname.substring(pathname.lastIndexOf('/') + 1);
      
      // If no filename found, create a default one
      if (!filename || filename === '') {
        return 'downloaded-data.json';
      }
      
      // Ensure it has .json extension
      if (!filename.toLowerCase().endsWith('.json')) {
        return filename + '.json';
      }
      
      return filename;
    } catch (error) {
      return 'downloaded-data.json';
    }
  }
}
