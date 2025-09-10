import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

import { ViewportState } from '../../../core/models/ui-state.model';
import { VIEWPORT } from '../../../core/constants/layout.const';

@Injectable({
  providedIn: 'root'
})
export class ViewportService {
  private viewportStateSubject = new BehaviorSubject<ViewportState>({
    zoom: VIEWPORT.DEFAULT_ZOOM,
    panX: 0,
    panY: 0
  });

  public viewportState$ = this.viewportStateSubject.asObservable();

  get currentViewport(): ViewportState {
    return this.viewportStateSubject.value;
  }

  setZoom(zoom: number): void {
    const clampedZoom = Math.max(VIEWPORT.MIN_ZOOM, Math.min(VIEWPORT.MAX_ZOOM, zoom));
    this.updateViewport({ zoom: clampedZoom });
  }

  setPan(panX: number, panY: number): void {
    this.updateViewport({ panX, panY });
  }

  setTransform(zoom: number, panX: number, panY: number): void {
    const clampedZoom = Math.max(VIEWPORT.MIN_ZOOM, Math.min(VIEWPORT.MAX_ZOOM, zoom));
    this.updateViewport({ zoom: clampedZoom, panX, panY });
  }

  adjustZoom(factor: number): void {
    const current = this.currentViewport;
    const newZoom = current.zoom * factor;
    this.setZoom(newZoom);
  }

  zoomIn(): void {
    this.adjustZoom(VIEWPORT.ZOOM_FACTOR);
  }

  zoomOut(): void {
    this.adjustZoom(1 / VIEWPORT.ZOOM_FACTOR);
  }

  zoomToLevel(level: number): void {
    this.setZoom(level);
  }

  adjustPan(deltaX: number, deltaY: number): void {
    const current = this.currentViewport;
    this.setPan(current.panX + deltaX, current.panY + deltaY);
  }

  resetView(): void {
    this.updateViewport({
      zoom: VIEWPORT.DEFAULT_ZOOM,
      panX: 0,
      panY: 0
    });
  }

  centerView(): void {
    this.updateViewport({
      panX: 0,
      panY: 0
    });
  }

  fitToView(elementWidth: number, elementHeight: number, containerWidth: number, containerHeight: number): void {
    const zoomX = containerWidth / elementWidth;
    const zoomY = containerHeight / elementHeight;
    const zoom = Math.min(zoomX, zoomY, VIEWPORT.MAX_ZOOM);
    
    const clampedZoom = Math.max(VIEWPORT.MIN_ZOOM, zoom);
    
    // Center the content
    const panX = (containerWidth - elementWidth * clampedZoom) / 2;
    const panY = (containerHeight - elementHeight * clampedZoom) / 2;
    
    this.setTransform(clampedZoom, panX, panY);
  }

  zoomToFit(elementBounds: { width: number; height: number }, containerBounds: { width: number; height: number }): void {
    this.fitToView(elementBounds.width, elementBounds.height, containerBounds.width, containerBounds.height);
  }

  panToPoint(targetX: number, targetY: number, containerCenterX: number, containerCenterY: number): void {
    const current = this.currentViewport;
    
    // Calculate where the target point would be in screen coordinates
    const screenX = targetX * current.zoom + current.panX;
    const screenY = targetY * current.zoom + current.panY;
    
    // Calculate offset needed to center the point
    const offsetX = containerCenterX - screenX;
    const offsetY = containerCenterY - screenY;
    
    this.setPan(current.panX + offsetX, current.panY + offsetY);
  }

  focusOnElement(
    elementBounds: { x: number; y: number; width: number; height: number },
    containerBounds: { width: number; height: number },
    zoomLevel?: number
  ): void {
    const targetZoom = zoomLevel || VIEWPORT.FOCUS_ZOOM_LEVEL;
    const clampedZoom = Math.max(VIEWPORT.MIN_ZOOM, Math.min(VIEWPORT.MAX_ZOOM, targetZoom));
    
    // Calculate element center
    const elementCenterX = elementBounds.x + elementBounds.width / 2;
    const elementCenterY = elementBounds.y + elementBounds.height / 2;
    
    // Calculate container center
    const containerCenterX = containerBounds.width / 2;
    const containerCenterY = containerBounds.height / 2;
    
    // Calculate pan needed to center the element
    const panX = containerCenterX - (elementCenterX * clampedZoom);
    const panY = containerCenterY - (elementCenterY * clampedZoom);
    
    this.setTransform(clampedZoom, panX, panY);
  }

  isPointVisible(x: number, y: number, containerBounds: { width: number; height: number }): boolean {
    const current = this.currentViewport;
    
    const screenX = x * current.zoom + current.panX;
    const screenY = y * current.zoom + current.panY;
    
    return screenX >= 0 && 
           screenX <= containerBounds.width && 
           screenY >= 0 && 
           screenY <= containerBounds.height;
  }

  isElementVisible(
    elementBounds: { x: number; y: number; width: number; height: number },
    containerBounds: { width: number; height: number }
  ): boolean {
    const current = this.currentViewport;
    
    const left = elementBounds.x * current.zoom + current.panX;
    const top = elementBounds.y * current.zoom + current.panY;
    const right = left + elementBounds.width * current.zoom;
    const bottom = top + elementBounds.height * current.zoom;
    
    return right >= 0 && 
           left <= containerBounds.width && 
           bottom >= 0 && 
           top <= containerBounds.height;
  }

  screenToWorld(screenX: number, screenY: number): { x: number; y: number } {
    const current = this.currentViewport;
    
    return {
      x: (screenX - current.panX) / current.zoom,
      y: (screenY - current.panY) / current.zoom
    };
  }

  worldToScreen(worldX: number, worldY: number): { x: number; y: number } {
    const current = this.currentViewport;
    
    return {
      x: worldX * current.zoom + current.panX,
      y: worldY * current.zoom + current.panY
    };
  }

  getZoomLevel(): number {
    return this.currentViewport.zoom;
  }

  getPanOffset(): { x: number; y: number } {
    const current = this.currentViewport;
    return { x: current.panX, y: current.panY };
  }

  getVisibleArea(containerBounds: { width: number; height: number }): {
    left: number;
    top: number;
    right: number;
    bottom: number;
    width: number;
    height: number;
  } {
    const current = this.currentViewport;
    
    const topLeft = this.screenToWorld(0, 0);
    const bottomRight = this.screenToWorld(containerBounds.width, containerBounds.height);
    
    return {
      left: topLeft.x,
      top: topLeft.y,
      right: bottomRight.x,
      bottom: bottomRight.y,
      width: bottomRight.x - topLeft.x,
      height: bottomRight.y - topLeft.y
    };
  }

  constrainPan(
    contentBounds: { width: number; height: number },
    containerBounds: { width: number; height: number }
  ): void {
    const current = this.currentViewport;
    
    // Calculate the visible content size
    const visibleWidth = contentBounds.width * current.zoom;
    const visibleHeight = contentBounds.height * current.zoom;
    
    // Calculate constraints
    const maxPanX = Math.max(0, (visibleWidth - containerBounds.width) / 2);
    const minPanX = -maxPanX;
    const maxPanY = Math.max(0, (visibleHeight - containerBounds.height) / 2);
    const minPanY = -maxPanY;
    
    // Constrain pan values
    const constrainedPanX = Math.max(minPanX, Math.min(maxPanX, current.panX));
    const constrainedPanY = Math.max(minPanY, Math.min(maxPanY, current.panY));
    
    if (constrainedPanX !== current.panX || constrainedPanY !== current.panY) {
      this.setPan(constrainedPanX, constrainedPanY);
    }
  }

  animateToTransform(
    targetZoom: number, 
    targetPanX: number, 
    targetPanY: number, 
    duration: number = 300
  ): Observable<ViewportState> {
    return new Observable(observer => {
      const startTime = Date.now();
      const current = this.currentViewport;
      
      const startZoom = current.zoom;
      const startPanX = current.panX;
      const startPanY = current.panY;
      
      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Easing function (ease-out)
        const eased = 1 - Math.pow(1 - progress, 3);
        
        const zoom = startZoom + (targetZoom - startZoom) * eased;
        const panX = startPanX + (targetPanX - startPanX) * eased;
        const panY = startPanY + (targetPanY - startPanY) * eased;
        
        this.setTransform(zoom, panX, panY);
        observer.next(this.currentViewport);
        
        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          observer.complete();
        }
      };
      
      requestAnimationFrame(animate);
    });
  }

  private updateViewport(updates: Partial<ViewportState>): void {
    const currentState = this.currentViewport;
    this.viewportStateSubject.next({ ...currentState, ...updates });
  }
}
