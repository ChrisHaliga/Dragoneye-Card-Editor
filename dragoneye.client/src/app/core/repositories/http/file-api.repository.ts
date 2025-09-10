import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

import { IFileApiRepository } from '../interfaces/file-api.interface';
import { CardData } from '../../models/card.model';
import { 
  FileInfo, 
  ExportRequest, 
  ExportOptions,
  SaveRequest,
  SaveResponse,
  LoadRequest
} from '../../models/api.model';

@Injectable({
  providedIn: 'root'
})
export class FileApiRepository implements IFileApiRepository {
  private readonly baseUrl = '/api/cards';

  constructor(private http: HttpClient) {}

  // File CRUD operations
  loadFile(request: LoadRequest): Observable<CardData> {
    const encodedFilename = encodeURIComponent(request.filename);
    return this.http.get<CardData>(`${this.baseUrl}/${encodedFilename}`).pipe(
      catchError(error => throwError(() => new Error(`Failed to load file: ${error.message || 'Unknown error'}`)))
    );
  }

  saveFile(request: SaveRequest): Observable<SaveResponse> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });
    
    return this.http.post<CardData>(`${this.baseUrl}`, request.cardData, { headers }).pipe(
      map(savedData => ({
        success: true,
        filename: savedData.filename,
        fileExists: false // New files don't exist yet
      })),
      catchError(error => throwError(() => new Error(`Failed to save file: ${error.message || 'Unknown error'}`)))
    );
  }

  updateFile(cardData: CardData): Observable<SaveResponse> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });
    
    return this.http.put<CardData>(`${this.baseUrl}`, cardData, { headers }).pipe(
      map(savedData => ({
        success: true,
        filename: savedData.filename,
        fileExists: true
      })),
      catchError(error => throwError(() => new Error(`Failed to update file: ${error.message || 'Unknown error'}`)))
    );
  }

  checkFileExists(filename: string): Observable<boolean> {
    const encodedFilename = encodeURIComponent(filename);
    return this.http.get<boolean>(`${this.baseUrl}/exists/${encodedFilename}`).pipe(
      catchError(error => throwError(() => new Error(`Failed to check file existence: ${error.message || 'Unknown error'}`)))
    );
  }

  loadFromUrl(url: string): Observable<CardData> {
    return this.http.get<CardData>(url).pipe(
      catchError(error => throwError(() => new Error(`Failed to load from URL: ${error.message || 'Unknown error'}`)))
    );
  }

  listFiles(): Observable<string[]> {
    return this.http.get<string[]>(`${this.baseUrl}/files`).pipe(
      catchError(error => throwError(() => new Error(`Failed to list files: ${error.message || 'Unknown error'}`)))
    );
  }

  getFileInfo(filename: string): Observable<FileInfo> {
    // This endpoint doesn't exist in the backend yet, so return mock data
    return new Observable(observer => {
      observer.next({
        filename,
        size: 1024,
        lastModified: new Date(),
        exists: true
      });
      observer.complete();
    });
  }

  deleteFile(filename: string): Observable<void> {
    const encodedFilename = encodeURIComponent(filename);
    return this.http.delete<void>(`${this.baseUrl}/${encodedFilename}`).pipe(
      catchError(error => throwError(() => new Error(`Failed to delete file: ${error.message || 'Unknown error'}`)))
    );
  }

  renameFile(oldName: string, newName: string): Observable<void> {
    // This would need to be implemented in the backend
    return new Observable(observer => {
      observer.error('Rename operation not implemented in backend yet');
    });
  }

  exportData(request: ExportRequest): Observable<Blob> {
    // For now, create a JSON blob from the card data
    const jsonContent = JSON.stringify(request.cardData, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json' });
    
    return new Observable(observer => {
      observer.next(blob);
      observer.complete();
    });
  }

  importData(file: File): Observable<CardData> {
    return new Observable(observer => {
      if (!file.type.includes('json')) {
        observer.error('Invalid file type. Please select a JSON file.');
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          const cardData = JSON.parse(content) as CardData;
          observer.next(cardData);
          observer.complete();
        } catch (error) {
          observer.error('Invalid JSON file format.');
        }
      };
      
      reader.onerror = () => {
        observer.error('Failed to read file.');
      };
      
      reader.readAsText(file);
    });
  }

  validateFile(file: File): Observable<boolean> {
    return new Observable(observer => {
      // Basic validation
      if (!file) {
        observer.next(false);
        observer.complete();
        return;
      }

      if (!file.type.includes('json')) {
        observer.next(false);
        observer.complete();
        return;
      }

      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        observer.next(false);
        observer.complete();
        return;
      }

      observer.next(true);
      observer.complete();
    });
  }

  checkDiskSpace(): Observable<number> {
    // Mock implementation - would need backend support
    return new Observable(observer => {
      observer.next(1024 * 1024 * 1024); // 1GB mock space
      observer.complete();
    });
  }
}
