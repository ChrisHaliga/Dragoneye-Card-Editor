import { Component, Output, EventEmitter, OnInit } from '@angular/core';
import { CardApiService } from '../../services/card-api.service';

@Component({
  selector: 'app-file-manager-modal',
  templateUrl: './file-manager-modal.component.html',
  styleUrls: ['./file-manager-modal.component.css'],
  standalone: false
})
export class FileManagerModalComponent implements OnInit {
  @Output() fileSelected = new EventEmitter<string>();
  @Output() modalClosed = new EventEmitter<void>();

  isVisible = false;
  files: string[] = [];
  filteredFiles: string[] = [];
  searchTerm = '';
  isLoading = false;

  constructor(private apiService: CardApiService) {}

  ngOnInit(): void {
    this.loadFiles();
  }

  show(): void {
    this.isVisible = true;
    this.loadFiles();
  }

  hide(): void {
    this.isVisible = false;
    this.modalClosed.emit();
  }

  onSearchChange(): void {
    if (!this.searchTerm.trim()) {
      this.filteredFiles = [...this.files];
    } else {
      const search = this.searchTerm.toLowerCase();
      this.filteredFiles = this.files.filter(file => 
        file.toLowerCase().includes(search)
      );
    }
  }

  selectFile(filename: string): void {
    this.fileSelected.emit(filename);
    this.hide();
  }

  deleteFile(filename: string, event: Event): void {
    event.stopPropagation();
    if (confirm(`Are you sure you want to delete "${filename}"?`)) {
      this.apiService.deleteCardData(filename).subscribe({
        next: () => this.loadFiles(),
        error: (error) => console.error('Failed to delete file:', error)
      });
    }
  }

  private loadFiles(): void {
    this.isLoading = true;
    this.apiService.getAllFiles().subscribe({
      next: (files) => {
        this.files = files;
        this.onSearchChange();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Failed to load files:', error);
        this.isLoading = false;
      }
    });
  }
}
