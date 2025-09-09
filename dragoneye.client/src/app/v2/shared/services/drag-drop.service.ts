import { Injectable } from '@angular/core';
import { Subject, Observable } from 'rxjs';

export interface DragState {
  isDragging: boolean;
  draggedCard: any;
  draggedCards: any[];
  fromGroup: number;
  draggedCardIndex: number;
  draggedCardIndices: number[];
  previewX: number;
  previewY: number;
  isMultiDrag: boolean;
}

export interface MoveEvent {
  fromGroup: number;
  fromCard: number;
  toGroup: number;
  toCard: number;
  draggedCards?: any[];
  draggedIndices?: number[];
  isMultiMove?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class DragDropService {
  private dragState$ = new Subject<DragState>();
  private moveEvent$ = new Subject<MoveEvent>();
  
  private currentDragState: DragState = {
    isDragging: false,
    draggedCard: null,
    draggedCards: [],
    fromGroup: -1,
    draggedCardIndex: -1,
    draggedCardIndices: [],
    previewX: 0,
    previewY: 0,
    isMultiDrag: false
  };

  private lastMoveId = '';

  get dragState(): Observable<DragState> {
    return this.dragState$.asObservable();
  }

  get moveEvents(): Observable<MoveEvent> {
    return this.moveEvent$.asObservable();
  }

  get currentState(): DragState {
    return { ...this.currentDragState };
  }

  startDrag(card: any, groupIndex: number, cardIndex: number, x: number, y: number, selectedCards?: any[], selectedIndices?: number[]): void {
    const isMultiDrag = selectedCards && selectedCards.length > 1;
    
    this.currentDragState = {
      isDragging: true,
      draggedCard: card,
      draggedCards: isMultiDrag ? [...selectedCards] : [card],
      fromGroup: groupIndex,
      draggedCardIndex: cardIndex,
      draggedCardIndices: isMultiDrag ? [...selectedIndices!] : [cardIndex],
      previewX: x,
      previewY: y,
      isMultiDrag: !!isMultiDrag
    };
    
    this.lastMoveId = '';
    this.dragState$.next({ ...this.currentDragState });
  }

  updateDragPosition(mouseX: number, mouseY: number, previewX?: number, previewY?: number): void {
    if (!this.currentDragState.isDragging) return;

    // Update preview position
    this.currentDragState.previewX = previewX ?? mouseX;
    this.currentDragState.previewY = previewY ?? mouseY;
    
    // Find what we're hovering over
    const hoverInfo = this.findHoverTarget(mouseX, mouseY);
    if (hoverInfo) {
      this.checkForMove(hoverInfo.groupIndex, hoverInfo.targetPosition);
    }
    
    this.dragState$.next({ ...this.currentDragState });
  }

  endDrag(): void {
    this.currentDragState = {
      isDragging: false,
      draggedCard: null,
      draggedCards: [],
      fromGroup: -1,
      draggedCardIndex: -1,
      draggedCardIndices: [],
      previewX: 0,
      previewY: 0,
      isMultiDrag: false
    };
    
    this.lastMoveId = '';
    this.dragState$.next({ ...this.currentDragState });
  }

  isCardBeingDragged(groupIndex: number, cardIndex: number): boolean {
    return this.currentDragState.isDragging &&
           this.currentDragState.fromGroup === groupIndex &&
           this.currentDragState.draggedCardIndices.includes(cardIndex);
  }

  private findHoverTarget(mouseX: number, mouseY: number): { groupIndex: number; targetPosition: number } | null {
    // First, find which group we're in
    const groupElements = document.querySelectorAll('[data-group-index] .group-cards');
    
    for (let i = 0; i < groupElements.length; i++) {
      const element = groupElements[i] as HTMLElement;
      const rect = element.getBoundingClientRect();
      
      if (mouseY >= rect.top && mouseY <= rect.bottom && 
          mouseX >= rect.left && mouseX <= rect.right) {
        const groupContainer = element.closest('[data-group-index]') as HTMLElement;
        if (groupContainer) {
          const groupIndex = parseInt(groupContainer.getAttribute('data-group-index') || '0');
          const targetPosition = this.findPositionInGroup(groupIndex, mouseX);
          return { groupIndex, targetPosition };
        }
      }
    }
    
    return null;
  }

  private findPositionInGroup(groupIndex: number, mouseX: number): number {
    // Get ALL cards in the group (including dragged ones)
    const allCardElements = Array.from(document.querySelectorAll(
      `[data-group-index="${groupIndex}"] [data-card-index]`
    )) as HTMLElement[];
    
    if (allCardElements.length === 0) return 0;
    
    // Sort by actual visual position (left to right)
    const cardData = allCardElements
      .map(element => {
        const cardIndex = parseInt(element.getAttribute('data-card-index') || '0');
        const rect = element.getBoundingClientRect();
        const isDragged = this.currentDragState.draggedCardIndices.includes(cardIndex);
        return {
          cardIndex,
          left: rect.left,
          right: rect.right,
          centerX: rect.left + rect.width / 2,
          isDragged
        };
      })
      .sort((a, b) => a.left - b.left);
    
    // For cross-group moves, find insertion point among all cards
    if (groupIndex !== this.currentDragState.fromGroup) {
      for (let i = 0; i < cardData.length; i++) {
        if (mouseX < cardData[i].centerX) {
          return i; // Insert before this card
        }
      }
      return cardData.length; // Insert at end
    }
    
    // For same-group moves, we need different logic
    if (this.currentDragState.isMultiDrag) {
      // Multi-card: find insertion point excluding dragged cards
      const nonDraggedCards = cardData.filter(card => !card.isDragged);
      for (let i = 0; i < nonDraggedCards.length; i++) {
        if (mouseX < nonDraggedCards[i].centerX) {
          return nonDraggedCards[i].cardIndex;
        }
      }
      return nonDraggedCards.length > 0 ? nonDraggedCards[nonDraggedCards.length - 1].cardIndex + 1 : 0;
    } else {
      // Single card: use threshold-based swapping
      return this.findSingleCardSwapTarget(cardData, mouseX);
    }
  }

  private findSingleCardSwapTarget(cardData: any[], mouseX: number): number {
    const currentIndex = this.currentDragState.draggedCardIndex;
    const otherCards = cardData.filter(card => !card.isDragged);
    
    if (otherCards.length === 0) return currentIndex;
    
    // Find adjacent cards (left and right neighbors)
    let leftNeighbor = null;
    let rightNeighbor = null;
    
    for (const card of otherCards) {
      if (card.cardIndex < currentIndex) {
        if (!leftNeighbor || card.cardIndex > leftNeighbor.cardIndex) {
          leftNeighbor = card;
        }
      } else if (card.cardIndex > currentIndex) {
        if (!rightNeighbor || card.cardIndex < rightNeighbor.cardIndex) {
          rightNeighbor = card;
        }
      }
    }
    
    // Check if we've crossed the midpoint of either neighbor
    if (leftNeighbor && mouseX < leftNeighbor.centerX) {
      // We've crossed into the left neighbor's territory
      return leftNeighbor.cardIndex;
    }
    
    if (rightNeighbor && mouseX > rightNeighbor.centerX) {
      // We've crossed into the right neighbor's territory  
      return rightNeighbor.cardIndex;
    }
    
    // No threshold crossed, stay in current position
    return currentIndex;
  }

  private checkForMove(targetGroup: number, targetPosition: number): void {
    const moveId = `${this.currentDragState.fromGroup}-${targetGroup}-${targetPosition}`;
    
    // Prevent duplicate moves
    if (moveId === this.lastMoveId) return;
    
    // Cross-group moves - always allow
    if (targetGroup !== this.currentDragState.fromGroup) {
      this.emitMove(targetGroup, targetPosition);
      this.lastMoveId = moveId;
      
      // CRITICAL FIX: Update the fromGroup after cross-group move
      // This allows continued dragging within the new group
      this.currentDragState.fromGroup = targetGroup;
      
      // Also update the dragged card indices for the new group
      if (this.currentDragState.isMultiDrag) {
        const cardCount = this.currentDragState.draggedCardIndices.length;
        const newIndices = [];
        for (let i = 0; i < cardCount; i++) {
          newIndices.push(targetPosition + i);
        }
        this.currentDragState.draggedCardIndex = targetPosition;
        this.currentDragState.draggedCardIndices = newIndices;
      } else {
        this.currentDragState.draggedCardIndex = targetPosition;
        this.currentDragState.draggedCardIndices = [targetPosition];
      }
      
      return;
    }
    
    // Same-group moves - only allow if position actually changed
    if (targetPosition !== this.currentDragState.draggedCardIndex) {
      if (this.currentDragState.isMultiDrag) {
        // Multi-card: check if we're moving outside the current block
        const minIndex = Math.min(...this.currentDragState.draggedCardIndices);
        const maxIndex = Math.max(...this.currentDragState.draggedCardIndices);
        
        if (targetPosition < minIndex || targetPosition > maxIndex + 1) {
          this.emitMove(targetGroup, targetPosition);
          this.lastMoveId = moveId;
          
          // CRITICAL FIX: Update the dragged card indices after multi-card move
          // Calculate the new positions for all dragged cards
          const cardCount = this.currentDragState.draggedCardIndices.length;
          const newIndices = [];
          for (let i = 0; i < cardCount; i++) {
            newIndices.push(targetPosition + i);
          }
          
          this.currentDragState.draggedCardIndex = targetPosition;
          this.currentDragState.draggedCardIndices = newIndices;
        }
      } else {
        // Single card: emit the swap and update our tracking
        this.emitMove(targetGroup, targetPosition);
        this.lastMoveId = moveId;
        
        // CRITICAL FIX: Update the dragged card index to its new position
        // This ensures the correct card stays invisible during continued dragging
        this.currentDragState.draggedCardIndex = targetPosition;
        this.currentDragState.draggedCardIndices = [targetPosition];
      }
    }
  }

  private emitMove(targetGroup: number, targetPosition: number): void {
    const moveEvent: MoveEvent = {
      fromGroup: this.currentDragState.fromGroup,
      fromCard: this.currentDragState.draggedCardIndex,
      toGroup: targetGroup,
      toCard: targetPosition,
      draggedCards: this.currentDragState.isMultiDrag ? this.currentDragState.draggedCards : undefined,
      draggedIndices: this.currentDragState.isMultiDrag ? this.currentDragState.draggedCardIndices : undefined,
      isMultiMove: this.currentDragState.isMultiDrag
    };
    
    this.moveEvent$.next(moveEvent);
  }
}
