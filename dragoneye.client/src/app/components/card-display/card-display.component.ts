import { Component, Input, ViewChild, ElementRef, AfterViewInit, HostListener } from '@angular/core';
import { Card, CardDetail } from '../../services/card.service';
import { ZoomPanService } from '../../services/zoom-pan.service';

@Component({
  selector: 'app-card-display',
  templateUrl: './card-display.component.html',
  styleUrls: ['./card-display.component.css'],
  providers: [ZoomPanService],
  standalone: false
})
export class CardDisplayComponent implements AfterViewInit {
  @ViewChild('cardViewport') cardViewport!: ElementRef<HTMLElement>;
  @Input() card: Card | null = null;
  @Input() elementSymbol = '';
  @Input() noCardMessage = 'Select a card from the hierarchy to start editing';

  constructor(public zoomPanService: ZoomPanService) {}

  ngAfterViewInit(): void {
    this.zoomPanService.setViewport(this.cardViewport);
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
  getDetailTitleX(detail: CardDetail): number { return 28 + Math.max(detail.apCost + detail.spCost, 1) * 8 + 5; }
}
