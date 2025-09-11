import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';

import { Card, CardDetail, ValidationResult } from '../../../core/models/card.model';
import { CardActionResult } from '../../../core/models/api.model';
import { CardDataService } from '../services/card-data.service';
import { CardValidationService } from '../services/card-validation.service';
import { ElementService } from '../services/element.service';

@Injectable({
  providedIn: 'root'
})
export class CardActions {

  constructor(
    private cardDataService: CardDataService,
    private cardValidationService: CardValidationService,
    private elementService: ElementService
  ) {}

  createCard(groupIndex: number, cardTemplate?: Partial<Card>): Observable<CardActionResult> {
    return new Observable(observer => {
      try {
        const defaultCard: Card = {
          title: 'New Card',
          type: 'Action',
          elements: [this.elementService.getDefaultElement().key],
          backgroundImage: '',
          details: [
            {
              name: 'Action',
              details: 'Enter description here',
              apCost: 1,
              spCost: 0
            }
          ],
          ...cardTemplate
        };

        // Validate the new card
        const validation = this.cardValidationService.validateCard(defaultCard);
        if (!validation.isValid) {
          observer.next({
            success: false,
            error: 'Card validation failed',
            card: defaultCard
          });
          observer.complete();
          return;
        }

        const cardIndex = this.cardDataService.addCard(groupIndex, defaultCard);
        
        if (cardIndex !== -1) {
          observer.next({
            success: true,
            card: defaultCard,
            cardIndex,
            groupIndex
          });
        } else {
          observer.next({
            success: false,
            error: 'Failed to create card - invalid group index'
          });
        }
        
        observer.complete();
      } catch (error: any) {
        observer.next({
          success: false,
          error: error.message || 'Failed to create card'
        });
        observer.complete();
      }
    });
  }

  duplicateCard(groupIndex: number, cardIndex: number): Observable<CardActionResult> {
    return new Observable(observer => {
      try {
        const originalCard = this.cardDataService.getCard(groupIndex, cardIndex);
        if (!originalCard) {
          observer.next({
            success: false,
            error: 'Card not found'
          });
          observer.complete();
          return;
        }

        const newCardIndex = this.cardDataService.duplicateCard(groupIndex, cardIndex);
        
        if (newCardIndex !== -1) {
          const duplicatedCard = this.cardDataService.getCard(groupIndex, newCardIndex);
          observer.next({
            success: true,
            card: duplicatedCard || undefined, // Fix null to undefined conversion
            cardIndex: newCardIndex,
            groupIndex
          });
        } else {
          observer.next({
            success: false,
            error: 'Failed to duplicate card'
          });
        }
        
        observer.complete();
      } catch (error: any) {
        observer.next({
          success: false,
          error: error.message || 'Failed to duplicate card'
        });
        observer.complete();
      }
    });
  }

  updateCard(groupIndex: number, cardIndex: number, updates: Partial<Card>): Observable<CardActionResult> {
    return new Observable(observer => {
      try {
        const currentCard = this.cardDataService.getCard(groupIndex, cardIndex);
        if (!currentCard) {
          observer.next({
            success: false,
            error: 'Card not found'
          });
          observer.complete();
          return;
        }

        const updatedCard = { ...currentCard, ...updates };
        
        // Validate the updated card
        const validation = this.cardValidationService.validateCard(updatedCard);
        if (!validation.isValid) {
          observer.next({
            success: false,
            error: 'Card validation failed',
            card: updatedCard
          });
          observer.complete();
          return;
        }

        const success = this.cardDataService.updateCard(groupIndex, cardIndex, updates);
        
        if (success) {
          observer.next({
            success: true,
            card: updatedCard,
            cardIndex,
            groupIndex
          });
        } else {
          observer.next({
            success: false,
            error: 'Failed to update card'
          });
        }
        
        observer.complete();
      } catch (error: any) {
        observer.next({
          success: false,
          error: error.message || 'Failed to update card'
        });
        observer.complete();
      }
    });
  }

  deleteCard(groupIndex: number, cardIndex: number): Observable<CardActionResult> {
    return new Observable(observer => {
      try {
        const card = this.cardDataService.getCard(groupIndex, cardIndex);
        if (!card) {
          observer.next({
            success: false,
            error: 'Card not found'
          });
          observer.complete();
          return;
        }

        const success = this.cardDataService.removeCard(groupIndex, cardIndex);
        
        if (success) {
          observer.next({
            success: true,
            card,
            cardIndex,
            groupIndex
          });
        } else {
          observer.next({
            success: false,
            error: 'Failed to delete card'
          });
        }
        
        observer.complete();
      } catch (error: any) {
        observer.next({
          success: false,
          error: error.message || 'Failed to delete card'
        });
        observer.complete();
      }
    });
  }

  moveCard(fromGroup: number, fromCard: number, toGroup: number, toCard: number): Observable<CardActionResult> {
    return new Observable(observer => {
      try {
        const card = this.cardDataService.getCard(fromGroup, fromCard);
        if (!card) {
          observer.next({
            success: false,
            error: 'Source card not found'
          });
          observer.complete();
          return;
        }

        const success = this.cardDataService.moveCard(fromGroup, fromCard, toGroup, toCard);
        
        if (success) {
          observer.next({
            success: true,
            card,
            cardIndex: toCard,
            groupIndex: toGroup
          });
        } else {
          observer.next({
            success: false,
            error: 'Failed to move card'
          });
        }
        
        observer.complete();
      } catch (error: any) {
        observer.next({
          success: false,
          error: error.message || 'Failed to move card'
        });
        observer.complete();
      }
    });
  }

  validateCard(card: Card): Observable<ValidationResult> {
    return of(this.cardValidationService.validateCard(card));
  }

  validateCardTitle(title: string, groupIndex: number, excludeCardIndex?: number): Observable<ValidationResult> {
    return new Observable(observer => {
      try {
        const group = this.cardDataService.getGroup(groupIndex);
        if (!group) {
          observer.next({
            isValid: false,
            errors: ['Invalid group']
          });
          observer.complete();
          return;
        }

        const existingTitles = group.cards
          .map((card, index) => index === excludeCardIndex ? null : card.title.toLowerCase().trim())
          .filter(title => title !== null) as string[];

        const validation = this.cardValidationService.validateCardTitle(title, existingTitles);
        observer.next(validation);
        observer.complete();
      } catch (error: any) {
        observer.next({
          isValid: false,
          errors: [error.message || 'Validation failed']
        });
        observer.complete();
      }
    });
  }

  updateCardTitle(groupIndex: number, cardIndex: number, title: string): Observable<CardActionResult> {
    return this.validateCardTitle(title, groupIndex, cardIndex).pipe(
      map(validation => {
        if (!validation.isValid) {
          return {
            success: false,
            error: 'Title validation failed',
            validationErrors: validation.errors
          };
        }

        const sanitizedTitle = this.cardValidationService.sanitizeCardTitle(title);
        const success = this.cardDataService.updateCard(groupIndex, cardIndex, { title: sanitizedTitle });
        
        if (success) {
          const updatedCard = this.cardDataService.getCard(groupIndex, cardIndex);
          return {
            success: true,
            card: updatedCard || undefined
          };
        } else {
          return {
            success: false,
            error: 'Failed to update card title'
          };
        }
      })
    );
  }

  updateCardType(groupIndex: number, cardIndex: number, type: string): Observable<CardActionResult> {
    return this.updateCard(groupIndex, cardIndex, { type });
  }

  updateCardElement(groupIndex: number, cardIndex: number, element: string): Observable<CardActionResult> {
    return new Observable(observer => {
      // Validate element exists
      if (!this.elementService.isValidElement(element)) {
        observer.next({
          success: false,
          error: `Invalid element: ${element}`
        });
        observer.complete();
        return;
      }

      this.updateCard(groupIndex, cardIndex, { elements: [element] }).subscribe(result => {
        observer.next(result);
        observer.complete();
      });
    });
  }

  updateCardBackgroundImage(groupIndex: number, cardIndex: number, backgroundImage: string): Observable<CardActionResult> {
    return this.updateCard(groupIndex, cardIndex, { backgroundImage });
  }

  getCardsByElement(element: string): Card[] {
    const allCards = this.cardDataService.getAllCards();
    return allCards.filter(card => card.elements.includes(element));
  }

  getCardsByType(type: string): Card[] {
    const allCards = this.cardDataService.getAllCards();
    return allCards.filter(card => card.type === type);
  }

  searchCards(query: string): Card[] {
    const allCards = this.cardDataService.getAllCards();
    const lowerQuery = query.toLowerCase();
    
    return allCards.filter(card =>
      card.title.toLowerCase().includes(lowerQuery) ||
      card.type.toLowerCase().includes(lowerQuery) ||
      card.elements.some(element => element.toLowerCase().includes(lowerQuery)) ||
      card.details.some(detail =>
        detail.name.toLowerCase().includes(lowerQuery) ||
        detail.details.toLowerCase().includes(lowerQuery)
      )
    );
  }

  getCardComplexityScore(groupIndex: number, cardIndex: number): number {
    const card = this.cardDataService.getCard(groupIndex, cardIndex);
    return card ? this.cardValidationService.getCardComplexityScore(card) : 0;
  }

  getBalanceSuggestions(groupIndex: number, cardIndex: number): string[] {
    const card = this.cardDataService.getCard(groupIndex, cardIndex);
    return card ? this.cardValidationService.suggestBalanceChanges(card) : [];
  }

  getAvailableCardTypes(): string[] {
    return this.cardValidationService.getValidCardTypes();
  }

  getCardStatistics(): {
    totalCards: number;
    cardsByType: { [type: string]: number };
    cardsByElement: { [element: string]: number };
    averageComplexity: number;
  } {
    const allCards = this.cardDataService.getAllCards();
    const cardsByType: { [type: string]: number } = {};
    const cardsByElement: { [element: string]: number } = {};
    let totalComplexity = 0;

    allCards.forEach(card => {
      // Count by type
      cardsByType[card.type] = (cardsByType[card.type] || 0) + 1;
      
      // Count by elements
      card.elements.forEach(element => {
        cardsByElement[element] = (cardsByElement[element] || 0) + 1;
      });
      
      // Sum complexity
      totalComplexity += this.cardValidationService.getCardComplexityScore(card);
    });

    return {
      totalCards: allCards.length,
      cardsByType,
      cardsByElement,
      averageComplexity: allCards.length > 0 ? totalComplexity / allCards.length : 0
    };
  }
}
