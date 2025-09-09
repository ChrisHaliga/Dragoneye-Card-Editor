import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { ViewportState } from '../../../core/models/ui-state.model';
import { ViewportService } from '../services/viewport.service';

export interface ViewportActionResult {
  success: boolean;
  previousViewport?: ViewportState;
  newViewport?: ViewportState;
  message?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ViewportActions {

  constructor(private viewportService: ViewportService) {}

  zoomIn(): Observable<ViewportActionResult> {
    return new Observable(observer => {
      const previousViewport = this.viewportService.currentViewport;
      
      try {
        this.viewportService.zoomIn();
        const newViewport = this.viewportService.currentViewport;
        
        observer.next({
          success: true,
          previousViewport,
          newViewport,
          message: 'Zoomed in'
        });
      } catch (error: any) {
        observer.next({
          success: false,
          previousViewport,
          message: error.message || 'Failed to zoom in'
        });
      }
      
      observer.complete();
    });
  }

  zoomOut(): Observable<ViewportActionResult> {
    return new Observable(observer => {
      const previousViewport = this.viewportService.currentViewport;
      
      try {
        this.viewportService.zoomOut();
        const newViewport = this.viewportService.currentViewport;
        
        observer.next({
          success: true,
          previousViewport,
          newViewport,
          message: 'Zoomed out'
        });
      } catch (error: any) {
        observer.next({
          success: false,
          previousViewport,
          message: error.message || 'Failed to zoom out'
        });
      }
      
      observer.complete();
    });
  }

  setZoom(zoomLevel: number): Observable<ViewportActionResult> {
    return new Observable(observer => {
      const previousViewport = this.viewportService.currentViewport;
      
      try {
        this.viewportService.setZoom(zoomLevel);
        const newViewport = this.viewportService.currentViewport;
        
        observer.next({
          success: true,
          previousViewport,
          newViewport,
          message: `Set zoom to ${zoomLevel}`
        });
      } catch (error: any) {
        observer.next({
          success: false,
          previousViewport,
          message: error.message || 'Failed to set zoom'
        });
      }
      
      observer.complete();
    });
  }

  resetView(): Observable<ViewportActionResult> {
    return new Observable(observer => {
      const previousViewport = this.viewportService.currentViewport;
      
      try {
        this.viewportService.resetView();
        const newViewport = this.viewportService.currentViewport;
        
        observer.next({
          success: true,
          previousViewport,
          newViewport,
          message: 'Reset view'
        });
      } catch (error: any) {
        observer.next({
          success: false,
          previousViewport,
          message: error.message || 'Failed to reset view'
        });
      }
      
      observer.complete();
    });
  }

  centerView(): Observable<ViewportActionResult> {
    return new Observable(observer => {
      const previousViewport = this.viewportService.currentViewport;
      
      try {
        this.viewportService.centerView();
        const newViewport = this.viewportService.currentViewport;
        
        observer.next({
          success: true,
          previousViewport,
          newViewport,
          message: 'Centered view'
        });
      } catch (error: any) {
        observer.next({
          success: false,
          previousViewport,
          message: error.message || 'Failed to center view'
        });
      }
      
      observer.complete();
    });
  }

  panToPoint(x: number, y: number, centerX: number, centerY: number): Observable<ViewportActionResult> {
    return new Observable(observer => {
      const previousViewport = this.viewportService.currentViewport;
      
      try {
        this.viewportService.panToPoint(x, y, centerX, centerY);
        const newViewport = this.viewportService.currentViewport;
        
        observer.next({
          success: true,
          previousViewport,
          newViewport,
          message: `Panned to point (${x}, ${y})`
        });
      } catch (error: any) {
        observer.next({
          success: false,
          previousViewport,
          message: error.message || 'Failed to pan to point'
        });
      }
      
      observer.complete();
    });
  }

  focusOnElement(
    elementBounds: { x: number; y: number; width: number; height: number },
    containerBounds: { width: number; height: number },
    zoomLevel?: number
  ): Observable<ViewportActionResult> {
    return new Observable(observer => {
      const previousViewport = this.viewportService.currentViewport;
      
      try {
        this.viewportService.focusOnElement(elementBounds, containerBounds, zoomLevel);
        const newViewport = this.viewportService.currentViewport;
        
        observer.next({
          success: true,
          previousViewport,
          newViewport,
          message: 'Focused on element'
        });
      } catch (error: any) {
        observer.next({
          success: false,
          previousViewport,
          message: error.message || 'Failed to focus on element'
        });
      }
      
      observer.complete();
    });
  }

  fitToView(
    contentWidth: number,
    contentHeight: number,
    containerWidth: number,
    containerHeight: number
  ): Observable<ViewportActionResult> {
    return new Observable(observer => {
      const previousViewport = this.viewportService.currentViewport;
      
      try {
        this.viewportService.fitToView(contentWidth, contentHeight, containerWidth, containerHeight);
        const newViewport = this.viewportService.currentViewport;
        
        observer.next({
          success: true,
          previousViewport,
          newViewport,
          message: 'Fitted content to view'
        });
      } catch (error: any) {
        observer.next({
          success: false,
          previousViewport,
          message: error.message || 'Failed to fit to view'
        });
      }
      
      observer.complete();
    });
  }

  animateToTransform(
    targetZoom: number,
    targetPanX: number,
    targetPanY: number,
    duration?: number
  ): Observable<ViewportActionResult> {
    return new Observable(observer => {
      const previousViewport = this.viewportService.currentViewport;
      
      try {
        this.viewportService.animateToTransform(targetZoom, targetPanX, targetPanY, duration).subscribe({
          next: (viewport) => {
            // Animation is in progress
          },
          complete: () => {
            const newViewport = this.viewportService.currentViewport;
            observer.next({
              success: true,
              previousViewport,
              newViewport,
              message: 'Animated to transform'
            });
            observer.complete();
          },
          error: (error) => {
            observer.next({
              success: false,
              previousViewport,
              message: error.message || 'Failed to animate to transform'
            });
            observer.complete();
          }
        });
      } catch (error: any) {
        observer.next({
          success: false,
          previousViewport,
          message: error.message || 'Failed to start animation'
        });
        observer.complete();
      }
    });
  }

  adjustZoom(factor: number): Observable<ViewportActionResult> {
    return new Observable(observer => {
      const previousViewport = this.viewportService.currentViewport;
      
      try {
        this.viewportService.adjustZoom(factor);
        const newViewport = this.viewportService.currentViewport;
        
        observer.next({
          success: true,
          previousViewport,
          newViewport,
          message: `Adjusted zoom by factor ${factor}`
        });
      } catch (error: any) {
        observer.next({
          success: false,
          previousViewport,
          message: error.message || 'Failed to adjust zoom'
        });
      }
      
      observer.complete();
    });
  }

  adjustPan(deltaX: number, deltaY: number): Observable<ViewportActionResult> {
    return new Observable(observer => {
      const previousViewport = this.viewportService.currentViewport;
      
      try {
        this.viewportService.adjustPan(deltaX, deltaY);
        const newViewport = this.viewportService.currentViewport;
        
        observer.next({
          success: true,
          previousViewport,
          newViewport,
          message: `Adjusted pan by (${deltaX}, ${deltaY})`
        });
      } catch (error: any) {
        observer.next({
          success: false,
          previousViewport,
          message: error.message || 'Failed to adjust pan'
        });
      }
      
      observer.complete();
    });
  }

  getViewportInfo(): Observable<{
    zoom: number;
    pan: { x: number; y: number };
    visibleArea?: {
      left: number;
      top: number;
      right: number;
      bottom: number;
      width: number;
      height: number;
    };
  }> {
    return new Observable(observer => {
      const viewport = this.viewportService.currentViewport;
      const pan = this.viewportService.getPanOffset();
      
      observer.next({
        zoom: viewport.zoom,
        pan,
        // visibleArea would require container bounds to calculate
      });
      observer.complete();
    });
  }

  isPointVisible(x: number, y: number, containerBounds: { width: number; height: number }): Observable<boolean> {
    return new Observable(observer => {
      try {
        const isVisible = this.viewportService.isPointVisible(x, y, containerBounds);
        observer.next(isVisible);
      } catch (error) {
        observer.next(false);
      }
      observer.complete();
    });
  }

  isElementVisible(
    elementBounds: { x: number; y: number; width: number; height: number },
    containerBounds: { width: number; height: number }
  ): Observable<boolean> {
    return new Observable(observer => {
      try {
        const isVisible = this.viewportService.isElementVisible(elementBounds, containerBounds);
        observer.next(isVisible);
      } catch (error) {
        observer.next(false);
      }
      observer.complete();
    });
  }

  constrainViewport(
    contentBounds: { width: number; height: number },
    containerBounds: { width: number; height: number }
  ): Observable<ViewportActionResult> {
    return new Observable(observer => {
      const previousViewport = this.viewportService.currentViewport;
      
      try {
        this.viewportService.constrainPan(contentBounds, containerBounds);
        const newViewport = this.viewportService.currentViewport;
        
        observer.next({
          success: true,
          previousViewport,
          newViewport,
          message: 'Constrained viewport'
        });
      } catch (error: any) {
        observer.next({
          success: false,
          previousViewport,
          message: error.message || 'Failed to constrain viewport'
        });
      }
      
      observer.complete();
    });
  }

  screenToWorld(screenX: number, screenY: number): Observable<{ x: number; y: number }> {
    return new Observable(observer => {
      try {
        const worldCoords = this.viewportService.screenToWorld(screenX, screenY);
        observer.next(worldCoords);
      } catch (error) {
        observer.next({ x: 0, y: 0 });
      }
      observer.complete();
    });
  }

  worldToScreen(worldX: number, worldY: number): Observable<{ x: number; y: number }> {
    return new Observable(observer => {
      try {
        const screenCoords = this.viewportService.worldToScreen(worldX, worldY);
        observer.next(screenCoords);
      } catch (error) {
        observer.next({ x: 0, y: 0 });
      }
      observer.complete();
    });
  }
}
