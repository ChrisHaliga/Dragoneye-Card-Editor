import { Component, OnInit, OnDestroy, Output, EventEmitter } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { ModalService } from '../../../features/ui-state/services/modal.service';
import { SaveActions } from '../../../features/file-management/actions/save.actions';

@Component({
  selector: 'app-save-as-modal',
  templateUrl: './save-as-modal.component.html',
  styleUrls: ['./save-as-modal.component.css'],
  standalone: false
})
export class SaveAsModalComponent implements OnInit, OnDestroy {
  @Output() fileNameEntered = new EventEmitter<string>();

  private destroy$ = new Subject<void>();
  
  isVisible = false;
  filename = '';
  isValidating = false;
  validationError: string | null = null;

  constructor(
    private modalService: ModalService,
    private saveActions: SaveActions
  ) {}

  ngOnInit(): void {
    // Subscribe to modal state
    this.modalService.modalState$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(state => {
      this.isVisible = state.saveAsOpen;
      if (this.isVisible) {
        this.resetForm();
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private resetForm(): void {
    this.filename = '';
    this.validationError = null;
    this.isValidating = false;
    
    // Focus on input after a short delay
    setTimeout(() => {
      const input = document.querySelector('.filename-input') as HTMLInputElement;
      if (input) {
        input.focus();
        input.select();
      }
    }, 100);
  }

  onFilenameChange(): void {
    this.validationError = null;
    
    if (this.filename.trim()) {
      // Create a test filename with .json extension for validation
      let testFilename = this.filename.trim();
      if (!testFilename.toLowerCase().endsWith('.json')) {
        testFilename += '.json';
      }
      
      const validation = this.saveActions.validateFilename(testFilename);
      if (!validation.isValid) {
        // Customize the error message to be more user-friendly
        if (validation.error?.includes('must end with .json')) {
          // Don't show this error since we auto-append .json
          return;
        }
        this.validationError = validation.error || 'Invalid filename';
      }
    }
  }

  saveFile(): void {
    if (!this.filename.trim()) {
      this.validationError = 'Filename is required';
      return;
    }

    // Auto-append .json extension if not present
    let finalFilename = this.filename.trim();
    if (!finalFilename.toLowerCase().endsWith('.json')) {
      finalFilename += '.json';
    }

    const validation = this.saveActions.validateFilename(finalFilename);
    if (!validation.isValid) {
      this.validationError = validation.error || 'Invalid filename';
      return;
    }

    this.isValidating = true;
    
    // Check if file exists using the final filename with .json extension
    this.saveActions.checkFileExists(finalFilename).subscribe({
      next: (exists: boolean) => {
        this.isValidating = false;
        
        if (exists) {
          const confirmed = confirm(`File '${finalFilename}' already exists. Do you want to overwrite it?`);
          if (confirmed) {
            this.fileNameEntered.emit(finalFilename);
            this.close();
          }
        } else {
          this.fileNameEntered.emit(finalFilename);
          this.close();
        }
      },
      error: (error: any) => {
        this.isValidating = false;
        console.error('Error checking file existence:', error);
        // Proceed anyway if check fails
        this.fileNameEntered.emit(finalFilename);
        this.close();
      }
    });
  }

  close(): void {
    this.modalService.closeSaveAs();
  }

  onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.close();
    }
  }

  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !this.validationError && this.filename.trim()) {
      event.preventDefault();
      this.saveFile();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      this.close();
    }
  }
}
