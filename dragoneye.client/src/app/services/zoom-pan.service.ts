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
    const factor = event.deltaY > 0 ? 0.9 : 1.1;
    this.adjustZoomAtPoint(factor, event.clientX, event.clientY);
  }

  zoomIn(): void {
    // For button clicks, zoom toward the center of the viewport
    if (this.viewportRef) {
      const rect = this.viewportRef.nativeElement.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      this.adjustZoomAtPoint(1.1, centerX, centerY);
    }
  }

  zoomOut(): void {
    // For button clicks, zoom toward the center of the viewport
    if (this.viewportRef) {
      const rect = this.viewportRef.nativeElement.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      this.adjustZoomAtPoint(0.9, centerX, centerY);
    }
  }

  // Public method for zooming at a specific point
  adjustZoomAtPoint(factor: number, clientX: number, clientY: number): void {
    if (!this.viewportRef) return;

    const rect = this.viewportRef.nativeElement.getBoundingClientRect();

    // Convert client coordinates to viewport-relative coordinates
    const viewportX = clientX - rect.left;
    const viewportY = clientY - rect.top;

    // Calculate the point in the transformed coordinate system
    const pointX = (viewportX - this.translateX) / this.scale;
    const pointY = (viewportY - this.translateY) / this.scale;

    // Calculate new scale
    const newScale = Math.max(this.MIN_SCALE, Math.min(this.MAX_SCALE, this.scale * factor));

    // Calculate new translation to keep the point under the cursor
    const newTranslateX = viewportX - pointX * newScale;
    const newTranslateY = viewportY - pointY * newScale;

    // Update values
    this.scale = newScale;
    this.translateX = newTranslateX;
    this.translateY = newTranslateY;

    this.updateTransform();
  }

  private adjustZoom(factor: number): void {
    // Legacy method - kept for compatibility but should use adjustZoomAtPoint instead
    this.scale = Math.max(this.MIN_SCALE, Math.min(this.MAX_SCALE, this.scale * factor));
    this.updateTransform();
  }

  resetView(): void {
    this.scale = 1;
    this.translateX = 0;
    this.translateY = 0;
    this.updateTransform();
  }

  setTransform(newScale: number, newTranslateX: number, newTranslateY: number): void {
    this.scale = Math.max(this.MIN_SCALE, Math.min(this.MAX_SCALE, newScale));
    this.translateX = newTranslateX;
    this.translateY = newTranslateY;
    this.updateTransform();
  }

  private updateTransform(): void {
    if (this.viewportRef) {
      this.viewportRef.nativeElement.style.transform = `translate(${this.translateX}px, ${this.translateY}px) scale(${this.scale})`;
    }
  }
}
