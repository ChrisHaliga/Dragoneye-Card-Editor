import { Observable } from 'rxjs';
import { CardData } from '../../models/card.model';
import { 
  FileInfo, 
  ExportRequest, 
  ExportOptions,
  SaveRequest,
  SaveResponse,
  LoadRequest
} from '../../models/api.model';

export interface IFileApiRepository {
  // File CRUD operations
  loadFile(request: LoadRequest): Observable<CardData>;
  saveFile(request: SaveRequest): Observable<SaveResponse>;
  loadFromUrl(url: string): Observable<CardData>;
  
  // File management
  listFiles(): Observable<string[]>;
  getFileInfo(filename: string): Observable<FileInfo>;
  deleteFile(filename: string): Observable<void>;
  renameFile(oldName: string, newName: string): Observable<void>;
  
  // Import/Export operations
  exportData(request: ExportRequest): Observable<Blob>;
  importData(file: File): Observable<CardData>;
  
  // File validation
  validateFile(file: File): Observable<boolean>;
  checkDiskSpace(): Observable<number>;
}
