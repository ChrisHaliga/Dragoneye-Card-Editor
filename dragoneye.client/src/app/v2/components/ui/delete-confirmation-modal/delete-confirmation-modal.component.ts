import { Component, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { ModalService } from '../../../features/ui-state/services/modal.service';

@Component({
  selector: 'app-delete-confirmation-modal-v2',
  templateUrl: './delete-confirmation-modal.component.html',
  styleUrls: ['./delete-confirmation-modal.component.css'],
  standalone: false
})
export class DeleteConfirmationModalV2Component implements OnInit, OnDestroy {
  @Output() confirmed = new EventEmitter<boolean>();
  @Output() modalClosed = new EventEmitter<void>();

  private destroy$ = new Subject<void>();

  isVisible = false;
  itemName = '';
  itemType = '';

  constructor(private modalService: ModalService) {}

  ngOnInit(): void {
    // Subscribe to modal state from the modal service
    this.modalService.modalState$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(state => {
      const wasVisible = this.isVisible;
      this.isVisible = state.deleteConfirmationOpen;
      
      // If modal is becoming visible, get the data
      if (this.isVisible && !wasVisible) {
        const modalData = this.modalService.getModalData('deleteConfirmation');
        if (modalData) {
          this.itemName = modalData.itemName || '';
          this.itemType = modalData.itemType || 'item';
        }
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  show(itemName: string, itemType: string = 'item'): void {
    this.itemName = itemName;
    this.itemType = itemType;
    this.isVisible = true;
  }

  hide(): void {
    this.modalService.closeDeleteConfirmation();
    this.modalClosed.emit();
  }

  confirm(): void {
    this.confirmed.emit(true);
    this.hide();
  }

  cancel(): void {
    this.confirmed.emit(false);
    this.hide();
  }
}
