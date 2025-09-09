import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

import { TouchState } from '../../../core/models/ui-state.model';
import { TOUCH } from '../../../core/constants/layout.const';

export interface TouchGesture {
  type: 'tap' | 'pan' | 'pinch' | 'longPress';
  touches: Touch[];
  deltaX?: number;
  deltaY?: number;
  scale?: number;
  center?: { x: number; y: number };
}

@Injectable({
  providedIn: 'root'
})
export class TouchHandler {
  private touchState: TouchState = {
    lastPinchDistance: null,
    isTouching: false,
    touchCount: 0
  };

  private touchGestures = new Subject<TouchGesture>();
  public touchGestures$ = this.touchGestures.asObservable();

  private longPressTimer: number | null = null;
  private readonly LONG_PRESS_DURATION = 500; // ms
  private initialTouchPosition: { x: number; y: number } | null = null;
  private lastTouchPosition: { x: number; y: number } | null = null;

  handleTouchStart(event: TouchEvent): void {
    this.touchState.isTouching = true;
    this.touchState.touchCount = event.touches.length;

    if (event.touches.length === TOUCH.SINGLE_FINGER) {
      this.handleSingleTouchStart(event.touches[0]);
    } else if (event.touches.length === TOUCH.TWO_FINGERS) {
      this.handlePinchStart(event);
    }

    // Clear any existing long press timer
    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer);
    }

    // Start long press timer for single touch
    if (event.touches.length === TOUCH.SINGLE_FINGER) {
      this.longPressTimer = window.setTimeout(() => {
        this.emitLongPress(event.touches);
      }, this.LONG_PRESS_DURATION);
    }
  }

  handleTouchMove(event: TouchEvent): void {
    if (!this.touchState.isTouching) return;

    // Cancel long press if touch moves significantly
    if (this.longPressTimer && this.hasTouchMovedSignificantly(event.touches[0])) {
      clearTimeout(this.longPressTimer);
      this.longPressTimer = null;
    }

    if (event.touches.length === TOUCH.SINGLE_FINGER) {
      this.handleSingleTouchMove(event.touches[0]);
    } else if (event.touches.length === TOUCH.TWO_FINGERS) {
      this.handlePinchMove(event);
    }
  }

  handleTouchEnd(event: TouchEvent): void {
    // Clear long press timer
    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer);
      this.longPressTimer = null;
    }

    // Handle tap if it was a quick single touch
    if (this.touchState.touchCount === TOUCH.SINGLE_FINGER && 
        event.touches.length === 0 && 
        !this.hasTouchMovedSignificantly(null)) {
      this.emitTap(event.changedTouches);
    }

    // Reset state when all touches end
    if (event.touches.length === 0) {
      this.touchState = {
        lastPinchDistance: null,
        isTouching: false,
        touchCount: 0
      };
      this.initialTouchPosition = null;
      this.lastTouchPosition = null;
    } else {
      this.touchState.touchCount = event.touches.length;
    }
  }

  private handleSingleTouchStart(touch: Touch): void {
    this.initialTouchPosition = { x: touch.clientX, y: touch.clientY };
    this.lastTouchPosition = { x: touch.clientX, y: touch.clientY };
  }

  private handleSingleTouchMove(touch: Touch): void {
    if (!this.lastTouchPosition) return;

    const deltaX = touch.clientX - this.lastTouchPosition.x;
    const deltaY = touch.clientY - this.lastTouchPosition.y;

    this.emitPan([touch], deltaX, deltaY);

    this.lastTouchPosition = { x: touch.clientX, y: touch.clientY };
  }

  private handlePinchStart(event: TouchEvent): void {
    this.touchState.lastPinchDistance = this.calculateDistance(
      event.touches[0], 
      event.touches[1]
    );
  }

  private handlePinchMove(event: TouchEvent): void {
    if (event.touches.length !== TOUCH.TWO_FINGERS) return;

    const currentDistance = this.calculateDistance(
      event.touches[0], 
      event.touches[1]
    );

    if (this.touchState.lastPinchDistance !== null) {
      const scale = currentDistance / this.touchState.lastPinchDistance;
      const center = this.calculateCenter(event.touches[0], event.touches[1]);

      this.emitPinch(Array.from(event.touches), scale, center);
    }

    this.touchState.lastPinchDistance = currentDistance;
  }

  private calculateDistance(touch1: Touch, touch2: Touch): number {
    const deltaX = touch2.clientX - touch1.clientX;
    const deltaY = touch2.clientY - touch1.clientY;
    return Math.sqrt(deltaX * deltaX + deltaY * deltaY);
  }

  private calculateCenter(touch1: Touch, touch2: Touch): { x: number; y: number } {
    return {
      x: (touch1.clientX + touch2.clientX) / 2,
      y: (touch1.clientY + touch2.clientY) / 2
    };
  }

  private hasTouchMovedSignificantly(currentTouch: Touch | null): boolean {
    if (!this.initialTouchPosition || !currentTouch) return false;

    const deltaX = currentTouch.clientX - this.initialTouchPosition.x;
    const deltaY = currentTouch.clientY - this.initialTouchPosition.y;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    return distance > TOUCH.PINCH_THRESHOLD;
  }

  private emitTap(touches: TouchList): void {
    this.touchGestures.next({
      type: 'tap',
      touches: Array.from(touches)
    });
  }

  private emitPan(touches: Touch[], deltaX: number, deltaY: number): void {
    this.touchGestures.next({
      type: 'pan',
      touches,
      deltaX,
      deltaY
    });
  }

  private emitPinch(touches: Touch[], scale: number, center: { x: number; y: number }): void {
    this.touchGestures.next({
      type: 'pinch',
      touches,
      scale,
      center
    });
  }

  private emitLongPress(touches: TouchList): void {
    this.touchGestures.next({
      type: 'longPress',
      touches: Array.from(touches)
    });
  }

  // Utility methods for components to use
  convertTouchToMouseEvent(touch: Touch, type: string): MouseEvent {
    return new MouseEvent(type, {
      clientX: touch.clientX,
      clientY: touch.clientY,
      bubbles: true,
      cancelable: true
    });
  }

  preventScrolling(event: TouchEvent): void {
    if (event.touches.length > 1) {
      event.preventDefault();
    }
  }

  getTouchState(): TouchState {
    return { ...this.touchState };
  }
}
