import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { Subscription } from 'rxjs';
import { CardService, CardData, Card } from '../../services/card.service';
import { CardSelection } from '../card-hierarchy/card-hierarchy.component';

@Component({
  selector: 'app-card-editor',
  templateUrl: './card-editor.component.html',
  styleUrls: ['./card-editor.component.css'],
  standalone: false
})
export class CardEditorComponent implements OnInit, OnDestroy {
  public isEditorOpen: boolean = true;
  public isBottomPanelOpen: boolean = true;
  public selectedGroupIndex: number = 0;
  public selectedCardIndex: number = 0;
  public cardData: CardData = { filename: '', groups: [] };
  
  private cardDataSubscription?: Subscription;

  constructor(public cardService: CardService) {}

  public ngOnInit(): void {
    this.cardDataSubscription = this.cardService.cardData$.subscribe(data => {
      this.cardData = data;
      this.ensureValidSelection();
    });
  }

  public ngOnDestroy(): void {
    this.cardDataSubscription?.unsubscribe();
  }

  @HostListener('document:keydown', ['$event'])
  public onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      // Let child components handle their own escape logic
    }
  }

  private ensureValidSelection(): void {
    if (this.selectedGroupIndex >= this.cardData.groups.length) {
      this.selectedGroupIndex = 0;
    }
    const currentGroup = this.cardData.groups[this.selectedGroupIndex];
    if (currentGroup && this.selectedCardIndex >= currentGroup.cards.length) {
      this.selectedCardIndex = 0;
    }
  }

  public get currentCard(): Card | null {
    const group = this.cardData.groups[this.selectedGroupIndex];
    return group?.cards[this.selectedCardIndex] || null;
  }

  public get hasCards(): boolean {
    return this.cardService.hasCards;
  }

  public get noCardMessage(): string {
    return !this.hasCards ? 'No cards available. Create a card to get started.' : 'Select a card from the hierarchy to start editing';
  }

  public get currentElementSymbol(): string {
    return this.currentCard ? this.cardService.getElementSymbol(this.currentCard.element) : '';
  }

  // Panel management
  public toggleEditor(): void { 
    this.isEditorOpen = !this.isEditorOpen; 
  }
  
  public toggleBottomPanel(): void { 
    this.isBottomPanelOpen = !this.isBottomPanelOpen; 
  }

  // File operations
  public saveData(): void {
    this.cardService.saveData();
  }

  public loadFile(event: Event): void {
    this.cardService.loadFile(event).catch(error => {
      console.error(error);
    });
  }

  // Card selection
  public onCardSelected(selection: CardSelection): void {
    this.selectedGroupIndex = selection.groupIndex;
    this.selectedCardIndex = selection.cardIndex;
  }

  public onCardAdded(selection: CardSelection): void {
    this.selectedGroupIndex = selection.groupIndex;
    this.selectedCardIndex = selection.cardIndex;
  }
}
