import { Component, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-save-as-modal',
  templateUrl: './save-as-modal.component.html',
  styleUrls: ['./save-as-modal.component.css'],
  standalone: false
})
export class SaveAsModalComponent {
  @Output() fileNameEntered = new EventEmitter<string>();
  @Output() modalClosed = new EventEmitter<void>();

  isVisible = false;
  filename = '';

  show(currentFilename?: string): void {
    this.filename = currentFilename || '';
    this.isVisible = true;
  }

  hide(): void {
    this.isVisible = false;
    this.modalClosed.emit();
  }

  save(): void {
    if (this.filename.trim()) {
      let finalFilename = this.filename.trim();
      if (!finalFilename.endsWith('.json')) {
        finalFilename += '.json';
      }
      this.fileNameEntered.emit(finalFilename);
      this.hide();
    }
  }

  cancel(): void {
    this.filename = '';
    this.hide();
  }
}
