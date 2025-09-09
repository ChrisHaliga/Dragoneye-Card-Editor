import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

import { CardData, Card, CardGroup, CardDetail } from '../../../core/models/card.model';
import { CardApiRepository } from '../../../core/repositories/http/card-api.repository';

export interface CardDataState {
  data: CardData;
  isLoading: boolean;
  hasUnsavedChanges: boolean;
  lastSaved?: Date;
  error?: string;
}

@Injectable({
  providedIn: 'root'
})
export class CardDataService {
  private cardDataStateSubject = new BehaviorSubject<CardDataState>({
    data: { filename: '', groups: [] },
    isLoading: false,
    hasUnsavedChanges: false
  });

  public cardDataState$ = this.cardDataStateSubject.asObservable();
  public cardData$ = this.cardDataState$.pipe(
    map(state => state.data)
  );

  constructor(private cardApiRepository: CardApiRepository) {
    this.loadInitialData();
  }

  get currentCardData(): CardData {
    return this.cardDataStateSubject.value.data;
  }

  get hasUnsavedChanges(): boolean {
    return this.cardDataStateSubject.value.hasUnsavedChanges;
  }

  get isLoading(): boolean {
    return this.cardDataStateSubject.value.isLoading;
  }

  private async loadInitialData(): Promise<void> {
    this.updateState({ isLoading: true });

    try {
      const cardData = await this.cardApiRepository.getCardData().toPromise();
      if (cardData) {
        this.updateState({
          data: cardData,
          isLoading: false,
          hasUnsavedChanges: false,
          error: undefined
        });
        
        // Also update the FileStateService with the correct filename
        // This ensures the filename display in the UI matches the loaded data
        if (cardData.filename) {
          // We need to inject FileStateService to update it
          // For now, we'll emit an event that the container can listen to
          console.log('Loaded initial data with filename:', cardData.filename);
        }
      }
    } catch (error: any) {
      console.error('Failed to load initial card data:', error);
      // Create a default empty dataset instead of failing
      const defaultData: CardData = { 
        filename: 'my-card-set.json', 
        groups: [] 
      };
      this.updateState({
        data: defaultData,
        isLoading: false,
        error: undefined // Don't show error for missing initial data
      });
    }
  }

  setCardData(data: CardData): void {
    this.updateState({
      data: { ...data },
      hasUnsavedChanges: false,
      lastSaved: new Date(),
      error: undefined
    });
  }

  updateCardData(data: CardData, markAsChanged: boolean = true): void {
    this.updateState({
      data: { ...data },
      hasUnsavedChanges: markAsChanged
    });
  }

  updateCardDataInMemory(data: CardData): void {
    this.updateCardData(data, true);
  }

  markAsSaved(): void {
    this.updateState({
      hasUnsavedChanges: false,
      lastSaved: new Date(),
      error: undefined
    });
  }

  setError(error: string): void {
    this.updateState({ error, isLoading: false });
  }

  clearError(): void {
    this.updateState({ error: undefined });
  }

  // Card operations
  getCard(groupIndex: number, cardIndex: number): Card | null {
    const group = this.currentCardData.groups[groupIndex];
    return group?.cards[cardIndex] || null;
  }

  getAllCards(): Card[] {
    return this.currentCardData.groups.flatMap(group => group.cards);
  }

  getCardCount(): number {
    return this.currentCardData.groups.reduce((total, group) => total + group.cards.length, 0);
  }

  getGroupCount(): number {
    return this.currentCardData.groups.length;
  }

  hasCards(): boolean {
    return this.currentCardData.groups.some(group => group.cards.length > 0);
  }

  // Group operations
  getGroup(groupIndex: number): CardGroup | null {
    return this.currentCardData.groups[groupIndex] || null;
  }

  addGroup(name: string = 'New Group'): CardGroup {
    const newGroup: CardGroup = {
      name,
      cards: []
      // Note: expanded property is optional and not needed for v2 components
    };

    const updatedData = { ...this.currentCardData };
    updatedData.groups = [...updatedData.groups, newGroup];
    this.updateCardData(updatedData);

    return newGroup;
  }

  getGroupIndex(group: CardGroup): number {
    return this.currentCardData.groups.findIndex(g => g === group);
  }

  removeGroup(groupIndex: number): boolean {
    if (this.currentCardData.groups.length <= 1) return false;

    const updatedData = { ...this.currentCardData };
    updatedData.groups = updatedData.groups.filter((_, i) => i !== groupIndex);
    this.updateCardData(updatedData);

    return true;
  }

  duplicateGroup(groupIndex: number): CardGroup | null {
    const original = this.getGroup(groupIndex);
    if (!original) return null;

    const duplicate: CardGroup = {
      ...original,
      name: original.name + ' Copy',
      cards: original.cards.map(card => ({
        ...card,
        details: card.details.map(detail => ({ ...detail }))
      }))
    };

    const updatedData = { ...this.currentCardData };
    updatedData.groups = [
      ...updatedData.groups.slice(0, groupIndex + 1),
      duplicate,
      ...updatedData.groups.slice(groupIndex + 1)
    ];
    this.updateCardData(updatedData);

    return duplicate;
  }

  updateGroup(groupIndex: number, updates: Partial<CardGroup>): boolean {
    const group = this.getGroup(groupIndex);
    if (!group) return false;

    const updatedData = { ...this.currentCardData };
    updatedData.groups = updatedData.groups.map((g, i) =>
      i === groupIndex ? { ...g, ...updates } : g
    );
    this.updateCardData(updatedData);

    return true;
  }

  toggleGroupExpansion(groupIndex: number): boolean {
    const group = this.getGroup(groupIndex);
    if (!group) return false;

    return this.updateGroup(groupIndex, { expanded: !group.expanded });
  }

  // Card operations
  addCard(groupIndex: number, card?: Partial<Card>): number {
    const group = this.getGroup(groupIndex);
    if (!group) return -1;

    const newCard: Card = {
      title: 'New Card',
      type: 'Action',
      element: 'arc',
      backgroundImage: '',
      details: [{ name: 'Action', details: 'Enter description here', apCost: 1, spCost: 0 }],
      ...card
    };

    const updatedData = { ...this.currentCardData };
    updatedData.groups = updatedData.groups.map((g, i) =>
      i === groupIndex
        ? { ...g, cards: [...g.cards, newCard] }
        : g
    );
    this.updateCardData(updatedData);

    return group.cards.length; // This is the index of the newly added card (was group.cards.length before the update)
  }

  removeCard(groupIndex: number, cardIndex: number): boolean {
    const group = this.getGroup(groupIndex);
    if (!group || cardIndex >= group.cards.length) return false;

    const updatedData = { ...this.currentCardData };
    updatedData.groups = updatedData.groups.map((g, i) =>
      i === groupIndex
        ? { ...g, cards: g.cards.filter((_, j) => j !== cardIndex) }
        : g
    );
    this.updateCardData(updatedData);

    return true;
  }

  duplicateCard(groupIndex: number, cardIndex: number): number {
    const original = this.getCard(groupIndex, cardIndex);
    if (!original) return -1;

    const duplicate: Card = {
      ...original,
      title: original.title + ' Copy',
      details: original.details.map(detail => ({ ...detail }))
    };

    const updatedData = { ...this.currentCardData };
    const targetGroup = updatedData.groups[groupIndex];
    const newIndex = cardIndex + 1;
    
    updatedData.groups = updatedData.groups.map((g, i) =>
      i === groupIndex
        ? {
            ...g,
            cards: [
              ...g.cards.slice(0, newIndex),
              duplicate,
              ...g.cards.slice(newIndex)
            ]
          }
        : g
    );
    this.updateCardData(updatedData);

    return newIndex; // Return the index of the duplicated card
  }

  updateCard(groupIndex: number, cardIndex: number, updates: Partial<Card>): boolean {
    const card = this.getCard(groupIndex, cardIndex);
    if (!card) return false;

    const updatedData = { ...this.currentCardData };
    updatedData.groups = updatedData.groups.map((g, i) =>
      i === groupIndex
        ? {
            ...g,
            cards: g.cards.map((c, j) =>
              j === cardIndex ? { ...c, ...updates } : c
            )
          }
        : g
    );
    this.updateCardData(updatedData);

    return true;
  }

  moveCard(fromGroup: number, fromCard: number, toGroup: number, toCard: number): boolean {
    console.log(`🚚 MOVE CARD: ${fromGroup}[${fromCard}] → ${toGroup}[${toCard}]`);
    
    const card = this.getCard(fromGroup, fromCard);
    if (!card) {
      console.error(`❌ Source card not found at ${fromGroup}[${fromCard}]`);
      return false;
    }

    console.log(`✅ Moving card: "${card.title}"`);
    const updatedData = { ...this.currentCardData };

    if (fromGroup === toGroup) {
      // Same group reorder
      const sourceGroup = updatedData.groups[fromGroup];
      const cards = [...sourceGroup.cards];
      
      const [movedCard] = cards.splice(fromCard, 1);
      cards.splice(toCard, 0, movedCard);
      
      updatedData.groups = updatedData.groups.map((g, i) =>
        i === fromGroup ? { ...g, cards } : g
      );
    } else {
      // Cross-group move - ATOMIC OPERATION
      console.log(`🌉 Cross-group move: removing from ${fromGroup}, inserting at ${toGroup}[${toCard}]`);
      
      updatedData.groups = updatedData.groups.map((g, i) => {
        if (i === fromGroup) {
          // Remove EXACTLY ONE card
          const newCards = g.cards.filter((_, j) => j !== fromCard);
          console.log(`➖ Removed from group ${i}: ${g.cards.length} → ${newCards.length}`);
          return { ...g, cards: newCards };
        } else if (i === toGroup) {
          // Insert EXACTLY ONE card
          const newCards = [...g.cards];
          newCards.splice(toCard, 0, card);
          console.log(`➕ Added to group ${i}: ${g.cards.length} → ${newCards.length}`);
          return { ...g, cards: newCards };
        } else {
          // Other groups unchanged
          return g;
        }
      });
    }

    this.updateCardData(updatedData);
    console.log(`✅ Move completed successfully`);
    return true;
  }

  moveMultipleCards(fromGroup: number, cardIndices: number[], toGroup: number, insertPosition: number, cards: Card[]): boolean {
    console.log(`🚚 BULK MOVE: ${cards.length} cards from group ${fromGroup} to group ${toGroup} at position ${insertPosition}`);
    console.log(`🔍 Card indices:`, cardIndices);
    
    if (cardIndices.length !== cards.length) {
      console.error(`❌ Mismatch between indices count (${cardIndices.length}) and cards count (${cards.length})`);
      return false;
    }

    // Check for duplicate indices
    const uniqueIndices = new Set(cardIndices);
    if (uniqueIndices.size !== cardIndices.length) {
      console.error(`❌ Duplicate indices detected in moveMultipleCards:`, cardIndices);
      return false;
    }

    // Validate all source cards exist and match
    for (let i = 0; i < cardIndices.length; i++) {
      const sourceCard = this.getCard(fromGroup, cardIndices[i]);
      if (!sourceCard) {
        console.error(`❌ Source card not found at ${fromGroup}[${cardIndices[i]}]`);
        return false;
      }
    }

    const updatedData = { ...this.currentCardData };

    if (fromGroup === toGroup) {
      // Same group reordering - use a cleaner approach
      console.log(`🔄 Same group multi-move: reordering ${cards.length} cards within group ${fromGroup}`);
      
      const sourceGroup = updatedData.groups[fromGroup];
      const allCards = [...sourceGroup.cards];
      
      // Extract the cards we want to move (in their original order)
      const sortedIndices = [...cardIndices].sort((a, b) => a - b);
      const movedCards = sortedIndices.map(index => allCards[index]);
      
      // Create new array without the moved cards
      const remainingCards = allCards.filter((_, index) => !cardIndices.includes(index));
      
      // Calculate the correct insertion position in the remaining cards array
      // We need to account for how many of the moved cards were before the insertion point
      const movedCardsBefore = sortedIndices.filter(index => index < insertPosition).length;
      const adjustedInsertPosition = insertPosition - movedCardsBefore;
      
      // Insert the moved cards at the correct position
      const finalCards = [
        ...remainingCards.slice(0, adjustedInsertPosition),
        ...movedCards,
        ...remainingCards.slice(adjustedInsertPosition)
      ];
      
      console.log(`🔄 Original cards: ${allCards.map(c => c.title).join(', ')}`);
      console.log(`🔄 Moved cards: ${movedCards.map(c => c.title).join(', ')}`);
      console.log(`🔄 Remaining cards: ${remainingCards.map(c => c.title).join(', ')}`);
      console.log(`🔄 Insert position: ${insertPosition} → adjusted: ${adjustedInsertPosition}`);
      console.log(`🔄 Final cards: ${finalCards.map(c => c.title).join(', ')}`);
      
      updatedData.groups = updatedData.groups.map((g, i) =>
        i === fromGroup ? { ...g, cards: finalCards } : g
      );
    } else {
      // Cross-group move - remove all from source, add all to target
      console.log(`🌉 Cross-group multi-move: ${cards.length} cards from group ${fromGroup} to group ${toGroup}`);
      
      // Use the actual source cards from the data, not the provided cards array
      const sourceCards = cardIndices.map(index => this.getCard(fromGroup, index)).filter(card => card !== null) as Card[];
      
      if (sourceCards.length !== cardIndices.length) {
        console.error(`❌ Could not retrieve all source cards: expected ${cardIndices.length}, got ${sourceCards.length}`);
        return false;
      }
      
      updatedData.groups = updatedData.groups.map((g, i) => {
        if (i === fromGroup) {
          // Remove all selected cards
          const newCards = g.cards.filter((_, j) => !cardIndices.includes(j));
          console.log(`➖ Removed ${cardIndices.length} cards from group ${i}: ${g.cards.length} → ${newCards.length}`);
          return { ...g, cards: newCards };
        } else if (i === toGroup) {
          // Insert all cards at the specified position using the actual source cards
          const newCards = [...g.cards];
          newCards.splice(insertPosition, 0, ...sourceCards);
          console.log(`➕ Added ${sourceCards.length} cards to group ${i}: ${g.cards.length} → ${newCards.length}`);
          return { ...g, cards: newCards };
        } else {
          // Other groups unchanged
          return g;
        }
      });
    }

    this.updateCardData(updatedData);
    console.log(`✅ Bulk move completed successfully`);
    return true;
  }

  // Detail operations
  addDetail(groupIndex: number, cardIndex: number, detail?: Partial<CardDetail>): CardDetail | null {
    const card = this.getCard(groupIndex, cardIndex);
    if (!card) return null;

    const newDetail: CardDetail = {
      name: 'New Action',
      details: 'Enter description here',
      apCost: 1,
      spCost: 0,
      ...detail
    };

    const updatedDetails = [...card.details, newDetail];
    this.updateCard(groupIndex, cardIndex, { details: updatedDetails });

    return newDetail;
  }

  removeDetail(groupIndex: number, cardIndex: number, detailIndex: number): boolean {
    const card = this.getCard(groupIndex, cardIndex);
    if (!card || card.details.length <= 1 || detailIndex >= card.details.length) return false;

    const updatedDetails = card.details.filter((_, i) => i !== detailIndex);
    return this.updateCard(groupIndex, cardIndex, { details: updatedDetails });
  }

  duplicateDetail(groupIndex: number, cardIndex: number, detailIndex: number): CardDetail | null {
    const card = this.getCard(groupIndex, cardIndex);
    if (!card || detailIndex >= card.details.length) return null;

    const original = card.details[detailIndex];
    const duplicate: CardDetail = {
      ...original,
      name: original.name + ' Copy'
    };

    const updatedDetails = [
      ...card.details.slice(0, detailIndex + 1),
      duplicate,
      ...card.details.slice(detailIndex + 1)
    ];

    this.updateCard(groupIndex, cardIndex, { details: updatedDetails });
    return duplicate;
  }

  updateDetail(groupIndex: number, cardIndex: number, detailIndex: number, updates: Partial<CardDetail>): boolean {
    const card = this.getCard(groupIndex, cardIndex);
    if (!card || detailIndex >= card.details.length) return false;

    const updatedDetails = card.details.map((detail, i) =>
      i === detailIndex ? { ...detail, ...updates } : detail
    );

    return this.updateCard(groupIndex, cardIndex, { details: updatedDetails });
  }

  private updateState(updates: Partial<CardDataState>): void {
    const currentState = this.cardDataStateSubject.value;
    this.cardDataStateSubject.next({ ...currentState, ...updates });
  }
}
