import { Component, Input, Output, EventEmitter, HostListener } from '@angular/core';

import { CardGroup, Card } from '../../../core/models/card.model';
import { CardSelection } from '../../../core/models/ui-state.model';
import { ElementService } from '../../../features/card-management/services/element.service';
import { ContextMenuService } from '../../../features/ui-state/services/context-menu.service';
import { DragDropService } from '../../../shared/services/drag-drop.service';

@Component({
  selector: 'app-card-group',
  templateUrl: './card-group.component.html',
  styleUrls: ['./card-group.component.css'],
  standalone: false
})
export class CardGroupComponent {
  @Input() group!: CardGroup;
  @Input() groupIndex!: number;
  @Input() selectedCards: CardSelection[] = [];
  @Input() allGroups: CardGroup[] = [];

  @Output() cardSelected = new EventEmitter<CardSelection>();
  @Output() cardAdded = new EventEmitter<CardSelection>();
  @Output() groupRenamed = new EventEmitter<{ groupIndex: number; newName: string }>();
  @Output() cardDeleted = new EventEmitter<{ groupIndex: number; cardIndex: number }>();
  @Output() cardMoved = new EventEmitter<{ 
    fromGroup: number; 
    fromCard: number; 
    toGroup: number; 
    toCard: number;
    draggedCards?: any[];
    draggedIndices?: number[];
    isMultiMove?: boolean;
  }>();
  @Output() cardEditRequested = new EventEmitter<{ groupIndex: number; cardIndex: number }>();

  // Click vs Drag detection
  private mouseDownTimer: any = null;
  private mouseDownStartTime = 0;
  private dragThreshold = 200;
  private isDragMode = false;
  private pendingCardIndex = -1;

  constructor(
    private elementService: ElementService, 
    private contextMenuService: ContextMenuService,
    public dragDropService: DragDropService
  ) {
    // Listen for move events (replaces both cardSwaps and crossGroupMoves)
    this.dragDropService.moveEvents.subscribe(moveEvent => {
      this.handleMoveEvent(moveEvent);
    });
  }

  onMouseDown(event: MouseEvent, cardIndex: number): void {
    if (event.button !== 0 || (event.target as HTMLElement).closest('.card-delete-btn')) {
      return;
    }

    event.preventDefault();
    
    this.mouseDownStartTime = Date.now();
    this.pendingCardIndex = cardIndex;
    this.isDragMode = false;
    
    this.mouseDownTimer = setTimeout(() => {
      this.startDragMode(cardIndex, event.clientX, event.clientY);
    }, this.dragThreshold);
  }

  @HostListener('document:mouseup', ['$event'])
  onMouseUp(event: MouseEvent): void {
    if (this.mouseDownTimer) {
      clearTimeout(this.mouseDownTimer);
      this.mouseDownTimer = null;
      
      if (!this.isDragMode && this.pendingCardIndex >= 0) {
        this.handleCardClick(this.pendingCardIndex, event);
      }
    }
    
    if (this.dragDropService.currentState.isDragging) {
      this.dragDropService.endDrag();
    }
    
    this.isDragMode = false;
    this.pendingCardIndex = -1;
  }

  @HostListener('document:mousemove', ['$event'])
  onMouseMove(event: MouseEvent): void {
    if (this.mouseDownTimer && !this.isDragMode) {
      const timeSinceMouseDown = Date.now() - this.mouseDownStartTime;
      if (timeSinceMouseDown < this.dragThreshold) {
        clearTimeout(this.mouseDownTimer);
        this.mouseDownTimer = null;
        this.startDragMode(this.pendingCardIndex, event.clientX, event.clientY);
      }
    }
    
    if (this.dragDropService.currentState.isDragging) {
      this.dragDropService.updateDragPosition(event.clientX, event.clientY, event.clientX - 125, event.clientY - 175);
    }
  }

  private startDragMode(cardIndex: number, x: number, y: number): void {
    if (cardIndex < 0) return;
    
    this.isDragMode = true;
    const card = this.group.cards[cardIndex];
    
    const isCardSelected = this.isCardSelected(cardIndex);
    const isMultiSelect = this.selectedCards.length > 1;
    
    if (isMultiSelect && isCardSelected) {
      // Multi-card drag
      let selectedCardsInThisGroup = this.selectedCards
        .filter(selection => selection.groupIndex === this.groupIndex)
        .sort((a, b) => a.cardIndex - b.cardIndex);
      
      // Remove duplicates
      const uniqueSelections = new Map<number, any>();
      selectedCardsInThisGroup.forEach(selection => {
        uniqueSelections.set(selection.cardIndex, selection);
      });
      selectedCardsInThisGroup = Array.from(uniqueSelections.values()).sort((a, b) => a.cardIndex - b.cardIndex);
      
      const selectedCards = selectedCardsInThisGroup.map(selection => this.group.cards[selection.cardIndex]);
      const selectedIndices = selectedCardsInThisGroup.map(selection => selection.cardIndex);
      
      if (selectedCards.length !== selectedIndices.length) {
        console.error(`❌ Card/index count mismatch`);
        return;
      }
      
      const uniqueIndices = new Set(selectedIndices);
      if (uniqueIndices.size !== selectedIndices.length) {
        console.error(`❌ Duplicate indices detected`);
        return;
      }
      
      this.dragDropService.startDrag(card, this.groupIndex, cardIndex, x, y, selectedCards, selectedIndices);
    } else {
      // Single card drag
      this.dragDropService.startDrag(card, this.groupIndex, cardIndex, x, y);
    }
  }

  private handleCardClick(cardIndex: number, event: MouseEvent): void {
    const hasExistingSelection = this.selectedCards.length > 0;
    
    if (event.shiftKey && hasExistingSelection) {
      this.handleShiftClick(cardIndex);
    } else if (hasExistingSelection) {
      this.cardSelected.emit({ groupIndex: this.groupIndex, cardIndex });
    }
    // No selection + single click = ignored (need double-click)
  }

  onCardClick(cardIndex: number, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
  }

  onCardDoubleClick(cardIndex: number, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    this.cardSelected.emit({ groupIndex: this.groupIndex, cardIndex });
  }

  private handleShiftClick(cardIndex: number): void {
    if (this.selectedCards.length === 0) {
      return;
    }
    
    const isSelected = this.isCardSelected(cardIndex);
    
    if (isSelected) {
      this.cardSelected.emit({ 
        groupIndex: this.groupIndex, 
        cardIndex, 
        action: 'remove' 
      });
    } else {
      this.cardSelected.emit({ 
        groupIndex: this.groupIndex, 
        cardIndex, 
        action: 'add' 
      });
    }
  }

  onAddCard(): void {
    this.cardAdded.emit({ groupIndex: this.groupIndex, cardIndex: -1 });
  }

  onDeleteCard(cardIndex: number): void {
    this.cardDeleted.emit({ groupIndex: this.groupIndex, cardIndex });
  }

  isCardSelected(cardIndex: number): boolean {
    return this.selectedCards.some(
      card => card.groupIndex === this.groupIndex && card.cardIndex === cardIndex
    );
  }

  getElementSymbol(elementKey: string): string {
    return this.elementService.getElementSymbol(elementKey);
  }

  onGroupContextMenu(event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();
    
    this.contextMenuService.showForGroup(this.groupIndex, {
      x: event.clientX,
      y: event.clientY
    });
  }

  onCardContextMenu(event: MouseEvent, cardIndex: number): void {
    event.preventDefault();
    event.stopPropagation();
    
    const isSelected = this.isCardSelected(cardIndex);
    const hasMultipleSelected = this.selectedCards.length > 1;
    
    if (hasMultipleSelected && isSelected) {
      this.contextMenuService.showForMultipleCards(this.selectedCards, {
        x: event.clientX,
        y: event.clientY
      });
    } else {
      this.contextMenuService.showForCard(
        this.groupIndex, 
        cardIndex, 
        {
          x: event.clientX,
          y: event.clientY
        },
        this.group.cards.length // Pass the card count
      );
    }
  }

  private handleMoveEvent(moveEvent: { fromGroup: number; fromCard: number; toGroup: number; toCard: number; draggedCards?: any[]; draggedIndices?: number[]; isMultiMove?: boolean }): void {
    const isSameGroup = moveEvent.fromGroup === moveEvent.toGroup;
    const moveType = isSameGroup ? 'same-group' : 'cross-group';
    
    // Only the SOURCE group should emit the move event to prevent duplicates
    if (moveEvent.fromGroup === this.groupIndex) {
      this.cardMoved.emit(moveEvent);
    }
  }

  isCardBeingDragged(cardIndex: number): boolean {
    return this.dragDropService.isCardBeingDragged(this.groupIndex, cardIndex);
  }

  async moveCardLeft(cardIndex: number): Promise<void> {
    if (cardIndex <= 0) return;
    
    this.cardMoved.emit({
      fromGroup: this.groupIndex,
      fromCard: cardIndex,
      toGroup: this.groupIndex,
      toCard: cardIndex - 1
    });
  }

  async moveCardRight(cardIndex: number): Promise<void> {
    if (cardIndex >= this.group.cards.length - 1) return;
    
    this.cardMoved.emit({
      fromGroup: this.groupIndex,
      fromCard: cardIndex,
      toGroup: this.groupIndex,
      toCard: cardIndex + 1
    });
  }

  onEditCard(cardIndex: number): void {
    this.cardEditRequested.emit({ groupIndex: this.groupIndex, cardIndex });
  }
}
