import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CardData, CardDetail, Card, CardGroup, ElementData } from './card.service';

@Injectable({
  providedIn: 'root'
})
export class CardApiService {
  private readonly baseUrl = '/api';

  constructor(private http: HttpClient) {}

  getCardData(): Observable<CardData> {
    return this.http.get<CardData>(`${this.baseUrl}/cards`);
  }

  getCardDataByFilename(filename: string): Observable<CardData> {
    return this.http.get<CardData>(`${this.baseUrl}/cards/${encodeURIComponent(filename)}`);
  }

  getAllFiles(): Observable<string[]> {
    return this.http.get<string[]>(`${this.baseUrl}/cards/files`);
  }

  saveCardData(cardData: CardData): Observable<CardData> {
    return this.http.post<CardData>(`${this.baseUrl}/cards`, cardData);
  }

  updateCardData(cardData: CardData): Observable<CardData> {
    return this.http.put<CardData>(`${this.baseUrl}/cards`, cardData);
  }

  deleteCardData(filename: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/cards/${encodeURIComponent(filename)}`);
  }

  fileExists(filename: string): Observable<boolean> {
    return this.http.get<boolean>(`${this.baseUrl}/cards/exists/${encodeURIComponent(filename)}`);
  }

  getElements(): Observable<ElementData[]> {
    return this.http.get<ElementData[]>(`${this.baseUrl}/cards/elements`);
  }
}
