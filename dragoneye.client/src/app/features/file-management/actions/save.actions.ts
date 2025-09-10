// Save actions

import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

import { CardData } from '../../../core/models/card.model';
import { SaveResult, SaveRequest, SaveResponse } from '../../../core/models/api.model';
import { CardDataService } from '../../card-management/services/card-data.service';
import { FileStateService } from '../services/file-state.service';
import { CardApiRepository } from '../../../core/repositories/http/card-api.repository';
import { FileApiRepository } from '../../../core/repositories/http/file-api.repository';

export interface SaveOptions {
  allowOverwrite?: boolean;
  createBackup?: boolean;
  format?: 'json' | 'compact';
}

@Injectable({
  providedIn: 'root'
})
export class SaveActions {

  constructor(
    private cardDataService: CardDataService,
    private fileStateService: FileStateService,
    private cardApiRepository: CardApiRepository,
    private fileApiRepository: FileApiRepository
  ) {}

  saveCurrentFile(): Observable<SaveResult> {
    return new Observable(observer => {
      const cardData = this.cardDataService.currentCardData;
      const currentFilename = this.fileStateService.currentState.currentFilename;
      
      if (currentFilename && currentFilename !== 'untitled.json') {
        // Update existing file
        this.cardApiRepository.updateCardData(cardData).subscribe({
          next: (savedData) => {
            this.fileStateService.markAsSaved();
            observer.next({
              success: true,
              filename: savedData.filename
            });
            observer.complete();
          },
          error: (error) => {
            observer.next({
              success: false,
              error: error.message || 'Failed to save file'
            });
            observer.complete();
          }
        });
      } else {
        // Need to save as new file
        observer.next({
          success: false,
          error: 'No filename set. Please use Save As instead.'
        });
        observer.complete();
      }
    });
  }

  saveFile(cardData: CardData, filename?: string): Observable<SaveResult> {
    return new Observable(observer => {
      const finalFilename = filename || this.fileStateService.currentState.currentFilename || 'untitled.json';
      
      // Set the filename in the card data
      const dataToSave = { ...cardData, filename: finalFilename };
      
      this.cardApiRepository.saveCardData(dataToSave).subscribe({
        next: (savedData) => {
          this.fileStateService.setCurrentFilename(savedData.filename);
          this.fileStateService.markAsSaved();
          
          observer.next({
            success: true,
            filename: savedData.filename
          });
          observer.complete();
        },
        error: (error) => {
          observer.next({
            success: false,
            error: error.message || 'Failed to save file'
          });
          observer.complete();
        }
      });
    });
  }

  save(cardData: CardData, options: SaveOptions = {}): Observable<SaveResult> {
    const currentFilename = this.fileStateService.currentState.currentFilename;
    
    if (!currentFilename || currentFilename === 'untitled.json') {
      return throwError(() => new Error('No filename set for save operation. Use saveAs instead.'));
    }

    return this.saveFile(cardData, currentFilename);
  }

  saveAs(cardData: CardData, filename: string): Observable<SaveResult> {
    return new Observable(observer => {
      // Ensure filename has .json extension
      const finalFilename = filename.endsWith('.json') ? filename : filename + '.json';
      
      // Check if file already exists
      this.cardApiRepository.fileExists(finalFilename).subscribe({
        next: (exists) => {
          if (exists) {
            observer.next({
              success: false,
              error: `File '${finalFilename}' already exists. Please choose a different name.`,
              fileExists: true
            });
            observer.complete();
          } else {
            // File doesn't exist, proceed with save
            this.saveFile(cardData, finalFilename).subscribe({
              next: (result) => observer.next(result),
              error: (error) => observer.error(error),
              complete: () => observer.complete()
            });
          }
        },
        error: (error) => {
          // If check fails, try to save anyway
          this.saveFile(cardData, finalFilename).subscribe({
            next: (result) => observer.next(result),
            error: (error) => observer.error(error),
            complete: () => observer.complete()
          });
        }
      });
    });
  }

  saveWithOverwrite(cardData: CardData, filename?: string): Observable<SaveResult> {
    const finalFilename = filename || this.fileStateService.currentState.currentFilename;
    
    if (!finalFilename) {
      return throwError(() => new Error('No filename provided for save operation'));
    }

    return this.saveFile(cardData, finalFilename);
  }

  checkFileExists(filename: string): Observable<boolean> {
    return this.cardApiRepository.fileExists(filename);
  }

  validateFilename(filename: string): { isValid: boolean; error?: string } {
    if (!filename || filename.trim().length === 0) {
      return { isValid: false, error: 'Filename cannot be empty' };
    }

    if (filename.length > 255) {
      return { isValid: false, error: 'Filename is too long' };
    }

    // Check for invalid characters
    const invalidChars = /[<>:"/\\|?*]/;
    if (invalidChars.test(filename)) {
      return { isValid: false, error: 'Filename contains invalid characters' };
    }

    // Ensure .json extension
    if (!filename.toLowerCase().endsWith('.json')) {
      return { isValid: false, error: 'Filename must end with .json' };
    }

    return { isValid: true };
  }

  sanitizeFilename(filename: string): string {
    let sanitized = filename.trim();
    
    // Remove invalid characters
    sanitized = sanitized.replace(/[<>:"/\\|?*]/g, '_');
    
    // Ensure .json extension
    if (!sanitized.toLowerCase().endsWith('.json')) {
      sanitized += '.json';
    }
    
    return sanitized;
  }
}
