import { Component, Output, EventEmitter, Input } from '@angular/core';

@Component({
  selector: 'app-overwrite-confirmation-modal',
  templateUrl: './overwrite-confirmation-modal.component.html',
  styleUrls: ['./overwrite-confirmation-modal.component.css'],
  standalone: false
})
export class OverwriteConfirmationModalComponent {
  @Input() filename = '';
  @Output() confirmed = new EventEmitter<boolean>();
  @Output() modalClosed = new EventEmitter<void>();

  isVisible = false;

  show(filename: string): void {
    this.filename = filename;
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
