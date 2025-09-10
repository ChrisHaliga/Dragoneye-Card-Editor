import { Observable } from 'rxjs';
import { CardData, Card, CardGroup, CardDetail } from '../../models/card.model';
import { ElementData } from '../../models/element.model';

export interface ICardApiRepository {
  // Card data operations
  getCardData(): Observable<CardData>;
  loadCardDataFromFile(filename: string): Observable<CardData>;
  saveCardData(cardData: CardData): Observable<CardData>;
  updateCardData(cardData: CardData): Observable<CardData>;
  deleteCardDataFile(filename: string): Observable<void>;
  
  // File operations
  fileExists(filename: string): Observable<boolean>;
  getAvailableFiles(): Observable<string[]>;
  
  // Element data
  getElements(): Observable<ElementData[]>;
  
  // Validation operations
  validateCard(card: Card): Observable<{ isValid: boolean; errors: string[] }>;
  validateCardData(cardData: CardData): Observable<{ isValid: boolean; errors: string[] }>;
  
  // Search operations
  searchCards(query: string): Observable<{ groupIndex: number; cardIndex: number; card: Card }[]>;
  
  // Statistics operations
  getCardStatistics(): Observable<{
    totalCards: number;
    totalGroups: number;
    cardsByType: { [type: string]: number };
    cardsByElement: { [element: string]: number };
  }>;
}
