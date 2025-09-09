import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

import { FileApiRepository } from '../../../core/repositories/http/file-api.repository';

export interface FileState {
  filename: string;
  currentFilename: string; // Add missing property
  hasUnsavedChanges: boolean;
  lastSaved?: Date;
  isLoading: boolean;
  error?: string;
  availableFiles: string[];
}

@Injectable({
  providedIn: 'root'
})
export class FileStateService {
  private fileStateSubject = new BehaviorSubject<FileState>({
    filename: 'my-card-set.json',
    currentFilename: 'my-card-set.json', // Initialize the new property
    hasUnsavedChanges: false,
    isLoading: false,
    availableFiles: []
  });

  public fileState$ = this.fileStateSubject.asObservable();

  constructor(private fileApiRepository: FileApiRepository) {
    this.loadAvailableFiles();
  }

  get currentState(): FileState {
    return this.fileStateSubject.value;
  }

  setCurrentFilename(filename: string): void {
    this.updateState({ 
      filename,
      currentFilename: filename // Update the new property
    });
  }

  setUnsavedChanges(hasChanges: boolean): void {
    this.updateState({ hasUnsavedChanges: hasChanges });
  }

  setLoading(isLoading: boolean): void {
    this.updateState({ isLoading });
  }

  markAsSaved(): void {
    this.updateState({ 
      hasUnsavedChanges: false, 
      lastSaved: new Date() 
    });
  }

  loadAvailableFiles(): Observable<string[]> {
    this.setLoading(true);
    
    return this.fileApiRepository.listFiles().pipe(
      map(files => {
        this.updateState({ 
          availableFiles: files,
          isLoading: false 
        });
        return files;
      }),
      catchError(error => {
        console.error('Failed to load available files:', error);
        this.updateState({
          isLoading: false,
          error: 'Failed to load available files'
        });
        return [];
      })
    );
  }

  addFile(filename: string): void {
    const currentFiles = this.currentState.availableFiles;
    if (!currentFiles.includes(filename)) {
      this.updateState({ 
        availableFiles: [...currentFiles, filename] 
      });
    }
  }

  removeFile(filename: string): void {
    const currentFiles = this.currentState.availableFiles;
    this.updateState({ 
      availableFiles: currentFiles.filter((f: string) => f !== filename) 
    });
  }

  getAvailableFiles(): string[] {
    return this.currentState.availableFiles;
  }

  canNavigateAway(): boolean {
    return !this.currentState.hasUnsavedChanges;
  }

  private updateState(updates: Partial<FileState>): void {
    const currentState = this.currentState;
    this.fileStateSubject.next({ ...currentState, ...updates });
  }
}
