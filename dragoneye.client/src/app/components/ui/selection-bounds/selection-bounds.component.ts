import { Component, Input, AfterViewInit, OnChanges, SimpleChanges, ChangeDetectorRef, NgZone, OnDestroy } from '@angular/core';
import { CardSelection } from '../../../core/models/ui-state.model';
import { Subject } from 'rxjs';
import { takeUntil, debounceTime } from 'rxjs/operators';

interface SelectionBounds {
  left: number;
  top: number;
  width: number;
  height: number;
}

@Component({
  selector: 'app-selection-bounds',
  templateUrl: './selection-bounds.component.html',
  styleUrls: ['./selection-bounds.component.css'],
  standalone: false
})
export class SelectionBoundsComponent implements AfterViewInit, OnChanges, OnDestroy {
  @Input() selectedCards: CardSelection[] = [];
  @Input() viewport: HTMLElement | null = null;
  @Input() viewportContent: HTMLElement | null = null;

  bounds: SelectionBounds | null = null;
  private destroy$ = new Subject<void>();
  private updateBounds$ = new Subject<void>();

  constructor(private cdr: ChangeDetectorRef, private ngZone: NgZone) {
    // Debounce bounds updates to prevent excessive recalculations
    this.updateBounds$.pipe(
      debounceTime(15),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.updateBounds();
      this.cdr.detectChanges();
    });
  }

  ngAfterViewInit(): void {
    this.triggerBoundsUpdate();
  }

  ngOnChanges(changes: SimpleChanges): void {
    console.log('SelectionBounds: ngOnChanges called', {
      selectedCards: this.selectedCards,
      prevLength: changes['selectedCards']?.previousValue?.length || 0,
      currentLength: this.selectedCards.length
    });
    
    // Always trigger an update when inputs change
    this.triggerBoundsUpdate();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private triggerBoundsUpdate(): void {
    // Clear bounds immediately if no selection
    if (!this.selectedCards.length) {
      console.log('SelectionBounds: Clearing bounds - no selected cards');
      this.bounds = null;
      this.cdr.detectChanges();
      return;
    }

    // Use NgZone to ensure we're working within Angular's zone
    this.ngZone.run(() => {
      // Trigger the debounced update
      this.updateBounds$.next();
    });
  }

  private updateBounds(): void {
    console.log('SelectionBounds: updateBounds called', {
      selectedCardsCount: this.selectedCards.length,
      viewportContent: !!this.viewportContent
    });

    if (!this.selectedCards.length || !this.viewportContent) {
      console.log('SelectionBounds: No cards or viewport content, clearing bounds');
      this.bounds = null;
      return;
    }

    // Find all selected card elements
    const cardElements: HTMLElement[] = [];
    
    this.selectedCards.forEach(selection => {
      const cardElement = this.viewportContent!.querySelector(
        `.card-container[data-group-index="${selection.groupIndex}"][data-card-index="${selection.cardIndex}"]`
      ) as HTMLElement;
      
      if (cardElement) {
        cardElements.push(cardElement);
        console.log(`SelectionBounds: Found card element for ${selection.groupIndex}-${selection.cardIndex}`);
      } else {
        console.warn(`SelectionBounds: Card element not found for ${selection.groupIndex}-${selection.cardIndex}`);
      }
    });

    if (cardElements.length === 0) {
      console.log('SelectionBounds: No card elements found, clearing bounds');
      this.bounds = null;
      return;
    }

    // Only show bounds for multi-card selections
    if (this.selectedCards.length <= 1) {
      console.log('SelectionBounds: Single card selection, clearing bounds');
      this.bounds = null;
      return;
    }

    // Calculate bounding box in viewport-content's local coordinate system
    // Since we're now inside the transformed content, we work in local coordinates
    let minLeft = Infinity;
    let minTop = Infinity;
    let maxRight = -Infinity;
    let maxBottom = -Infinity;

    cardElements.forEach(element => {
      // Get element position relative to viewport-content
      const parentRect = this.viewportContent!.getBoundingClientRect();
      const elementRect = element.getBoundingClientRect();
      
      const relativeLeft = elementRect.left - parentRect.left;
      const relativeTop = elementRect.top - parentRect.top;
      const relativeRight = elementRect.right - parentRect.left;
      const relativeBottom = elementRect.bottom - parentRect.top;

      minLeft = Math.min(minLeft, relativeLeft);
      minTop = Math.min(minTop, relativeTop);
      maxRight = Math.max(maxRight, relativeRight);
      maxBottom = Math.max(maxBottom, relativeBottom);
    });

    // Add padding around the bounds
    const padding = 5;
    
    this.bounds = {
      left: minLeft - padding,
      top: minTop - padding,
      width: (maxRight - minLeft) + (padding * 2),
      height: (maxBottom - minTop) + (padding * 2)
    };

    console.log('SelectionBounds: Updated bounds', this.bounds);
  }
}
