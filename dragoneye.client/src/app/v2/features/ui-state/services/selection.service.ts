// Selection service

import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

import { CardSelection, SelectionState } from '../../../core/models/ui-state.model';

@Injectable({
  providedIn: 'root'
})
export class SelectionService {
  private selectionState: SelectionState = {
    selectedGroupIndex: 0,
    selectedCardIndex: 0,
    selectedCards: [], // Array of selected cards
    hasSelection: false,
    isMultiSelect: false
  };

  private selectionSubject = new BehaviorSubject<SelectionState>(this.selectionState);
  public selectionState$ = this.selectionSubject.asObservable();

  get currentSelection(): SelectionState {
    return { ...this.selectionState };
  }

  get selectedCards(): CardSelection[] {
    return [...this.selectionState.selectedCards];
  }

  get hasMultipleSelected(): boolean {
    return this.selectionState.selectedCards.length > 1;
  }

  // Select a single card (replaces current selection)
  selectCard(groupIndex: number, cardIndex: number): void {
    this.selectionState = {
      selectedGroupIndex: groupIndex,
      selectedCardIndex: cardIndex,
      selectedCards: [{ groupIndex, cardIndex }],
      hasSelection: true,
      isMultiSelect: false
    };
    
    this.emitSelection();
  }

  // Add a card to the current selection
  addToSelection(groupIndex: number, cardIndex: number): void {
    const cardSelection = { groupIndex, cardIndex };
    
    // Check if card is already selected
    const existingIndex = this.selectionState.selectedCards.findIndex(
      card => card.groupIndex === groupIndex && card.cardIndex === cardIndex
    );
    
    if (existingIndex === -1) {
      // Add to selection
      this.selectionState.selectedCards.push(cardSelection);
      this.selectionState.isMultiSelect = this.selectionState.selectedCards.length > 1;
      
      // Update primary selection to the last selected card
      this.selectionState.selectedGroupIndex = groupIndex;
      this.selectionState.selectedCardIndex = cardIndex;
      this.selectionState.hasSelection = true;
    }
    
    this.emitSelection();
  }

  // Remove a card from the current selection
  removeFromSelection(groupIndex: number, cardIndex: number): void {
    const existingIndex = this.selectionState.selectedCards.findIndex(
      card => card.groupIndex === groupIndex && card.cardIndex === cardIndex
    );
    
    if (existingIndex !== -1) {
      this.selectionState.selectedCards.splice(existingIndex, 1);
      
      if (this.selectionState.selectedCards.length === 0) {
        // No selection left
        this.clearSelection();
      } else {
        // Update primary selection to the first remaining card
        const firstCard = this.selectionState.selectedCards[0];
        this.selectionState.selectedGroupIndex = firstCard.groupIndex;
        this.selectionState.selectedCardIndex = firstCard.cardIndex;
        this.selectionState.isMultiSelect = this.selectionState.selectedCards.length > 1;
        this.selectionState.hasSelection = true;
      }
    }
    
    this.emitSelection();
  }

  // Select multiple cards at once (from multi-select box)
  selectMultipleCards(cards: CardSelection[]): void {
    if (cards.length === 0) {
      this.clearSelection();
      return;
    }

    // CRITICAL FIX: Remove duplicates that might come from drag-select
    const uniqueSelections = new Map<string, CardSelection>();
    cards.forEach(card => {
      const key = `${card.groupIndex}-${card.cardIndex}`;
      uniqueSelections.set(key, card);
    });
    const deduplicatedCards = Array.from(uniqueSelections.values());
    
    console.log(`SelectionService: selectMultipleCards called with ${cards.length} cards, deduplicated to ${deduplicatedCards.length}`);
    if (cards.length !== deduplicatedCards.length) {
      console.warn(`⚠️ SelectionService: Removed ${cards.length - deduplicatedCards.length} duplicate selections`);
    }

    this.selectionState = {
      selectedGroupIndex: deduplicatedCards[0].groupIndex,
      selectedCardIndex: deduplicatedCards[0].cardIndex,
      selectedCards: [...deduplicatedCards],
      hasSelection: true,
      isMultiSelect: deduplicatedCards.length > 1
    };
    
    this.emitSelection();
  }

  // Toggle card selection (for Ctrl+click behavior)
  toggleCardSelection(groupIndex: number, cardIndex: number): void {
    const existingIndex = this.selectionState.selectedCards.findIndex(
      card => card.groupIndex === groupIndex && card.cardIndex === cardIndex
    );
    
    if (existingIndex !== -1) {
      this.removeFromSelection(groupIndex, cardIndex);
    } else {
      this.addToSelection(groupIndex, cardIndex);
    }
  }

  // Check if a specific card is selected
  isCardSelected(groupIndex: number, cardIndex: number): boolean {
    return this.selectionState.selectedCards.some(
      card => card.groupIndex === groupIndex && card.cardIndex === cardIndex
    );
  }

  // Check if a card is the primary selection (for editing)
  isPrimarySelection(groupIndex: number, cardIndex: number): boolean {
    return this.selectionState.selectedGroupIndex === groupIndex && 
           this.selectionState.selectedCardIndex === cardIndex;
  }

  // Clear all selection
  clearSelection(): void {
    console.log('SelectionService: Clearing all selection');
    
    this.selectionState = {
      selectedGroupIndex: 0,
      selectedCardIndex: 0,
      selectedCards: [],
      hasSelection: false,
      isMultiSelect: false
    };
    
    this.emitSelection();
  }

  // Legacy methods for compatibility
  selectGroup(groupIndex: number): void {
    // Select first card in group if available
    this.selectCard(groupIndex, 0);
  }

  selectFirst(): void {
    this.selectCard(0, 0);
  }

  selectNext(): void {
    // Navigate to next card in selection
    // TODO: Implement navigation logic
  }

  selectPrevious(): void {
    // Navigate to previous card in selection
    // TODO: Implement navigation logic
  }

  selectNextGroup(): void {
    // Navigate to next group
    // TODO: Implement navigation logic
  }

  selectPreviousGroup(): void {
    // Navigate to previous group
    // TODO: Implement navigation logic
  }

  private emitSelection(): void {
    this.selectionSubject.next({ ...this.selectionState });
  }
}
