import { Injectable, ElementRef } from '@angular/core';

@Injectable()
export class ZoomPanService {
  private isPanning = false;
  private startX = 0;
  private startY = 0;
  private translateX = 0;
  private translateY = 0;
  private scale = 1;
  private readonly MIN_SCALE = 0.3;
  private readonly MAX_SCALE = 3;
  private viewportRef?: ElementRef<HTMLElement>;

  get currentScale(): number { return this.scale; }

  setViewport(viewport: ElementRef<HTMLElement>): void {
    this.viewportRef = viewport;
  }

  startPan(event: MouseEvent): void {
    if (event.button !== 0) return;
    this.isPanning = true;
    this.startX = event.clientX - this.translateX;
    this.startY = event.clientY - this.translateY;
    event.preventDefault();
  }

  updatePan(event: MouseEvent): void {
    if (!this.isPanning) return;
    this.translateX = event.clientX - this.startX;
    this.translateY = event.clientY - this.startY;
    this.updateTransform();
  }

  endPan(): void {
    this.isPanning = false;
  }

  zoom(event: WheelEvent): void {
    event.preventDefault();
    this.adjustZoom(event.deltaY > 0 ? 0.9 : 1.1);
  }

  zoomIn(): void { this.adjustZoom(1.1); }
  zoomOut(): void { this.adjustZoom(0.9); }

  resetView(): void {
    this.scale = 1;
    this.translateX = 0;
    this.translateY = 0;
    this.updateTransform();
  }

  private adjustZoom(factor: number): void {
    this.scale = Math.max(this.MIN_SCALE, Math.min(this.MAX_SCALE, this.scale * factor));
    this.updateTransform();
  }

  private updateTransform(): void {
    if (this.viewportRef) {
      this.viewportRef.nativeElement.style.transform = `translate(${this.translateX}px, ${this.translateY}px) scale(${this.scale})`;
    }
  }
}
