import { Component, OnInit, OnDestroy } from '@angular/core';

interface CardDetail {
  type: string;
  details: string;
  apCost: number;
  spCost: number;
  expanded?: boolean;
}

interface Card {
  title: string;
  element: string;
  backgroundImage?: string;
  details: CardDetail[];
}

interface CardGroup {
  name: string;
  cards: Card[];
  expanded?: boolean;
}

interface CardData {
  filename: string;
  groups: CardGroup[];
}

interface ElementData {
  key: string;
  name: string;
  symbol: string;
  color?: string;
}

@Component({
  selector: 'app-card-editor',
  templateUrl: './card-editor.component.html',
  styleUrls: ['./card-editor.component.css'],
  standalone: false
})
export class CardEditorComponent implements OnInit, OnDestroy {
  public isEditorOpen = true;
  public isBottomPanelOpen = true;
  public selectedGroupIndex = 0;
  public selectedCardIndex = 0;
  public selectedDetailIndex = -1; // Start with none selected
  public editingGroupIndex = -1; // Track which group is being renamed

  // Element data - centralized and reusable
  public readonly elements: ElementData[] = [
    { key: 'fire', name: 'Fire', symbol: '🔥', color: '#ff4444' },
    { key: 'water', name: 'Water', symbol: '💧', color: '#4444ff' },
    { key: 'earth', name: 'Earth', symbol: '🌍', color: '#8b4513' },
    { key: 'air', name: 'Air', symbol: '💨', color: '#ffd700' },
    { key: 'dark', name: 'Dark', symbol: '▼', color: '#2f2f2f' },
    { key: 'light', name: 'Light', symbol: '🜂', color: '#eeeeee' },
    { key: 'arcane', name: 'Arcane', symbol: '✶', color: '#9932cc' }
  ];

  // Zoom and Pan state
  private isPanning = false;
  private panStartX = 0;
  private panStartY = 0;
  private currentX = 0;
  private currentY = 0;
  public scale = 1; // Make this public so template can access it
  private readonly MIN_SCALE = 0.3;
  private readonly MAX_SCALE = 3;

  // Mock data - replace with @Input() later
  public cardData: CardData = {
    filename: 'my-card-set.json',
    groups: [
      {
        name: 'Fire Cards',
        expanded: true,
        cards: [
          {
            title: 'Flame Strike',
            element: 'fire',
            backgroundImage: '',
            details: [
              { type: 'Attack', details: 'Deal 3 damage to target enemy', apCost: 2, spCost: 1 },
              { type: 'Burn', details: 'Target burns for 2 turns', apCost: 0, spCost: 0 }
            ]
          },
          {
            title: 'Fireball',
            element: 'fire',
            backgroundImage: '',
            details: [
              { type: 'Spell', details: 'Deal 2 damage to all enemies', apCost: 3, spCost: 2 }
            ]
          }
        ]
      },
      {
        name: 'Water Cards',
        expanded: false,
        cards: [
          {
            title: 'Healing Wave',
            element: 'water',
            backgroundImage: '',
            details: [
              { type: 'Heal', details: 'Restore 5 HP to target ally', apCost: 1, spCost: 1 }
            ]
          }
        ]
      }
    ]
  };

  ngOnInit() {
    document.addEventListener('mousemove', this.onMouseMove.bind(this));
    document.addEventListener('mouseup', this.onMouseUp.bind(this));
    document.addEventListener('keydown', this.onKeyDown.bind(this));
    this.updateCardTransform();
    this.ensureValidSelection();
  }

  ngOnDestroy() {
    document.removeEventListener('mousemove', this.onMouseMove);
    document.removeEventListener('mouseup', this.onMouseUp);
    document.removeEventListener('keydown', this.onKeyDown);
  }

  private onKeyDown(event: KeyboardEvent) {
    // Close editing on Escape
    if (event.key === 'Escape') {
      this.editingGroupIndex = -1;
      this.selectedDetailIndex = -1;
    }
  }

  private onMouseMove(event: MouseEvent) {
    if (this.isPanning) {
      this.currentX = event.clientX - this.panStartX;
      this.currentY = event.clientY - this.panStartY;
      this.updateCardTransform();
    }
  }

  private onMouseUp() {
    this.isPanning = false;
  }

  private ensureValidSelection() {
    // Ensure selection is valid
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
    return this.cardData.groups.some(group => group.cards.length > 0);
  }

  public toggleEditor(): void {
    this.isEditorOpen = !this.isEditorOpen;
  }

  public toggleBottomPanel(): void {
    this.isBottomPanelOpen = !this.isBottomPanelOpen;
  }

  public toggleGroup(index: number): void {
    this.cardData.groups[index].expanded = !this.cardData.groups[index].expanded;
  }

  public startEditingGroup(index: number, event: Event): void {
    event.stopPropagation();
    this.editingGroupIndex = index;
  }

  public finishEditingGroup(): void {
    this.editingGroupIndex = -1;
  }

  public selectCard(groupIndex: number, cardIndex: number): void {
    this.selectedGroupIndex = groupIndex;
    this.selectedCardIndex = cardIndex;
    this.selectedDetailIndex = -1; // Reset detail selection
  }

  public selectDetail(index: number): void {
    this.selectedDetailIndex = this.selectedDetailIndex === index ? -1 : index;
  }

  public saveData(): void {
    try {
      const dataStr = JSON.stringify(this.cardData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);

      const link = document.createElement('a');
      link.href = url;
      link.download = this.cardData.filename || 'card-data.json';
      link.click();

      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error saving data:', error);
      // In a real app, show user-friendly error message
    }
  }

  public loadFile(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file && file.type === 'application/json') {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target?.result as string);
          this.cardData = data;
          this.ensureValidSelection();
        } catch (error) {
          console.error('Error loading file:', error);
          // In a real app, show user-friendly error message
        }
      };
      reader.readAsText(file);
    }
    // Reset input
    input.value = '';
  }

  public getCircles(count: number, type: string): any[] {
    return Array(Math.max(0, count)).fill(type);
  }

  public getDetailTitleX(detail: CardDetail): number {
    return 28 + Math.max(detail.apCost + detail.spCost, 1) * 8 + 5;
  }

  public getCardImage(): string {
    return this.currentCard?.backgroundImage || '';
  }

  public onImageChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file && this.currentCard) {
      if (!file.type.startsWith('image/')) {
        console.error('Please select an image file');
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        if (this.currentCard) {
          this.currentCard.backgroundImage = e.target?.result as string;
        }
      };
      reader.readAsDataURL(file);
    }
    // Reset input
    input.value = '';
  }

  public removeImage(): void {
    if (this.currentCard) {
      this.currentCard.backgroundImage = '';
    }
  }

  public addDetail(): void {
    if (this.currentCard) {
      this.currentCard.details.push({
        type: 'New Action',
        details: 'Enter description here',
        apCost: 1,
        spCost: 0
      });
      // Select the new detail
      this.selectedDetailIndex = this.currentCard.details.length - 1;
    }
  }

  public removeDetail(index: number): void {
    if (this.currentCard && this.currentCard.details.length > 1) {
      this.currentCard.details.splice(index, 1);
      // Adjust selection if necessary
      if (this.selectedDetailIndex >= this.currentCard.details.length) {
        this.selectedDetailIndex = -1;
      }
    }
  }

  public duplicateDetail(index: number): void {
    if (this.currentCard) {
      const original = this.currentCard.details[index];
      const duplicate = { ...original, type: original.type + ' Copy' };
      this.currentCard.details.splice(index + 1, 0, duplicate);
    }
  }

  public addGroup(): void {
    this.cardData.groups.push({
      name: 'New Group',
      cards: [],
      expanded: true
    });
  }

  public removeGroup(index: number): void {
    if (this.cardData.groups.length > 1) {
      this.cardData.groups.splice(index, 1);
      this.ensureValidSelection();
    }
  }

  public duplicateGroup(index: number): void {
    const original = this.cardData.groups[index];
    const duplicate = {
      ...original,
      name: original.name + ' Copy',
      cards: original.cards.map(card => ({
        ...card,
        details: card.details.map(detail => ({ ...detail }))
      }))
    };
    this.cardData.groups.splice(index + 1, 0, duplicate);
  }

  public addCard(groupIndex: number): void {
    this.cardData.groups[groupIndex].cards.push({
      title: 'New Card',
      element: 'arcane', // Default to neutral/arcane
      backgroundImage: '',
      details: [{
        type: 'Action',
        details: 'Enter description here',
        apCost: 1,
        spCost: 0
      }]
    });

    // Select the new card
    this.selectedGroupIndex = groupIndex;
    this.selectedCardIndex = this.cardData.groups[groupIndex].cards.length - 1;
    this.selectedDetailIndex = 0;
  }

  public removeCard(groupIndex: number, cardIndex: number): void {
    const group = this.cardData.groups[groupIndex];
    if (group.cards.length > 0) {
      group.cards.splice(cardIndex, 1);
      this.ensureValidSelection();
    }
  }

  public duplicateCard(groupIndex: number, cardIndex: number): void {
    const original = this.cardData.groups[groupIndex].cards[cardIndex];
    const duplicate = {
      ...original,
      title: original.title + ' Copy',
      details: original.details.map(detail => ({ ...detail }))
    };
    this.cardData.groups[groupIndex].cards.splice(cardIndex + 1, 0, duplicate);
  }

  // Zoom and pan methods
  public startPan(event: MouseEvent): void {
    if (event.button === 0) { // Left mouse button
      this.isPanning = true;
      this.panStartX = event.clientX - this.currentX;
      this.panStartY = event.clientY - this.panStartY;
      event.preventDefault();
    }
  }

  public onZoom(event: WheelEvent): void {
    event.preventDefault();
    const delta = event.deltaY > 0 ? 0.9 : 1.1;
    this.scale = Math.max(this.MIN_SCALE, Math.min(this.MAX_SCALE, this.scale * delta));
    this.updateCardTransform();
  }

  public zoomIn(): void {
    this.scale = Math.max(this.MIN_SCALE, Math.min(this.MAX_SCALE, this.scale * 1.1));
    this.updateCardTransform();
  }

  public zoomOut(): void {
    this.scale = Math.max(this.MIN_SCALE, Math.min(this.MAX_SCALE, this.scale * 0.9));
    this.updateCardTransform();
  }

  private updateCardTransform(): void {
    const viewport = document.querySelector('.card-viewport') as HTMLElement;
    if (viewport) {
      viewport.style.transform = `translate(${this.currentX}px, ${this.currentY}px) scale(${this.scale})`;
    }
  }

  public resetCardView(): void {
    this.scale = 1;
    this.currentX = 0;
    this.currentY = 0;
    this.updateCardTransform();
  }

  // Helper methods for elements
  public getElementData(elementKey: string): ElementData | undefined {
    return this.elements.find(el => el.key === elementKey);
  }

  public getElementSymbol(element: string): string {
    const elementData = this.getElementData(element.toLowerCase());
    return elementData?.symbol || element.charAt(0).toUpperCase();
  }

  public getElementName(element: string): string {
    const elementData = this.getElementData(element.toLowerCase());
    return elementData?.name || element;
  }

  public getElementCssClass(element: string): string {
    const elementData = this.getElementData(element.toLowerCase());
    return elementData?.key || 'neutral';
  }
}
