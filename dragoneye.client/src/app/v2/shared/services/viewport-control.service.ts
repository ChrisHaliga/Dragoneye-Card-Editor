import { Injectable, ElementRef, NgZone, OnDestroy } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface ViewportTransform {
  scale: number;
  translateX: number;
  translateY: number;
}

export interface SelectionBox {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  active: boolean;
}

export interface MultiSelectEvent {
  type: 'start' | 'update' | 'end' | 'clear';
  box?: SelectionBox;
  selectedCards?: Array<{ groupIndex: number; cardIndex: number }> ;
}

@Injectable({
  providedIn: 'root'
})
export class ViewportControlService implements OnDestroy {
  private container: HTMLElement | null = null;
  private content: HTMLElement | null = null;
  
  private transform: ViewportTransform = {
    scale: 1,
    translateX: 0,
    translateY: 0
  };
  
  private isDragging = false;
  private isSelecting = false;
  private lastPointer = { x: 0, y: 0 };
  private selectionBox: SelectionBox = {
    startX: 0,
    startY: 0,
    endX: 0,
    endY: 0,
    active: false
  };
  
  // Settings
  private readonly MIN_SCALE = 0.1;
  private readonly MAX_SCALE = 5;
  private readonly ZOOM_STEP = 0.1;
  private readonly SELECTION_THRESHOLD = 5; // Minimum pixels to start selection
  
  // State observables
  private transformSubject = new BehaviorSubject<ViewportTransform>(this.transform);
  public transform$ = this.transformSubject.asObservable();
  
  private multiSelectSubject = new BehaviorSubject<MultiSelectEvent>({ type: 'end' });
  public multiSelect$ = this.multiSelectSubject.asObservable();
  
  // Store event listeners for cleanup
  private documentListeners: Array<{ event: string; handler: EventListener }> = [];

  // Bound event handlers for cleanup
  private boundHandlers = {
    pointerDown: this.onPointerDown.bind(this),
    pointerMove: this.onPointerMove.bind(this),
    pointerUp: this.onPointerUp.bind(this),
    wheel: this.onWheel.bind(this),
    contextMenu: this.onContextMenu.bind(this)
  };

  constructor(private ngZone: NgZone) {}

  ngOnDestroy(): void {
    this.cleanup();
  }

  initialize(container: HTMLElement, content: HTMLElement): void {
    this.cleanup();
    
    this.container = container;
    this.content = content;
    
    // Add event listeners outside Angular zone
    this.ngZone.runOutsideAngular(() => {
      // Use pointer events for unified mouse/touch handling
      container.addEventListener('pointerdown', this.boundHandlers.pointerDown);
      container.addEventListener('wheel', this.boundHandlers.wheel, { passive: false });
      container.addEventListener('contextmenu', this.boundHandlers.contextMenu);
      
      // Global listeners for pointer events
      document.addEventListener('pointermove', this.boundHandlers.pointerMove);
      document.addEventListener('pointerup', this.boundHandlers.pointerUp);
    });
    
    this.applyTransform();
  }

  private onPointerDown(event: PointerEvent): void {
    // Handle middle mouse button for panning
    if (event.button === 1 && event.pointerType === 'mouse') {
      // Middle mouse button - start panning
      event.preventDefault();
      event.stopPropagation();

      this.isDragging = true;
      this.lastPointer = { x: event.clientX, y: event.clientY };
      
      // Set pointer capture for smooth dragging
      if (this.container) {
        this.container.setPointerCapture(event.pointerId);
      }

      // Add document listeners for mouse move and up
      this.ngZone.runOutsideAngular(() => {
        const mouseMoveHandler = (e: PointerEvent) => this.onPointerMove(e);
        const mouseUpHandler = (e: PointerEvent) => this.onPointerUp(e);

        document.addEventListener('pointermove', mouseMoveHandler, { passive: false });
        document.addEventListener('pointerup', mouseUpHandler, { passive: false });

        this.documentListeners.push(
          { event: 'pointermove', handler: mouseMoveHandler as EventListener },
          { event: 'pointerup', handler: mouseUpHandler as EventListener }
        );
      });
      
      return;
    }

    // For left clicks, handle selection box and background deselection
    if (event.button === 0) {
      const target = event.target as HTMLElement;
      
      // Check if clicking on a card - allow single clicks to go through
      const cardElement = target.closest('.card-container');
      if (cardElement) {
        // Single card click - let it bubble up for selection
        return;
      }
      
      // Check if clicking on interactive UI elements - allow them to work
      const interactiveElement = target.closest('.add-card-btn, .card-edit-btn, .card-delete-btn, .group-label, .add-group-btn');
      if (interactiveElement) {
        // Interactive element click - let it bubble up
        return;
      }

      // Clicking on background - prepare for potential selection box or clear selection
      event.preventDefault();
      event.stopPropagation();

      this.isSelecting = true;
      this.lastPointer = { x: event.clientX, y: event.clientY };
      
      // Initialize selection box
      this.selectionBox = {
        startX: event.clientX,
        startY: event.clientY,
        endX: event.clientX,
        endY: event.clientY,
        active: false
      };
      
      if (this.container) {
        this.container.setPointerCapture(event.pointerId);
      }

      this.ngZone.runOutsideAngular(() => {
        const mouseMoveHandler = (e: PointerEvent) => this.onPointerMove(e);
        const mouseUpHandler = (e: PointerEvent) => this.onPointerUp(e);

        document.addEventListener('pointermove', mouseMoveHandler, { passive: false });
        document.addEventListener('pointerup', mouseUpHandler, { passive: false });

        this.documentListeners.push(
          { event: 'pointermove', handler: mouseMoveHandler as EventListener },
          { event: 'pointerup', handler: mouseUpHandler as EventListener }
        );
      });
    }
  }

  private onPointerMove(event: PointerEvent): void {
    // Handle panning
    if (this.isDragging) {
      event.preventDefault();
      
      const deltaX = event.clientX - this.lastPointer.x;
      const deltaY = event.clientY - this.lastPointer.y;
      
      this.transform.translateX += deltaX;
      this.transform.translateY += deltaY;
      
      this.lastPointer = { x: event.clientX, y: event.clientY };
      
      this.applyTransform();
      this.emitTransform();
      return;
    }
    
    // Handle selection box
    if (this.isSelecting) {
      event.preventDefault();
      
      const deltaX = Math.abs(event.clientX - this.selectionBox.startX);
      const deltaY = Math.abs(event.clientY - this.selectionBox.startY);
      
      // Check if we've moved enough to start selection
      if (!this.selectionBox.active && (deltaX > this.SELECTION_THRESHOLD || deltaY > this.SELECTION_THRESHOLD)) {
        this.selectionBox.active = true;
        this.emitMultiSelectEvent('start');
      }
      
      if (this.selectionBox.active) {
        this.selectionBox.endX = event.clientX;
        this.selectionBox.endY = event.clientY;
        this.emitMultiSelectEvent('update');
      }
    }
  }

  private onPointerUp(event: PointerEvent): void {
    // Handle panning end
    if (this.isDragging) {
      this.isDragging = false;
      
      // Release pointer capture
      if (this.container) {
        this.container.releasePointerCapture(event.pointerId);
      }
      
      // Clean up document listeners
      this.cleanupDocumentListeners();
      return;
    }
    
    // Handle selection box end
    if (this.isSelecting) {
      if (this.selectionBox.active) {
        // Find cards within selection box
        const selectedCards = this.getCardsInSelectionBox();
        console.log('ViewportControl: Selection box ended, selected cards:', selectedCards);
        this.emitMultiSelectEvent('end', selectedCards);
      } else {
        // No dragging occurred - this was just a click on background
        // Clear the current selection
        console.log('ViewportControl: Background clicked without drag - clearing selection');
        this.emitMultiSelectEvent('clear');
      }
      
      this.isSelecting = false;
      this.selectionBox.active = false;
      
      if (this.container) {
        this.container.releasePointerCapture(event.pointerId);
      }
      
      this.cleanupDocumentListeners();
    }
  }

  private onWheel(event: WheelEvent): void {
    // Check if we should handle this wheel event
    event.preventDefault();
    event.stopPropagation();
    
    // Determine the action based on modifier keys
    if (event.ctrlKey || event.metaKey) {
      // Ctrl+Wheel = Zoom (anywhere)
      this.handleZoom(event);
    } else if (event.shiftKey) {
      // Shift+Wheel = Pan horizontally (anywhere)
      this.handleHorizontalPan(event);
    } else {
      // Normal Wheel = Pan vertically (anywhere - cards, groups, background)
      this.handleVerticalPan(event);
    }
  }

  private handleZoom(event: WheelEvent): void {
    if (!this.container) return;

    const rect = this.container.getBoundingClientRect();
    const centerX = event.clientX - rect.left;
    const centerY = event.clientY - rect.top;
    
    // Determine zoom direction
    const zoomIn = event.deltaY < 0;
    const scaleFactor = zoomIn ? 1 + this.ZOOM_STEP : 1 - this.ZOOM_STEP;
    
    this.zoomAtPoint(centerX, centerY, scaleFactor);
  }

  private handleVerticalPan(event: WheelEvent): void {
    // Pan up/down based on wheel direction
    const panAmount = event.deltaY * 0.5; // Adjust sensitivity
    
    this.transform.translateY -= panAmount;
    
    this.applyTransform();
    this.emitTransform();
  }

  private handleHorizontalPan(event: WheelEvent): void {
    // Pan left/right based on wheel direction
    const panAmount = event.deltaY * 0.5; // Adjust sensitivity
    
    this.transform.translateX -= panAmount;
    
    this.applyTransform();
    this.emitTransform();
  }

  private onContextMenu(event: Event): void {
    // Prevent context menu when dragging
    if (this.isDragging) {
      event.preventDefault();
    }
  }

  private zoomAtPoint(pointX: number, pointY: number, scaleFactor: number): void {
    const newScale = Math.max(this.MIN_SCALE, Math.min(this.MAX_SCALE, this.transform.scale * scaleFactor));
    
    if (newScale === this.transform.scale) return;
    
    // Calculate point in current coordinate system
    const pointInContentX = (pointX - this.transform.translateX) / this.transform.scale;
    const pointInContentY = (pointY - this.transform.translateY) / this.transform.scale;
    
    // Update transform
    this.transform.scale = newScale;
    this.transform.translateX = pointX - (pointInContentX * newScale);
    this.transform.translateY = pointY - (pointInContentY * newScale);
    
    this.applyTransform();
    this.emitTransform();
  }

  // Public API methods
  zoomIn(): void {
    if (!this.container) return;
    
    const rect = this.container.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    this.zoomAtPoint(centerX, centerY, 1 + this.ZOOM_STEP);
  }

  zoomOut(): void {
    if (!this.container) return;
    
    const rect = this.container.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    this.zoomAtPoint(centerX, centerY, 1 - this.ZOOM_STEP);
  }

  resetView(): void {
    this.transform = {
      scale: 1,
      translateX: 0,
      translateY: 0
    };
    
    this.applyTransform();
    this.emitTransform();
  }

  setTransform(scale: number, translateX: number, translateY: number): void {
    this.transform = {
      scale: Math.max(this.MIN_SCALE, Math.min(this.MAX_SCALE, scale)),
      translateX,
      translateY
    };
    
    this.applyTransform();
    this.emitTransform();
  }

  getTransform(): ViewportTransform {
    return { ...this.transform };
  }

  private applyTransform(): void {
    if (!this.content) return;
    
    const { scale, translateX, translateY } = this.transform;
    const transformString = `translate(${translateX}px, ${translateY}px) scale(${scale})`;
    
    // Use RAF for smooth updates
    requestAnimationFrame(() => {
      if (this.content) {
        this.content.style.transform = transformString;
      }
    });
  }

  private emitTransform(): void {
    // Emit changes back to Angular zone
    this.ngZone.run(() => {
      this.transformSubject.next({ ...this.transform });
    });
  }

  private cleanupDocumentListeners(): void {
    this.documentListeners.forEach(({ event, handler }) => {
      document.removeEventListener(event, handler);
    });
    this.documentListeners = [];
  }

  private cleanup(): void {
    // Clean up document listeners first
    this.cleanupDocumentListeners();
    
    if (this.container) {
      this.container.removeEventListener('pointerdown', this.boundHandlers.pointerDown);
      this.container.removeEventListener('wheel', this.boundHandlers.wheel);
      this.container.removeEventListener('contextmenu', this.boundHandlers.contextMenu);
    }
    
    document.removeEventListener('pointermove', this.boundHandlers.pointerMove);
    document.removeEventListener('pointerup', this.boundHandlers.pointerUp);
    
    this.container = null;
    this.content = null;
    this.isDragging = false;
  }
  
  private emitMultiSelectEvent(type: 'start' | 'update' | 'end' | 'clear', selectedCards?: Array<{ groupIndex: number; cardIndex: number }>): void {
    const event: MultiSelectEvent = {
      type,
      box: this.selectionBox.active ? { ...this.selectionBox } : undefined,
      selectedCards
    };
    
    this.ngZone.run(() => {
      this.multiSelectSubject.next(event);
    });
  }

  private getCardsInSelectionBox(): Array<{ groupIndex: number; cardIndex: number }> {
    if (!this.container || !this.selectionBox.active) return [];
    
    const selectedCards: Array<{ groupIndex: number; cardIndex: number }> = [];
    const containerRect = this.container.getBoundingClientRect();
    
    // Convert selection box to container-relative coordinates
    const boxLeft = Math.min(this.selectionBox.startX, this.selectionBox.endX) - containerRect.left;
    const boxTop = Math.min(this.selectionBox.startY, this.selectionBox.endY) - containerRect.top;
    const boxRight = Math.max(this.selectionBox.startX, this.selectionBox.endX) - containerRect.left;
    const boxBottom = Math.max(this.selectionBox.startY, this.selectionBox.endY) - containerRect.top;
    
    // Find all card elements
    const cardElements = this.container.querySelectorAll('.card-container[data-interactive]');
    
    cardElements.forEach((cardElement: Element) => {
      const cardRect = cardElement.getBoundingClientRect();
      
      // Convert card position to container-relative coordinates
      const cardLeft = cardRect.left - containerRect.left;
      const cardTop = cardRect.top - containerRect.top;
      const cardRight = cardRect.right - containerRect.left;
      const cardBottom = cardRect.bottom - containerRect.top;
      
      // Check if card is fully within selection box
      if (cardLeft >= boxLeft && 
          cardTop >= boxTop && 
          cardRight <= boxRight && 
          cardBottom <= boxBottom) {
        
        // Extract group and card indices from data attributes
        const groupIndex = parseInt((cardElement as HTMLElement).dataset['groupIndex'] || '0');
        const cardIndex = parseInt((cardElement as HTMLElement).dataset['cardIndex'] || '0');
        
        selectedCards.push({ groupIndex, cardIndex });
      }
    });
    
    return selectedCards;
  }
}
