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

  public isVisible = false;

  public show(filename: string): void {
    this.filename = filename;
    this.isVisible = true;
  }

  public hide(): void {
    this.isVisible = false;
    this.modalClosed.emit();
  }

  public confirm(): void {
    this.confirmed.emit(true);
    this.hide();
  }

  public cancel(): void {
    this.confirmed.emit(false);
    this.hide();
  }
}
