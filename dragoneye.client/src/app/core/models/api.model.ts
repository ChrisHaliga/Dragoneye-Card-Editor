import { CardData, Card, CardGroup, CardDetail } from './card.model';
import { ElementData } from './element.model';
import { AppPreferences } from './preferences.model';

// Generic API response wrapper
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  timestamp?: Date;
}

// Error response model
export interface ApiError {
  code: string;
  message: string;
  details?: string;
  timestamp: Date;
}

// Action result models
export interface ActionResult {
  success: boolean;
  error?: string;
  message?: string;
}

export interface CardActionResult extends ActionResult {
  card?: Card;
  cardIndex?: number;
  groupIndex?: number;
}

export interface GroupActionResult extends ActionResult {
  group?: CardGroup;
  groupIndex?: number;
}

export interface DetailActionResult extends ActionResult {
  detail?: CardDetail;
  detailIndex?: number;
  cardIndex?: number;
  groupIndex?: number;
}

export interface SaveResult extends ActionResult {
  filename?: string;
  fileExists?: boolean;
}

export interface LoadResult extends ActionResult {
  cardData?: CardData;
  filename?: string;
}

export interface ExportResult extends ActionResult {
  filename?: string;
  format?: string;
  size?: number;
}

// File operation models
export interface FileInfo {
  filename: string;
  size: number;
  lastModified: Date;
  exists: boolean;
}

export interface SaveRequest {
  cardData: CardData;
  filename?: string;
  allowOverwrite?: boolean;
}

export interface SaveResponse {
  filename: string;
  success: boolean;
  fileExists?: boolean;
}

export interface LoadRequest {
  filename: string;
}

export interface LoadResponse {
  cardData: CardData;
  filename: string;
}

export interface FileExistsRequest {
  filename: string;
}

export interface FileExistsResponse {
  exists: boolean;
  filename: string;
}

// Preferences operation models
export interface PreferencesRequest {
  preferences: AppPreferences;
}

export interface PreferencesResponse {
  preferences: AppPreferences;
  saved: boolean;
}

export interface PreferencesLoadResponse {
  preferences: AppPreferences;
  isDefault: boolean;
}

// Bulk operation models
export interface BulkDeleteRequest {
  items: Array<{
    type: 'card' | 'group' | 'detail';
    groupIndex?: number;
    cardIndex?: number;
    detailIndex?: number;
  }>;
}

export interface BulkOperationResponse {
  processed: number;
  failed: number;
  errors: string[];
}

// Export models
export interface ExportOptions {
  format: 'json' | 'svg' | 'pdf';
  includeImages: boolean;
  compressionLevel?: number;
  selectedCardsOnly?: boolean;
  selectedCards?: number[];
}

export interface ExportRequest {
  cardData: CardData;
  options: ExportOptions;
  selectedCards?: number[];
}
