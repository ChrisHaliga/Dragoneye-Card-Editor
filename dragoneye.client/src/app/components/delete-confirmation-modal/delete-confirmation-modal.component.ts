import { Component, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-delete-confirmation-modal',
  templateUrl: './delete-confirmation-modal.component.html',
  styleUrls: ['./delete-confirmation-modal.component.css'],
  standalone: false
})
export class DeleteConfirmationModalComponent {
  @Output() confirmed = new EventEmitter<boolean>();
  @Output() modalClosed = new EventEmitter<void>();

  isVisible = false;
  itemName = '';
  itemType = '';

  show(itemName: string, itemType: string = 'item'): void {
    this.itemName = itemName;
    this.itemType = itemType;
    this.isVisible = true;
  }

  hide(): void {
    this.isVisible = false;
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
