import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { Card, CardDetail } from '../../../core/models/card.model';

// V2-only element data (no dependency on V1 services)
interface ElementOption {
  key: string;
  symbol: string;
  name: string;
  imagePath: string;
}

@Component({
  selector: 'app-card-edit-modal',
  templateUrl: './card-edit-modal.component.html',
  styleUrls: ['./card-edit-modal.component.css'],
  standalone: false
})
export class CardEditModalComponent implements OnChanges, AfterViewInit {
  @Input() card: Card | null = null;
  @Input() isVisible = false;
  @Output() closed = new EventEmitter<void>();
  @Output() cardUpdated = new EventEmitter<Card>();

  @ViewChild('modalBody', { static: false }) modalBody!: ElementRef;

  // Working copy of the card for editing
  editingCard: Card | null = null;
  hasUnsavedChanges = false;
  private originalCardJson = '';

  // Detail selection state
  selectedDetailIndex = -1;

  // Confirmation modal state
  showConfirmationModal = false;
  confirmationMessage = '';
  confirmationTitle = '';
  private pendingAction: 'close' | 'cancel' | null = null;

  // V2-only element definitions (no V1 service dependency)
  readonly availableElements: ElementOption[] = [
    { key: 'pyr', symbol: '🔥', name: 'Pyr (Fire)', imagePath: '/runes/pyr.png' },
    { key: 'hyd', symbol: '💧', name: 'Hyd (Water)', imagePath: '/runes/hyd.png' },
    { key: 'geo', symbol: '🌍', name: 'Geo (Earth)', imagePath: '/runes/geo.png' },
    { key: 'aer', symbol: '💨', name: 'Aer (Air)', imagePath: '/runes/aer.png' },
    { key: 'nyx', symbol: '🌑', name: 'Nyx (Dark)', imagePath: '/runes/nyx.png' },
    { key: 'lux', symbol: '☀️', name: 'Lux (Light)', imagePath: '/runes/lux.png' },
    { key: 'arc', symbol: '✶', name: 'Arc (Arcane)', imagePath: '/runes/arc.png' }
  ];

  // V2-only card type definitions
  readonly availableTypes: string[] = [
    'Action',
    'Creature',
    'Spell',
    'Artifact',
    'Enchantment',
    'Instant'
  ];

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isVisible'] && changes['isVisible'].currentValue) {
      console.log('Card edit modal is now visible with card:', this.card);
      this.createEditingCopy();
    }
    if (changes['card'] && changes['card'].currentValue) {
      console.log('Card edit modal received card:', this.card);
      this.createEditingCopy();
    }
  }

  ngAfterViewInit(): void {
    this.setupChangeDetection();
  }

  private createEditingCopy(): void {
    if (this.card) {
      // Create a deep copy of the card for editing
      this.editingCard = this.deepCloneCard(this.card);
      this.originalCardJson = JSON.stringify(this.card);
      this.hasUnsavedChanges = false;
      this.selectedDetailIndex = -1; // Reset detail selection
      console.log('Created editing copy of card:', this.editingCard);
    }
  }

  private deepCloneCard(card: Card): Card {
    return {
      title: card.title,
      type: card.type,
      elements: card.elements,
      backgroundImage: card.backgroundImage || '',
      details: card.details.map(detail => ({
        name: detail.name,
        details: detail.details,
        apCost: detail.apCost,
        spCost: detail.spCost
      }))
    };
  }

  private setupChangeDetection(): void {
    // Since we're now using direct event handling with markAsChanged(),
    // we only need basic mutation observation for edge cases
    if (this.modalBody) {
      const observer = new MutationObserver(() => {
        // Light change detection for any programmatic changes
        setTimeout(() => this.checkForChanges(), 50);
      });

      observer.observe(this.modalBody.nativeElement, {
        childList: true,
        subtree: true
      });
    }
  }

  private checkForChanges(): void {
    if (this.editingCard) {
      const currentJson = JSON.stringify(this.editingCard);
      const hasChanges = currentJson !== this.originalCardJson;
      
      if (hasChanges !== this.hasUnsavedChanges) {
        this.hasUnsavedChanges = hasChanges;
        console.log('Card changes detected:', hasChanges);
        if (hasChanges) {
          console.log('Current card state:', this.editingCard);
          console.log('Original card state:', JSON.parse(this.originalCardJson));
        }
      }
    }
  }

  // Method to manually trigger change detection (useful for programmatic changes)
  markAsChanged(): void {
    this.hasUnsavedChanges = true;
    console.log('Card manually marked as changed');
  }

  // V2-only detail management methods
  addDetailToEditingCard(): void {
    if (this.editingCard) {
      const newDetail: CardDetail = {
        name: 'New Action',
        details: 'Enter description here',
        apCost: 1,
        spCost: 0
      };
      
      this.editingCard.details = [...this.editingCard.details, newDetail];
      this.selectedDetailIndex = this.editingCard.details.length - 1; // Select the new detail
      this.markAsChanged();
      console.log('Added detail to editing card:', newDetail);
    }
  }

  selectDetail(index: number): void {
    this.selectedDetailIndex = this.selectedDetailIndex === index ? -1 : index;
  }

  removeDetail(index: number): void {
    if (this.editingCard && this.editingCard.details.length > 1) {
      this.editingCard.details = this.editingCard.details.filter((_, i) => i !== index);
      
      // Adjust selected detail index if necessary
      if (this.selectedDetailIndex >= this.editingCard.details.length) {
        this.selectedDetailIndex = -1;
      } else if (this.selectedDetailIndex === index) {
        this.selectedDetailIndex = -1;
      } else if (this.selectedDetailIndex > index) {
        this.selectedDetailIndex--;
      }
      
      this.markAsChanged();
      console.log('Removed detail at index:', index);
    }
  }

  duplicateDetail(index: number): void {
    if (this.editingCard && index < this.editingCard.details.length) {
      const original = this.editingCard.details[index];
      const duplicate: CardDetail = {
        name: original.name + ' Copy',
        details: original.details,
        apCost: original.apCost,
        spCost: original.spCost
      };
      
      this.editingCard.details = [
        ...this.editingCard.details.slice(0, index + 1),
        duplicate,
        ...this.editingCard.details.slice(index + 1)
      ];
      
      this.selectedDetailIndex = index + 1; // Select the duplicated detail
      this.markAsChanged();
      console.log('Duplicated detail:', duplicate);
    }
  }

  // V2-only image handling methods
  onImageChange(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file?.type.startsWith('image/')) {
      console.warn('Invalid file type. Please select an image file.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      if (this.editingCard && e.target?.result) {
        this.editingCard.backgroundImage = e.target.result as string;
        this.markAsChanged();
        console.log('Background image updated');
      }
    };
    reader.readAsDataURL(file);
    (event.target as HTMLInputElement).value = '';
  }

  removeImage(): void {
    if (this.editingCard) {
      this.editingCard.backgroundImage = '';
      this.markAsChanged();
      console.log('Background image removed');
    }
  }

  // V2-only validation methods
  validateCard(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!this.editingCard) {
      return { isValid: false, errors: ['No card to validate'] };
    }

    if (!this.editingCard.title?.trim()) {
      errors.push('Card title is required');
    }

    if (this.editingCard.title && this.editingCard.title.length > 50) {
      errors.push('Card title must be 50 characters or less');
    }

    if (!this.editingCard.type?.trim()) {
      errors.push('Card type is required');
    }

    if (!this.editingCard.elements || this.editingCard.elements.length === 0) {
      errors.push('Card must have at least one element');
    }

    if (!this.editingCard.details || this.editingCard.details.length === 0) {
      errors.push('Card must have at least one detail');
    }

    // Validate details
    this.editingCard.details.forEach((detail, index) => {
      if (!detail.name?.trim()) {
        errors.push(`Detail ${index + 1}: Name is required`);
      }
      if (!detail.details?.trim()) {
        errors.push(`Detail ${index + 1}: Description is required`);
      }
      if (detail.apCost < 0 || detail.apCost > 10) {
        errors.push(`Detail ${index + 1}: AP cost must be between 0 and 10`);
      }
      if (detail.spCost < 0 || detail.spCost > 10) {
        errors.push(`Detail ${index + 1}: SP cost must be between 0 and 10`);
      }
    });

    return { isValid: errors.length === 0, errors };
  }

  // V2-only confirmation and modal methods
  confirm(): void {
    if (this.editingCard && this.hasUnsavedChanges) {
      const validation = this.validateCard();
      if (!validation.isValid) {
        console.warn('Card validation failed:', validation.errors);
        // You could show validation errors to the user here
        // For now, we'll still allow saving invalid cards
      }
      
      console.log('Confirming changes and updating card:', this.editingCard);
      this.cardUpdated.emit(this.editingCard);
      this.hasUnsavedChanges = false;
    }
    this.close();
  }

  cancel(): void {
    if (this.hasUnsavedChanges) {
      this.showUnsavedChangesConfirmation('cancel');
      return;
    }
    console.log('Canceling card edit, discarding changes');
    this.close();
  }

  private showUnsavedChangesConfirmation(action: 'close' | 'cancel'): void {
    this.pendingAction = action;
    this.confirmationTitle = 'Unsaved Changes';
    this.confirmationMessage = 'You have unsaved changes that will be lost. Are you sure you want to discard them?';
    this.showConfirmationModal = true;
  }

  onConfirmationResult(confirmed: boolean): void {
    this.showConfirmationModal = false;
    
    if (confirmed && this.pendingAction) {
      console.log(`Confirmed ${this.pendingAction}, discarding changes`);
      this.close();
    }
    
    this.pendingAction = null;
  }

  close(): void {
    console.log('Card edit modal closing');
    this.editingCard = null;
    this.hasUnsavedChanges = false;
    this.originalCardJson = '';
    this.showConfirmationModal = false;
    this.pendingAction = null;
    this.selectedDetailIndex = -1;
    this.closed.emit();
  }

  // Event handlers for modal interaction
  onModalClick(event: Event): void {
    event.stopPropagation();
  }

  onBackdropClick(event: Event): void {
    event.stopPropagation();
    this.cancel(); // Use cancel instead of close to check for unsaved changes
  }

  onConfirmationModalClick(event: Event): void {
    event.stopPropagation();
  }

  onConfirmationBackdropClick(event: Event): void {
    event.stopPropagation();
    // Don't close confirmation modal on backdrop click - force user to choose
  }

  // Utility methods for template
  getElementDisplayName(elementKey: string): string {
    const element = this.availableElements.find(e => e.key === elementKey);
    return element ? `${element.symbol} ${element.name}` : elementKey;
  }

  getElementImagePath(elementKey: string): string {
    const element = this.availableElements.find(e => e.key === elementKey);
    return element ? element.imagePath : '/runes/arc.png'; // Default fallback
  }

  onElementImageError(event: Event): void {
    // Replace broken image with fallback emoji or text
    const img = event.target as HTMLImageElement;
    if (img) {
      // Try to get element key from the img's data attribute or similar
      const elementKey = img.getAttribute('data-element-key');
      const element = this.availableElements.find(e => e.key === elementKey);
      if (element) {
        // Create a fallback by replacing the img with a span containing the emoji
        const span = document.createElement('span');
        span.textContent = element.symbol;
        span.className = 'me-2';
        span.style.fontSize = '24px';
        span.style.width = '30px';
        span.style.height = '30px';
        span.style.display = 'inline-flex';
        span.style.alignItems = 'center';
        span.style.justifyContent = 'center';
        img.parentNode?.replaceChild(span, img);
      }
    }
  }

  // Element selection methods for multi-element support
  isElementSelected(elementKey: string): boolean {
    return this.editingCard?.elements?.includes(elementKey) || false;
  }

  toggleElement(elementKey: string): void {
    if (!this.editingCard) return;
    
    if (!this.editingCard.elements) {
      this.editingCard.elements = [];
    }

    const index = this.editingCard.elements.indexOf(elementKey);
    if (index > -1) {
      // Remove element
      this.editingCard.elements.splice(index, 1);
    } else {
      // Add element
      this.editingCard.elements.push(elementKey);
    }
    
    this.markAsChanged();
  }

  isValidElement(elementKey: string): boolean {
    return this.availableElements.some(e => e.key === elementKey);
  }

  isValidType(type: string): boolean {
    return this.availableTypes.includes(type);
  }
}
