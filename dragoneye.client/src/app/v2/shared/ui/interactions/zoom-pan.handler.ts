import { Injectable, ElementRef, NgZone } from '@angular/core';
import { Subject } from 'rxjs';

import { ViewportState } from '../../../core/models/ui-state.model';
import { VIEWPORT, TOUCH } from '../../../core/constants/layout.const';

export interface ZoomPanEvent {
  type: 'zoom' | 'pan' | 'reset';
  viewport: ViewportState;
}

@Injectable({
  providedIn: 'root'
})
export class ZoomPanHandler {
  private viewport: ElementRef<HTMLElement> | null = null;
  private contentElement: HTMLElement | null = null;
  private isPanning = false;
  private isInitialized = false;
  private lastMousePosition = { x: 0, y: 0 };
  private currentTransform: ViewportState = {
    zoom: VIEWPORT.DEFAULT_ZOOM,
    panX: 0,
    panY: 0
  };

  private zoomPanEvents = new Subject<ZoomPanEvent>();
  public zoomPanEvents$ = this.zoomPanEvents.asObservable();

  // Store event listeners for cleanup
  private eventListeners: Array<{ element: Element; event: string; handler: EventListener }> = [];
  private documentListeners: Array<{ event: string; handler: EventListener }> = [];

  constructor(private ngZone: NgZone) {}

  setViewport(viewport: ElementRef<HTMLElement>): void {
    this.cleanup();
    this.viewport = viewport;
    this.setupEventListeners();
  }

  setContentElement(element: HTMLElement): void {
    this.contentElement = element;
    this.applyTransform();
  }

  private setupEventListeners(): void {
    if (!this.viewport || this.isInitialized) return;

    const element = this.viewport.nativeElement;

    // Run outside Angular zone to prevent zone.js issues
    this.ngZone.runOutsideAngular(() => {
      // Mouse events
      const mouseDownHandler = (event: MouseEvent) => this.handleMouseDown(event);
      const wheelHandler = (event: WheelEvent) => this.handleWheel(event);

      // Touch events
      const touchStartHandler = (event: TouchEvent) => this.handleTouchStart(event);
      const touchMoveHandler = (event: TouchEvent) => this.handleTouchMove(event);
      const touchEndHandler = (event: TouchEvent) => this.handleTouchEnd(event);

      // Add event listeners and store references for cleanup
      element.addEventListener('mousedown', mouseDownHandler, { passive: false });
      element.addEventListener('wheel', wheelHandler, { passive: false });
      element.addEventListener('touchstart', touchStartHandler, { passive: false });
      element.addEventListener('touchmove', touchMoveHandler, { passive: false });
      element.addEventListener('touchend', touchEndHandler, { passive: false });

      this.eventListeners.push(
        { element, event: 'mousedown', handler: mouseDownHandler },
        { element, event: 'wheel', handler: wheelHandler },
        { element, event: 'touchstart', handler: touchStartHandler },
        { element, event: 'touchmove', handler: touchMoveHandler },
        { element, event: 'touchend', handler: touchEndHandler }
      );
    });

    this.isInitialized = true;
  }

  private cleanup(): void {
    if (!this.viewport) return;

    const element = this.viewport.nativeElement;

    // Remove event listeners
    for (const { element, event, handler } of this.eventListeners) {
      element.removeEventListener(event, handler);
    }
    this.eventListeners = [];

    // Remove document-level listeners
    for (const { event, handler } of this.documentListeners) {
      document.removeEventListener(event, handler);
    }
    this.documentListeners = [];
  }

  private handleMouseDown(event: MouseEvent): void {
    // Only handle left mouse button and avoid text selection areas
    if (event.button !== 0) return;
    
    const target = event.target as HTMLElement;
    if (target.closest('button, input, textarea, select, .group-header, .card-container')) {
      return; // Don't pan when clicking on interactive elements
    }

    event.preventDefault();
    event.stopPropagation();

    this.startPan(event);

    // Add document listeners for mouse move and up
    this.ngZone.runOutsideAngular(() => {
      const mouseMoveHandler = (e: MouseEvent) => this.handleMouseMove(e);
      const mouseUpHandler = (e: MouseEvent) => this.handleMouseUp(e);

      document.addEventListener('mousemove', mouseMoveHandler, { passive: false });
      document.addEventListener('mouseup', mouseUpHandler, { passive: false });

      this.documentListeners.push(
        { event: 'mousemove', handler: mouseMoveHandler },
        { event: 'mouseup', handler: mouseUpHandler }
      );
    });
  }

  private handleMouseMove(event: MouseEvent): void {
    if (!this.isPanning) return;
    event.preventDefault();
    this.updatePan(event);
  }

  private handleMouseUp(event: MouseEvent): void {
    this.endPan();
    this.cleanupDocumentListeners();
  }

  private handleWheel(event: WheelEvent): void {
    // Check if we should handle this wheel event
    if (!this.shouldHandleWheelEvent(event)) return;

    event.preventDefault();
    event.stopPropagation();

    this.zoom(event);
  }

  private shouldHandleWheelEvent(event: WheelEvent): boolean {
    // Only handle wheel events if:
    // 1. Ctrl key is pressed (for zoom)
    // 2. OR if the event is within our main content area and not scrollable
    
    if (event.ctrlKey || event.metaKey) {
      return true; // Always zoom with Ctrl+wheel
    }

    // Check if we're over a scrollable area
    const target = event.target as HTMLElement;
    const scrollableParent = target.closest('.cards-scroll, .modal-body, .preferences-content');
    
    if (scrollableParent) {
      // Let the browser handle scrolling in scrollable areas
      return false;
    }

    // Otherwise, treat as zoom in our main viewport
    return true;
  }

  private handleTouchStart(event: TouchEvent): void {
    if (event.touches.length === 1) {
      const touch = event.touches[0];
      this.startPan({ clientX: touch.clientX, clientY: touch.clientY } as MouseEvent);
    }
  }

  private handleTouchMove(event: TouchEvent): void {
    if (event.touches.length === 1 && this.isPanning) {
      event.preventDefault();
      const touch = event.touches[0];
      this.updatePan({ clientX: touch.clientX, clientY: touch.clientY } as MouseEvent);
    }
  }

  private handleTouchEnd(event: TouchEvent): void {
    this.endPan();
  }

  startPan(event: { clientX: number; clientY: number }): void {
    this.isPanning = true;
    this.lastMousePosition = { x: event.clientX, y: event.clientY };
  }

  updatePan(event: { clientX: number; clientY: number }): void {
    if (!this.isPanning || !this.viewport) return;

    const deltaX = event.clientX - this.lastMousePosition.x;
    const deltaY = event.clientY - this.lastMousePosition.y;

    this.currentTransform.panX += deltaX;
    this.currentTransform.panY += deltaY;

    this.lastMousePosition = { x: event.clientX, y: event.clientY };
    this.applyTransform();
    
    // Emit events within Angular zone
    this.ngZone.run(() => {
      this.emitEvent('pan');
    });
  }

  endPan(): void {
    this.isPanning = false;
  }

  zoom(event: WheelEvent): void {
    if (!this.viewport) return;

    const rect = this.viewport.nativeElement.getBoundingClientRect();
    const centerX = event.clientX - rect.left;
    const centerY = event.clientY - rect.top;

    const factor = event.deltaY > 0 ? 1 / VIEWPORT.ZOOM_FACTOR : VIEWPORT.ZOOM_FACTOR;
    this.adjustZoomAtPoint(factor, centerX, centerY);
  }

  adjustZoomAtPoint(factor: number, pointX: number, pointY: number): void {
    if (!this.viewport) return;

    const newZoom = Math.max(VIEWPORT.MIN_ZOOM, Math.min(VIEWPORT.MAX_ZOOM, this.currentTransform.zoom * factor));

    if (newZoom === this.currentTransform.zoom) return;

    // Calculate the point in the current coordinate system
    const currentPointX = (pointX - this.currentTransform.panX) / this.currentTransform.zoom;
    const currentPointY = (pointY - this.currentTransform.panY) / this.currentTransform.zoom;

    // Calculate new pan to keep the point under the cursor
    this.currentTransform.panX = pointX - (currentPointX * newZoom);
    this.currentTransform.panY = pointY - (currentPointY * newZoom);
    this.currentTransform.zoom = newZoom;

    this.applyTransform();
    
    // Emit events within Angular zone
    this.ngZone.run(() => {
      this.emitEvent('zoom');
    });
  }

  zoomIn(): void {
    if (!this.viewport) return;

    const rect = this.viewport.nativeElement.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    this.adjustZoomAtPoint(VIEWPORT.ZOOM_FACTOR, centerX, centerY);
  }

  zoomOut(): void {
    if (!this.viewport) return;

    const rect = this.viewport.nativeElement.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    this.adjustZoomAtPoint(1 / VIEWPORT.ZOOM_FACTOR, centerX, centerY);
  }

  resetView(): void {
    this.currentTransform = {
      zoom: VIEWPORT.DEFAULT_ZOOM,
      panX: 0,
      panY: 0
    };
    this.applyTransform();
    
    this.ngZone.run(() => {
      this.emitEvent('reset');
    });
  }

  setTransform(zoom: number, panX: number, panY: number): void {
    this.currentTransform = {
      zoom: Math.max(VIEWPORT.MIN_ZOOM, Math.min(VIEWPORT.MAX_ZOOM, zoom)),
      panX,
      panY
    };
    this.applyTransform();
  }

  getTransform(): ViewportState {
    return { ...this.currentTransform };
  }

  focusOnElement(element: HTMLElement, zoomLevel: number = VIEWPORT.FOCUS_ZOOM_LEVEL): void {
    if (!this.viewport || !element) return;

    const elementRect = element.getBoundingClientRect();
    const viewportRect = this.viewport.nativeElement.getBoundingClientRect();

    // Calculate the center of the element relative to the viewport
    const elementCenterX = elementRect.left + elementRect.width / 2 - viewportRect.left;
    const elementCenterY = elementRect.top + elementRect.height / 2 - viewportRect.top;

    // Calculate the viewport center
    const viewportCenterX = viewportRect.width / 2;
    const viewportCenterY = viewportRect.height / 2;

    // Calculate the offset needed to center the element
    const offsetX = viewportCenterX - elementCenterX;
    const offsetY = viewportCenterY - elementCenterY;

    this.setTransform(zoomLevel, offsetX * zoomLevel, offsetY * zoomLevel);
    
    this.ngZone.run(() => {
      this.emitEvent('zoom');
    });
  }

  private applyTransform(): void {
    if (!this.contentElement) return;

    const transform = `translate(${this.currentTransform.panX}px, ${this.currentTransform.panY}px) scale(${this.currentTransform.zoom})`;
    this.contentElement.style.transform = transform;
  }

  private emitEvent(type: 'zoom' | 'pan' | 'reset'): void {
    this.zoomPanEvents.next({
      type,
      viewport: { ...this.currentTransform }
    });
  }

  private cleanupDocumentListeners(): void {
    this.documentListeners.forEach(({ event, handler }) => {
      document.removeEventListener(event, handler);
    });
    this.documentListeners = [];
  }

  private cleanup(): void {
    // Clean up element event listeners
    this.eventListeners.forEach(({ element, event, handler }) => {
      element.removeEventListener(event, handler);
    });
    this.eventListeners = [];

    // Clean up document event listeners
    this.cleanupDocumentListeners();

    this.isInitialized = false;
  }

  destroy(): void {
    this.cleanup();
    this.zoomPanEvents.complete();
  }
}
