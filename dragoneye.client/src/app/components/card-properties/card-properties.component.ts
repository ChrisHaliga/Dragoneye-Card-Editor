import { Component, Input, HostListener } from '@angular/core';
import { Card, CardDetail, CardService } from '../../services/card.service';

@Component({
  selector: 'app-card-properties',
  templateUrl: './card-properties.component.html',
  styleUrls: ['./card-properties.component.css'],
  standalone: false
})
export class CardPropertiesComponent {
  @Input() card!: Card;
  selectedDetailIndex = -1;

  constructor(public cardService: CardService) {}

  @HostListener('document:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Escape') this.selectedDetailIndex = -1;
  }

  selectDetail(index: number): void {
    this.selectedDetailIndex = this.selectedDetailIndex === index ? -1 : index;
  }

  onImageChange(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file?.type.startsWith('image/')) return;

    const reader = new FileReader();
    reader.onload = (e) => this.card.backgroundImage = e.target?.result as string;
    reader.readAsDataURL(file);
    (event.target as HTMLInputElement).value = '';
  }

  removeImage(): void { this.card.backgroundImage = ''; }

  addDetail(): void {
    const newDetail = this.cardService.addDetail(this.card);
    this.selectedDetailIndex = this.card.details.indexOf(newDetail);
  }

  removeDetail(index: number): void {
    this.cardService.removeDetail(this.card, index);
    if (this.selectedDetailIndex >= this.card.details.length) this.selectedDetailIndex = -1;
  }

  duplicateDetail(index: number): void {
    this.cardService.duplicateDetail(this.card, index);
  }
}
