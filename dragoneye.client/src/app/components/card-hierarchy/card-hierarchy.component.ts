import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CardData, CardService } from '../../services/card.service';

export interface CardSelection {
  groupIndex: number;
  cardIndex: number;
}

@Component({
  selector: 'app-card-hierarchy',
  templateUrl: './card-hierarchy.component.html',
  styleUrls: ['./card-hierarchy.component.css'],
  standalone: false
})
export class CardHierarchyComponent {
  @Input() cardData!: CardData;
  @Input() selectedGroupIndex = 0;
  @Input() selectedCardIndex = 0;
  @Output() cardSelected = new EventEmitter<CardSelection>();
  @Output() cardAdded = new EventEmitter<CardSelection>();

  editingGroupIndex = -1;

  constructor(public cardService: CardService) {}

  onToggleGroup(index: number): void { this.cardService.toggleGroup(index); }
  onAddGroup(): void { this.cardService.addGroup(); }
  onRemoveGroup(index: number): void { this.cardService.removeGroup(index); }
  onDuplicateGroup(index: number): void { this.cardService.duplicateGroup(index); }
  onRemoveCard(groupIndex: number, cardIndex: number): void { this.cardService.removeCard(groupIndex, cardIndex); }
  onDuplicateCard(groupIndex: number, cardIndex: number): void { this.cardService.duplicateCard(groupIndex, cardIndex); }

  startEditingGroup(index: number, event: Event): void {
    event.stopPropagation();
    this.editingGroupIndex = index;
  }

  finishEditingGroup(): void {
    this.editingGroupIndex = -1;
  }

  onSelectCard(groupIndex: number, cardIndex: number): void {
    this.cardSelected.emit({ groupIndex, cardIndex });
  }

  onAddCard(groupIndex: number): void {
    this.cardService.addCard(groupIndex);
    this.cardAdded.emit({ groupIndex, cardIndex: this.cardData.groups[groupIndex].cards.length - 1 });
  }
}
