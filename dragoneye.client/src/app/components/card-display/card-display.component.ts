import { Component, Input, ViewChild, ElementRef, AfterViewInit, HostListener, OnChanges, SimpleChanges, DoCheck, Output, EventEmitter } from '@angular/core';
import { Card, CardDetail, CardService } from '../../services/card.service';
import { ZoomPanService } from '../../services/zoom-pan.service';

interface TextLine {
  text: string;
  width: number;
}

interface DetailLayout {
  detail: CardDetail;
  yPosition: number;
  height: number;
  titleX: number;
  lines: TextLine[];
}

@Component({
  selector: 'app-card-display',
  templateUrl: './card-display.component.html',
  styleUrls: ['./card-display.component.css'],
  providers: [ZoomPanService],
  standalone: false
})
export class CardDisplayComponent implements AfterViewInit, OnChanges, DoCheck {
  @ViewChild('cardViewport') cardViewport!: ElementRef<HTMLElement>;
  @Input() card: Card | null = null;
  @Input() elementSymbol = '';
  @Input() noCardMessage = 'Select a card from the hierarchy to start editing';
  @Input() selectedGroupIndex = 0;
  @Input() selectedCardIndex = 0;
  @Output() cardSelected = new EventEmitter<{groupIndex: number, cardIndex: number}>();
  @Output() cardAdded = new EventEmitter<{groupIndex: number, cardIndex: number}>();
  @Output() deleteCard = new EventEmitter<{groupIndex: number, cardIndex: number}>();
  @Output() deleteGroup = new EventEmitter<number>();

  // Layout constants
  private readonly DESCRIPTION_BOX_X = 20;
  private readonly DESCRIPTION_BOX_Y = 180;
  private readonly DESCRIPTION_BOX_WIDTH = 160;
  private readonly DESCRIPTION_BOX_HEIGHT = 75;
  private readonly TEXT_START_X = 24;
  private readonly TEXT_START_Y = 190;
  private readonly LINE_HEIGHT = 7;
  private readonly TITLE_OFFSET_Y = 2.25;
  private readonly DETAIL_SPACING = 4;
  private readonly FONT_SIZE = 6;
  private readonly TITLE_FONT_SIZE = 7;
  
  detailLayouts: DetailLayout[] = [];
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private lastDetailsHash = '';
  
  editingGroupIndex = -1;

  constructor(
    public zoomPanService: ZoomPanService,
    public cardService: CardService
  ) {
    // Create invisible canvas for text measurement
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d');
  }

  ngAfterViewInit(): void {
    this.zoomPanService.setViewport(this.cardViewport);
    this.calculateDetailLayouts();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['card']) {
      this.calculateDetailLayouts();
    }
  }

  ngDoCheck(): void {
    if (this.card && this.card.details) {
      const currentDetailsHash = JSON.stringify(this.card.details);
      if (currentDetailsHash !== this.lastDetailsHash) {
        this.lastDetailsHash = currentDetailsHash;
        this.calculateDetailLayouts();
      }
    }
  }

  @HostListener('document:mousemove', ['$event'])
  onMouseMove(event: MouseEvent): void {
    this.zoomPanService.updatePan(event);
  }

  @HostListener('document:mouseup')
  onMouseUp(): void {
    this.zoomPanService.endPan();
  }

  @HostListener('document:touchmove', ['$event'])
  onTouchMove(event: TouchEvent): void {
    if (event.touches.length === 1) {
      // Single finger - pan
      event.preventDefault();
      const touch = event.touches[0];
      const mouseEvent = new MouseEvent('mousemove', {
        clientX: touch.clientX,
        clientY: touch.clientY
      });
      this.zoomPanService.updatePan(mouseEvent);
    } else if (event.touches.length === 2) {
      // Two fingers - zoom
      event.preventDefault();
      this.handlePinchZoom(event);
    }
  }

  @HostListener('document:touchend', ['$event'])
  onTouchEnd(event: TouchEvent): void {
    if (event.touches.length === 0) {
      this.zoomPanService.endPan();
      this.lastPinchDistance = null;
    }
  }

  private lastPinchDistance: number | null = null;

  private handlePinchZoom(event: TouchEvent): void {
    if (event.touches.length !== 2) return;

    const touch1 = event.touches[0];
    const touch2 = event.touches[1];
    
    // Calculate the center point between the two fingers
    const centerX = (touch1.clientX + touch2.clientX) / 2;
    const centerY = (touch1.clientY + touch2.clientY) / 2;
    
    const distance = Math.sqrt(
      Math.pow(touch2.clientX - touch1.clientX, 2) + 
      Math.pow(touch2.clientY - touch1.clientY, 2)
    );

    if (this.lastPinchDistance !== null) {
      const delta = distance - this.lastPinchDistance;
      const factor = delta > 0 ? 1.02 : 0.98;
      
      // Use the new point-based zoom method
      this.zoomPanService.adjustZoomAtPoint(factor, centerX, centerY);
    }

    this.lastPinchDistance = distance;
  }

  onMouseDown(event: MouseEvent): void { this.zoomPanService.startPan(event); }
  onWheel(event: WheelEvent): void { this.zoomPanService.zoom(event); }

  onTouchStart(event: TouchEvent): void {
    if (event.touches.length === 1) {
      // Single finger - start pan
      const touch = event.touches[0];
      const mouseEvent = new MouseEvent('mousedown', {
        clientX: touch.clientX,
        clientY: touch.clientY
      });
      this.zoomPanService.startPan(mouseEvent);
    } else if (event.touches.length === 2) {
      // Two fingers - prepare for zoom
      this.lastPinchDistance = null;
    }
  }

  zoomIn(): void { this.zoomPanService.zoomIn(); }
  zoomOut(): void { this.zoomPanService.zoomOut(); }
  resetView(): void { this.zoomPanService.resetView(); }

  focusOnSelectedCard(): void {
    // If no card is selected, just reset to default view
    if (this.selectedGroupIndex === -1 || this.selectedCardIndex === -1) {
      this.zoomPanService.resetView();
      return;
    }

    // Find the selected card element in the DOM
    const selectedCardElement = document.querySelector('.card-container.editing-card .group-card');
    
    if (selectedCardElement && this.cardViewport) {
      const cardRect = selectedCardElement.getBoundingClientRect();
      const viewportRect = this.cardViewport.nativeElement.getBoundingClientRect();
      
      // Calculate the center of the card relative to the viewport
      const cardCenterX = cardRect.left + cardRect.width / 2 - viewportRect.left;
      const cardCenterY = cardRect.top + cardRect.height / 2 - viewportRect.top;
      
      // Calculate the viewport center
      const viewportCenterX = viewportRect.width / 2;
      const viewportCenterY = viewportRect.height / 2;
      
      // Calculate the offset needed to center the card
      const offsetX = viewportCenterX - cardCenterX;
      const offsetY = viewportCenterY - cardCenterY;
      
      // Set a comfortable zoom level (1.5x) and center on the card
      this.zoomPanService.setTransform(1.5, offsetX * 1.5, offsetY * 1.5);
    } else {
      // Fallback to reset view if card not found
      this.zoomPanService.resetView();
    }
  }

  onZoomControlsHover(isHovering: boolean): void {
    // CSS handles the opacity change via :hover
    // This method exists for potential future enhancements
  }

  onZoomControlsTouch(isTouching: boolean): void {
    const controls = document.querySelector('.zoom-controls') as HTMLElement;
    if (controls) {
      if (isTouching) {
        controls.style.opacity = '1';
      } else {
        // Reset to default after a short delay
        setTimeout(() => {
          controls.style.opacity = '';
        }, 2000);
      }
    }
  }

  getCircles(count: number): any[] { return new Array(Math.max(0, count)); }

  private calculateDetailLayouts(): void {
    if (!this.card || !this.ctx) {
      this.detailLayouts = [];
      return;
    }

    this.detailLayouts = [];
    let currentY = this.TEXT_START_Y;

    for (const detail of this.card.details) {
      if (currentY > this.DESCRIPTION_BOX_Y + this.DESCRIPTION_BOX_HEIGHT - 20) {
        break;
      }

      const titleX = this.getDetailTitleX(detail);
      const availableWidth = this.DESCRIPTION_BOX_X + this.DESCRIPTION_BOX_WIDTH - this.TEXT_START_X - 8;
      const lines = this.wrapText(detail.details, availableWidth);
      
      const detailHeight = this.LINE_HEIGHT + (lines.length * this.LINE_HEIGHT) + this.DETAIL_SPACING;
      
      this.detailLayouts.push({
        detail,
        yPosition: currentY,
        height: detailHeight,
        titleX,
        lines
      });

      currentY += detailHeight;
    }
  }

  private wrapText(text: string, maxWidth: number): TextLine[] {
    if (!this.ctx) return [{ text, width: 0 }];

    this.ctx.font = `${this.FONT_SIZE}px serif`;
    
    const words = text.split(' ');
    const lines: TextLine[] = [];
    let currentLine = '';

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const metrics = this.ctx.measureText(testLine);
      
      if (metrics.width <= maxWidth) {
        currentLine = testLine;
      } else {
        if (currentLine) {
          lines.push({
            text: currentLine,
            width: this.ctx.measureText(currentLine).width
          });
        }
        currentLine = word;
      }
    }

    if (currentLine) {
      lines.push({
        text: currentLine,
        width: this.ctx.measureText(currentLine).width
      });
    }

    return lines;
  }

  getDetailTitleX(detail: CardDetail): number { 
    return this.TEXT_START_X + Math.max(detail.apCost + detail.spCost, 1) * 8 + 5; 
  }

  getDetailCircleY(layoutIndex: number): number {
    const layout = this.detailLayouts[layoutIndex];
    return layout ? layout.yPosition : 0;
  }

  getDetailTitleY(layoutIndex: number): number {
    const layout = this.detailLayouts[layoutIndex];
    return layout ? layout.yPosition + this.TITLE_OFFSET_Y : 0;
  }

  getDetailTextY(layoutIndex: number): number {
    const layout = this.detailLayouts[layoutIndex];
    return layout ? layout.yPosition + this.TITLE_OFFSET_Y + this.LINE_HEIGHT : 0;
  }

  getDetailLayout(index: number): DetailLayout | null {
    return this.detailLayouts[index] || null;
  }

  getVisibleDetailsCount(): number {
    return this.detailLayouts.length;
  }

  getHiddenDetailsCount(): number {
    return this.card ? Math.max(0, this.card.details.length - this.detailLayouts.length) : 0;
  }

  isSelectedCard(groupIndex: number, cardIndex: number): boolean {
    return groupIndex === this.selectedGroupIndex && cardIndex === this.selectedCardIndex;
  }

  getElementSymbol(element: string): string {
    return this.cardService.getElementSymbol(element);
  }

  onCardClick(groupIndex: number, cardIndex: number): void {
    this.cardSelected.emit({ groupIndex, cardIndex });
  }

  getDetailLayoutsForCard(card: Card): DetailLayout[] {
    if (!card || !this.ctx) {
      return [];
    }

    const layouts: DetailLayout[] = [];
    let currentY = 190;
    const maxY = 255; // Bottom of description box

    for (const detail of card.details) {
      if (currentY > maxY - 20) {
        break; // Stop if we've run out of space
      }

      const titleX = 28 + Math.max(detail.apCost + detail.spCost, 1) * 8 + 5;
      const availableWidth = 160 - 28 - 8; // Box width minus margins
      const lines = this.wrapTextForCard(detail.details, availableWidth);
      
      const detailHeight = 11 + (lines.length * 7); // Title height + lines
      
      layouts.push({
        detail,
        yPosition: currentY,
        height: detailHeight,
        titleX,
        lines
      });

      currentY += detailHeight + 4; // Add spacing
    }

    return layouts;
  }

  private wrapTextForCard(text: string, maxWidth: number): TextLine[] {
    if (!this.ctx) return [{ text, width: 0 }];

    this.ctx.font = `6px serif`;
    
    const words = text.split(' ');
    const lines: TextLine[] = [];
    let currentLine = '';

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const metrics = this.ctx.measureText(testLine);
      
      if (metrics.width <= maxWidth) {
        currentLine = testLine;
      } else {
        if (currentLine) {
          lines.push({
            text: currentLine,
            width: this.ctx.measureText(currentLine).width
          });
        }
        currentLine = word;
      }
    }

    if (currentLine) {
      lines.push({
        text: currentLine,
        width: this.ctx.measureText(currentLine).width
      });
    }

    return lines;
  }

  getHiddenDetailsCountForCard(card: Card): number {
    const visibleLayouts = this.getDetailLayoutsForCard(card);
    return Math.max(0, card.details.length - visibleLayouts.length);
  }

  // Group management methods
  startEditingGroup(groupIndex: number): void {
    this.editingGroupIndex = groupIndex;
    // Focus the input after Angular updates the DOM
    setTimeout(() => {
      const input = document.querySelector('.group-name-input') as HTMLInputElement;
      if (input) {
        input.focus();
        input.select();
      }
    }, 0);
  }

  finishEditingGroup(): void {
    this.editingGroupIndex = -1;
  }

  onGroupNameBlur(): void {
    // Delay finishing editing to allow for click events to process first
    setTimeout(() => {
      this.finishEditingGroup();
    }, 100);
  }

  onGroupNameKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      this.finishEditingGroup();
    } else if (event.key === 'Escape') {
      this.finishEditingGroup();
    }
  }

  onViewportClick(event: MouseEvent): void {
    // Close group editing when clicking anywhere in the viewport
    if (this.editingGroupIndex !== -1) {
      this.finishEditingGroup();
    }
  }

  addGroup(): void {
    this.cardService.addGroup();
    const newGroupIndex = this.cardService.cardData.groups.length - 1;
    this.startEditingGroup(newGroupIndex);
  }

  duplicateGroup(groupIndex: number): void {
    this.cardService.duplicateGroup(groupIndex);
  }

  onDeleteGroup(groupIndex: number): void {
    if (this.cardService.cardData.groups.length > 1) {
      this.deleteGroup.emit(groupIndex);
    }
  }

  addCard(groupIndex: number): void {
    const newCard = this.cardService.addCard(groupIndex);
    const newCardIndex = this.cardService.cardData.groups[groupIndex].cards.length - 1;
    this.cardAdded.emit({ groupIndex, cardIndex: newCardIndex });
  }

  onDeleteCard(groupIndex: number, cardIndex: number, event: Event): void {
    event.stopPropagation(); // Prevent card selection
    this.deleteCard.emit({ groupIndex, cardIndex });
  }
}
