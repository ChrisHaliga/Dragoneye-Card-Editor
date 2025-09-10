import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

import { ICardApiRepository } from '../interfaces/card-api.interface';
import { CardData, Card, CardGroup } from '../../models/card.model';
import { ElementData } from '../../models/element.model';

@Injectable({
  providedIn: 'root'
})
export class CardApiRepository implements ICardApiRepository {
  private readonly baseUrl = '/api/cards';

  constructor(private http: HttpClient) {}

  // Card data operations
  getCardData(): Observable<CardData> {
    return this.http.get<CardData>(this.baseUrl).pipe(
      catchError(error => {
        console.error('Failed to get card data:', error);
        return throwError(() => new Error(`Failed to get card data: ${error.message || 'Unknown error'}`));
      })
    );
  }

  saveCardData(cardData: CardData): Observable<CardData> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });
    
    return this.http.post<CardData>(this.baseUrl, cardData, { headers }).pipe(
      catchError(error => {
        console.error('Failed to save card data:', error);
        return throwError(() => new Error(`Failed to save card data: ${error.message || 'Unknown error'}`));
      })
    );
  }

  updateCardData(cardData: CardData): Observable<CardData> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });
    
    return this.http.put<CardData>(this.baseUrl, cardData, { headers }).pipe(
      catchError(error => {
        console.error('Failed to update card data:', error);
        return throwError(() => new Error(`Failed to update card data: ${error.message || 'Unknown error'}`));
      })
    );
  }

  // File operations
  fileExists(filename: string): Observable<boolean> {
    const encodedFilename = encodeURIComponent(filename);
    return this.http.get<boolean>(`${this.baseUrl}/exists/${encodedFilename}`).pipe(
      catchError(error => {
        console.error('Failed to check file existence:', error);
        return throwError(() => new Error(`Failed to check file existence: ${error.message || 'Unknown error'}`));
      })
    );
  }

  getAvailableFiles(): Observable<string[]> {
    return this.http.get<string[]>(`${this.baseUrl}/files`).pipe(
      catchError(error => {
        console.error('Failed to get available files:', error);
        return throwError(() => new Error(`Failed to get available files: ${error.message || 'Unknown error'}`));
      })
    );
  }

  loadCardDataFromFile(filename: string): Observable<CardData> {
    const encodedFilename = encodeURIComponent(filename);
    return this.http.get<CardData>(`${this.baseUrl}/${encodedFilename}`).pipe(
      catchError(error => {
        console.error('Failed to load card data from file:', error);
        return throwError(() => new Error(`Failed to load card data from file: ${error.message || 'Unknown error'}`));
      })
    );
  }

  deleteCardDataFile(filename: string): Observable<void> {
    const encodedFilename = encodeURIComponent(filename);
    return this.http.delete<void>(`${this.baseUrl}/${encodedFilename}`).pipe(
      catchError(error => {
        console.error('Failed to delete card data file:', error);
        return throwError(() => new Error(`Failed to delete card data file: ${error.message || 'Unknown error'}`));
      })
    );
  }

  // Element operations
  getElements(): Observable<ElementData[]> {
    return this.http.get<ElementData[]>(`${this.baseUrl}/elements`).pipe(
      catchError(error => {
        console.error('Failed to get elements:', error);
        return throwError(() => new Error(`Failed to get elements: ${error.message || 'Unknown error'}`));
      })
    );
  }

  // Validation operations
  validateCard(card: Card): Observable<{ isValid: boolean; errors: string[] }> {
    // Client-side validation for now - could be extended to server-side
    const errors: string[] = [];

    if (!card.title || card.title.trim().length === 0) {
      errors.push('Card title is required');
    }

    if (!card.type || card.type.trim().length === 0) {
      errors.push('Card type is required');
    }

    if (!card.element || card.element.trim().length === 0) {
      errors.push('Card element is required');
    }

    if (!card.details || card.details.length === 0) {
      errors.push('Card must have at least one detail');
    }

    return new Observable(observer => {
      observer.next({
        isValid: errors.length === 0,
        errors
      });
      observer.complete();
    });
  }

  validateCardData(cardData: CardData): Observable<{ isValid: boolean; errors: string[] }> {
    const errors: string[] = [];

    if (!cardData.filename || cardData.filename.trim().length === 0) {
      errors.push('Filename is required');
    }

    if (!cardData.groups || cardData.groups.length === 0) {
      errors.push('Card data must have at least one group');
    }

    // Validate each group
    cardData.groups.forEach((group, groupIndex) => {
      if (!group.name || group.name.trim().length === 0) {
        errors.push(`Group ${groupIndex + 1} must have a name`);
      }
    });

    return new Observable(observer => {
      observer.next({
        isValid: errors.length === 0,
        errors
      });
      observer.complete();
    });
  }

  // Search operations
  searchCards(query: string): Observable<{ groupIndex: number; cardIndex: number; card: Card }[]> {
    return this.getCardData().pipe(
      map(cardData => {
        const results: { groupIndex: number; cardIndex: number; card: Card }[] = [];
        const lowerQuery = query.toLowerCase();

        cardData.groups.forEach((group, groupIndex) => {
          group.cards.forEach((card, cardIndex) => {
            if (
              card.title.toLowerCase().includes(lowerQuery) ||
              card.type.toLowerCase().includes(lowerQuery) ||
              card.element.toLowerCase().includes(lowerQuery) ||
              card.details.some(detail =>
                detail.name.toLowerCase().includes(lowerQuery) ||
                detail.details.toLowerCase().includes(lowerQuery)
              )
            ) {
              results.push({ groupIndex, cardIndex, card });
            }
          });
        });

        return results;
      }),
      catchError(error => {
        console.error('Failed to search cards:', error);
        return throwError(() => new Error(`Failed to search cards: ${error.message || 'Unknown error'}`));
      })
    );
  }

  // Statistics operations
  getCardStatistics(): Observable<{
    totalCards: number;
    totalGroups: number;
    cardsByType: { [type: string]: number };
    cardsByElement: { [element: string]: number };
  }> {
    return this.getCardData().pipe(
      map(cardData => {
        const cardsByType: { [type: string]: number } = {};
        const cardsByElement: { [element: string]: number } = {};
        let totalCards = 0;

        cardData.groups.forEach(group => {
          group.cards.forEach(card => {
            totalCards++;
            
            // Count by type
            cardsByType[card.type] = (cardsByType[card.type] || 0) + 1;
            
            // Count by element
            cardsByElement[card.element] = (cardsByElement[card.element] || 0) + 1;
          });
        });

        return {
          totalCards,
          totalGroups: cardData.groups.length,
          cardsByType,
          cardsByElement
        };
      }),
      catchError(error => {
        console.error('Failed to get card statistics:', error);
        return throwError(() => new Error(`Failed to get card statistics: ${error.message || 'Unknown error'}`));
      })
    );
  }
}
