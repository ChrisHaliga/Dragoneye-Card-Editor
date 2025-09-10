import { Component, OnInit, OnDestroy, Output, EventEmitter } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { ModalService } from '../../../features/ui-state/services/modal.service';
import { LoadActions } from '../../../features/file-management/actions/load.actions';

@Component({
  selector: 'app-file-manager-modal',
  templateUrl: './file-manager-modal.component.html',
  styleUrls: ['./file-manager-modal.component.css'],
  standalone: false
})
export class FileManagerModalComponent implements OnInit, OnDestroy {
  @Output() fileSelected = new EventEmitter<string>();

  private destroy$ = new Subject<void>();
  
  isVisible = false;
  availableFiles: string[] = [];
  selectedFile: string | null = null;
  isLoading = false;
  error: string | null = null;

  constructor(
    private modalService: ModalService,
    private loadActions: LoadActions
  ) {}

  ngOnInit(): void {
    // Subscribe to modal state
    this.modalService.modalState$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(state => {
      this.isVisible = state.fileManagerOpen;
      if (this.isVisible) {
        this.loadAvailableFiles();
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadAvailableFiles(): void {
    this.isLoading = true;
    this.error = null;
    
    this.loadActions.getAvailableFiles().subscribe({
      next: (files) => {
        this.availableFiles = files;
        this.isLoading = false;
        this.selectedFile = files.length > 0 ? files[0] : null;
      },
      error: (error) => {
        this.error = 'Failed to load available files';
        this.isLoading = false;
        console.error('Failed to load files:', error);
      }
    });
  }

  selectFile(filename: string): void {
    this.selectedFile = filename;
  }

  loadSelectedFile(): void {
    if (this.selectedFile) {
      this.fileSelected.emit(this.selectedFile);
      this.close();
    }
  }

  close(): void {
    this.modalService.closeFileManager();
  }

  onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.close();
    }
  }
}
