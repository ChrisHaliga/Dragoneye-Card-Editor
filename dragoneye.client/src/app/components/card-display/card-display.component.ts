import { Component, Input, ViewChild, ElementRef, AfterViewInit, HostListener, OnChanges, SimpleChanges, DoCheck } from '@angular/core';
import { Card, CardDetail } from '../../services/card.service';
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

  constructor(public zoomPanService: ZoomPanService) {
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

  onMouseDown(event: MouseEvent): void { this.zoomPanService.startPan(event); }
  onWheel(event: WheelEvent): void { this.zoomPanService.zoom(event); }
  zoomIn(): void { this.zoomPanService.zoomIn(); }
  zoomOut(): void { this.zoomPanService.zoomOut(); }
  resetView(): void { this.zoomPanService.resetView(); }

  getCircles(count: number): any[] { return new Array(Math.max(0, count)); }
  
  getDetailTitleX(detail: CardDetail): number { 
    return this.TEXT_START_X + Math.max(detail.apCost + detail.spCost, 1) * 8 + 5; 
  }

  private calculateDetailLayouts(): void {
    if (!this.card || !this.ctx) {
      this.detailLayouts = [];
      return;
    }

    this.detailLayouts = [];
    let currentY = this.TEXT_START_Y;

    for (const detail of this.card.details) {
      if (currentY > this.DESCRIPTION_BOX_Y + this.DESCRIPTION_BOX_HEIGHT - 20) {
        break; // Stop if we've run out of space
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
}
