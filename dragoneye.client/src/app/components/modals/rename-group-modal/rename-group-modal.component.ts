import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, AfterViewInit, ViewChild, ElementRef } from '@angular/core';

@Component({
  selector: 'app-rename-group-modal',
  templateUrl: './rename-group-modal.component.html',
  styleUrls: ['./rename-group-modal.component.css'],
  standalone: false
})
export class RenameGroupModalComponent implements OnChanges, AfterViewInit {
  @Input() isVisible = false;
  @Input() currentGroupName = '';
  @Input() groupIndex = -1;
  @Output() closed = new EventEmitter<void>();
  @Output() groupRenamed = new EventEmitter<{ groupIndex: number; newName: string }>();

  @ViewChild('groupNameInput', { static: false }) groupNameInput!: ElementRef;

  editingName = '';

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isVisible'] && changes['isVisible'].currentValue) {
      this.editingName = this.currentGroupName;
      // Focus input after modal is visible
      setTimeout(() => {
        if (this.groupNameInput) {
          this.groupNameInput.nativeElement.focus();
          this.groupNameInput.nativeElement.select();
        }
      }, 100);
    }
  }

  ngAfterViewInit(): void {
    // Additional setup if needed
  }

  onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.cancel();
    }
  }

  onModalClick(event: MouseEvent): void {
    event.stopPropagation();
  }

  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      this.confirm();
    } else if (event.key === 'Escape') {
      this.cancel();
    }
  }

  confirm(): void {
    const trimmedName = this.editingName.trim();
    if (trimmedName && trimmedName !== this.currentGroupName) {
      this.groupRenamed.emit({ 
        groupIndex: this.groupIndex, 
        newName: trimmedName 
      });
    }
    this.close();
  }

  cancel(): void {
    this.close();
  }

  private close(): void {
    this.isVisible = false;
    this.editingName = '';
    this.closed.emit();
  }
}
