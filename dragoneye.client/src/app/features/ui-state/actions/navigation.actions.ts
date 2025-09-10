import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { CardSelection } from '../../../core/models/ui-state.model';
import { SelectionService } from '../services/selection.service';
import { CardDataService } from '../../card-management/services/card-data.service';

export interface NavigationResult {
  success: boolean;
  previousSelection?: CardSelection;
  newSelection?: CardSelection;
  message?: string;
}

@Injectable({
  providedIn: 'root'
})
export class NavigationActions {

  constructor(
    private selectionService: SelectionService,
    private cardDataService: CardDataService
  ) {}

  selectCard(groupIndex: number, cardIndex: number): Observable<NavigationResult> {
    return new Observable(observer => {
      const previousSelection = this.selectionService.getCardSelection();
      const success = this.selectionService.selectCard(groupIndex, cardIndex);
      
      if (success) {
        const newSelection = this.selectionService.getCardSelection();
        observer.next({
          success: true,
          previousSelection,
          newSelection,
          message: `Selected card at group ${groupIndex}, card ${cardIndex}`
        });
      } else {
        observer.next({
          success: false,
          previousSelection,
          message: 'Invalid card selection'
        });
      }
      
      observer.complete();
    });
  }

  selectGroup(groupIndex: number): Observable<NavigationResult> {
    return new Observable(observer => {
      const previousSelection = this.selectionService.getCardSelection();
      const success = this.selectionService.selectGroup(groupIndex);
      
      if (success) {
        const newSelection = this.selectionService.getCardSelection();
        observer.next({
          success: true,
          previousSelection,
          newSelection,
          message: `Selected group ${groupIndex}`
        });
      } else {
        observer.next({
          success: false,
          previousSelection,
          message: 'Invalid group selection'
        });
      }
      
      observer.complete();
    });
  }

  navigateNext(): Observable<NavigationResult> {
    return new Observable(observer => {
      const previousSelection = this.selectionService.getCardSelection();
      const success = this.selectionService.selectNext();
      
      if (success) {
        const newSelection = this.selectionService.getCardSelection();
        observer.next({
          success: true,
          previousSelection,
          newSelection,
          message: 'Navigated to next card'
        });
      } else {
        observer.next({
          success: false,
          previousSelection,
          message: 'Already at the last card'
        });
      }
      
      observer.complete();
    });
  }

  navigatePrevious(): Observable<NavigationResult> {
    return new Observable(observer => {
      const previousSelection = this.selectionService.getCardSelection();
      const success = this.selectionService.selectPrevious();
      
      if (success) {
        const newSelection = this.selectionService.getCardSelection();
        observer.next({
          success: true,
          previousSelection,
          newSelection,
          message: 'Navigated to previous card'
        });
      } else {
        observer.next({
          success: false,
          previousSelection,
          message: 'Already at the first card'
        });
      }
      
      observer.complete();
    });
  }

  navigateNextGroup(): Observable<NavigationResult> {
    return new Observable(observer => {
      const previousSelection = this.selectionService.getCardSelection();
      const success = this.selectionService.selectNextGroup();
      
      if (success) {
        const newSelection = this.selectionService.getCardSelection();
        observer.next({
          success: true,
          previousSelection,
          newSelection,
          message: 'Navigated to next group'
        });
      } else {
        observer.next({
          success: false,
          previousSelection,
          message: 'Already at the last group'
        });
      }
      
      observer.complete();
    });
  }

  navigatePreviousGroup(): Observable<NavigationResult> {
    return new Observable(observer => {
      const previousSelection = this.selectionService.getCardSelection();
      const success = this.selectionService.selectPreviousGroup();
      
      if (success) {
        const newSelection = this.selectionService.getCardSelection();
        observer.next({
          success: true,
          previousSelection,
          newSelection,
          message: 'Navigated to previous group'
        });
      } else {
        observer.next({
          success: false,
          previousSelection,
          message: 'Already at the first group'
        });
      }
      
      observer.complete();
    });
  }

  navigateToFirst(): Observable<NavigationResult> {
    return new Observable(observer => {
      const previousSelection = this.selectionService.getCardSelection();
      const success = this.selectionService.selectFirst();
      
      if (success) {
        const newSelection = this.selectionService.getCardSelection();
        observer.next({
          success: true,
          previousSelection,
          newSelection,
          message: 'Navigated to first card'
        });
      } else {
        observer.next({
          success: false,
          previousSelection,
          message: 'No cards available'
        });
      }
      
      observer.complete();
    });
  }

  navigateToLast(): Observable<NavigationResult> {
    return new Observable(observer => {
      const previousSelection = this.selectionService.getCardSelection();
      const success = this.selectionService.selectLast();
      
      if (success) {
        const newSelection = this.selectionService.getCardSelection();
        observer.next({
          success: true,
          previousSelection,
          newSelection,
          message: 'Navigated to last card'
        });
      } else {
        observer.next({
          success: false,
          previousSelection,
          message: 'No cards available'
        });
      }
      
      observer.complete();
    });
  }

  getNavigationInfo(): Observable<{
    currentPosition: number;
    totalCards: number;
    canNavigateNext: boolean;
    canNavigatePrevious: boolean;
    canNavigateNextGroup: boolean;
    canNavigatePreviousGroup: boolean;
    selectionPath: string;
  }> {
    return this.selectionService.selectionState$.pipe(
      map(() => {
        const navInfo = this.selectionService.getNavigationInfo();
        const selectionPath = this.selectionService.getSelectionPath();
        
        return {
          currentPosition: navInfo.currentPosition,
          totalCards: navInfo.totalCards,
          canNavigateNext: navInfo.canSelectNext,
          canNavigatePrevious: navInfo.canSelectPrevious,
          canNavigateNextGroup: navInfo.canSelectNextGroup,
          canNavigatePreviousGroup: navInfo.canSelectPreviousGroup,
          selectionPath
        };
      })
    );
  }

  findAndSelectCard(cardTitle: string): Observable<NavigationResult> {
    return new Observable(observer => {
      const cardData = this.cardDataService.currentCardData;
      let found = false;
      let foundGroupIndex = -1;
      let foundCardIndex = -1;

      // Search through all groups and cards
      for (let groupIndex = 0; groupIndex < cardData.groups.length; groupIndex++) {
        const group = cardData.groups[groupIndex];
        for (let cardIndex = 0; cardIndex < group.cards.length; cardIndex++) {
          const card = group.cards[cardIndex];
          if (card.title.toLowerCase().includes(cardTitle.toLowerCase())) {
            found = true;
            foundGroupIndex = groupIndex;
            foundCardIndex = cardIndex;
            break;
          }
        }
        if (found) break;
      }

      if (found) {
        const previousSelection = this.selectionService.getCardSelection();
        const success = this.selectionService.selectCard(foundGroupIndex, foundCardIndex);
        
        if (success) {
          const newSelection = this.selectionService.getCardSelection();
          observer.next({
            success: true,
            previousSelection,
            newSelection,
            message: `Found and selected card "${cardTitle}"`
          });
        } else {
          observer.next({
            success: false,
            message: 'Found card but failed to select it'
          });
        }
      } else {
        observer.next({
          success: false,
          message: `Card with title "${cardTitle}" not found`
        });
      }
      
      observer.complete();
    });
  }

  selectRandomCard(): Observable<NavigationResult> {
    return new Observable(observer => {
      const cardData = this.cardDataService.currentCardData;
      const allCards: { groupIndex: number; cardIndex: number }[] = [];

      // Build list of all cards
      cardData.groups.forEach((group, groupIndex) => {
        group.cards.forEach((card, cardIndex) => {
          allCards.push({ groupIndex, cardIndex });
        });
      });

      if (allCards.length === 0) {
        observer.next({
          success: false,
          message: 'No cards available'
        });
        observer.complete();
        return;
      }

      // Select random card
      const randomIndex = Math.floor(Math.random() * allCards.length);
      const randomCard = allCards[randomIndex];
      
      const previousSelection = this.selectionService.getCardSelection();
      const success = this.selectionService.selectCard(randomCard.groupIndex, randomCard.cardIndex);
      
      if (success) {
        const newSelection = this.selectionService.getCardSelection();
        observer.next({
          success: true,
          previousSelection,
          newSelection,
          message: 'Selected random card'
        });
      } else {
        observer.next({
          success: false,
          previousSelection,
          message: 'Failed to select random card'
        });
      }
      
      observer.complete();
    });
  }

  navigateByKeyboard(key: string): Observable<NavigationResult> {
    return new Observable(observer => {
      let result: NavigationResult;

      switch (key.toLowerCase()) {
        case 'arrowup':
          this.navigatePrevious().subscribe(res => {
            observer.next(res);
            observer.complete();
          });
          return;

        case 'arrowdown':
          this.navigateNext().subscribe(res => {
            observer.next(res);
            observer.complete();
          });
          return;

        case 'arrowleft':
          this.navigatePreviousGroup().subscribe(res => {
            observer.next(res);
            observer.complete();
          });
          return;

        case 'arrowright':
          this.navigateNextGroup().subscribe(res => {
            observer.next(res);
            observer.complete();
          });
          return;

        case 'home':
          this.navigateToFirst().subscribe(res => {
            observer.next(res);
            observer.complete();
          });
          return;

        case 'end':
          this.navigateToLast().subscribe(res => {
            observer.next(res);
            observer.complete();
          });
          return;

        default:
          observer.next({
            success: false,
            message: `Unknown navigation key: ${key}`
          });
          observer.complete();
          return;
      }
    });
  }

  getCardAtPosition(position: number): Observable<NavigationResult> {
    return new Observable(observer => {
      const cardData = this.cardDataService.currentCardData;
      let currentPosition = 0;
      let found = false;

      for (let groupIndex = 0; groupIndex < cardData.groups.length; groupIndex++) {
        const group = cardData.groups[groupIndex];
        for (let cardIndex = 0; cardIndex < group.cards.length; cardIndex++) {
          if (currentPosition === position) {
            const previousSelection = this.selectionService.getCardSelection();
            const success = this.selectionService.selectCard(groupIndex, cardIndex);
            
            if (success) {
              const newSelection = this.selectionService.getCardSelection();
              observer.next({
                success: true,
                previousSelection,
                newSelection,
                message: `Selected card at position ${position}`
              });
            } else {
              observer.next({
                success: false,
                message: `Failed to select card at position ${position}`
              });
            }
            found = true;
            break;
          }
          currentPosition++;
        }
        if (found) break;
      }

      if (!found) {
        observer.next({
          success: false,
          message: `No card at position ${position}`
        });
      }

      observer.complete();
    });
  }
}
