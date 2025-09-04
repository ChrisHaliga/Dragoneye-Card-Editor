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

  public isVisible = false;
  public files: string[] = [];
  public filteredFiles: string[] = [];
  public searchTerm = '';
  public isLoading = false;

  constructor(private apiService: CardApiService) {}

  ngOnInit(): void {
    this.loadFiles();
  }

  public show(): void {
    this.isVisible = true;
    this.loadFiles();
  }

  public hide(): void {
    this.isVisible = false;
    this.modalClosed.emit();
  }

  private loadFiles(): void {
    this.isLoading = true;
    this.apiService.getAllFiles().subscribe({
      next: (files) => {
        this.files = files;
        this.filterFiles();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Failed to load files:', error);
        this.isLoading = false;
      }
    });
  }

  public onSearchChange(): void {
    this.filterFiles();
  }

  private filterFiles(): void {
    if (!this.searchTerm.trim()) {
      this.filteredFiles = [...this.files];
    } else {
      const search = this.searchTerm.toLowerCase();
      this.filteredFiles = this.files.filter(file => 
        file.toLowerCase().includes(search)
      );
    }
  }

  public selectFile(filename: string): void {
    this.fileSelected.emit(filename);
    this.hide();
  }

  public deleteFile(filename: string, event: Event): void {
    event.stopPropagation();
    if (confirm(`Are you sure you want to delete "${filename}"?`)) {
      this.apiService.deleteCardData(filename).subscribe({
        next: () => {
          this.loadFiles();
        },
        error: (error) => {
          console.error('Failed to delete file:', error);
        }
      });
    }
  }
}
