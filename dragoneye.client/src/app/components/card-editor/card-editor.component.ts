import { Component } from '@angular/core';

interface CardDetail {
  type: string;
  details: string;
  apCost: number;
  spCost: number;
}

interface Card {
  title: string;
  element: string;
  backgroundImage?: string;
  details: CardDetail[];
}

interface CardGroup {
  name: string;
  cards: Card[];
}

interface CardData {
  filename: string;
  groups: CardGroup[];
}

@Component({
  selector: 'app-card-editor',
  templateUrl: './card-editor.component.html',
  styleUrls: ['./card-editor.component.css'],
  standalone: false
})
export class CardEditorComponent {
  public isEditorOpen = true;
  public selectedGroupIndex = 0;
  public selectedCardIndex = 0;

  // Mock data - replace with @Input() later
  public cardData: CardData = {
    filename: 'my-card-set.json',
    groups: [
      {
        name: 'Fire Cards',
        cards: [
          {
            title: 'Flame Strike',
            element: 'fire',
            backgroundImage: 'https://t4.ftcdn.net/jpg/13/17/63/49/360_F_1317634900_4gaa1XLZsnMPtLqYgWm2c7GskuzIMQUW.jpg',
            details: [
              { type: 'Attack', details: 'Deal 3 damage', apCost: 2, spCost: 1 },
              { type: 'Burn', details: 'Target burns for 2 turns', apCost: 0, spCost: 0 }
            ]
          },
          {
            title: 'Fireball',
            element: 'fire',
            backgroundImage: 'https://t4.ftcdn.net/jpg/13/17/63/49/360_F_1317634900_4gaa1XLZsnMPtLqYgWm2c7GskuzIMQUW.jpg',
            details: [
              { type: 'Spell', details: 'Area damage to all enemies', apCost: 3, spCost: 2 }
            ]
          }
        ]
      },
      {
        name: 'Water Cards',
        cards: [
          {
            title: 'Healing Wave',
            element: 'water',
            backgroundImage: 'https://t4.ftcdn.net/jpg/13/17/63/49/360_F_1317634900_4gaa1XLZsnMPtLqYgWm2c7GskuzIMQUW.jpg',
            details: [
              { type: 'Heal', details: 'Restore 5 HP', apCost: 1, spCost: 1 }
            ]
          }
        ]
      }
    ]
  };

  public get currentCard(): Card {
    return this.cardData.groups[this.selectedGroupIndex]?.cards[this.selectedCardIndex];
  }

  public toggleEditor(): void {
    this.isEditorOpen = !this.isEditorOpen;
  }

  public selectCard(groupIndex: number, cardIndex: number): void {
    this.selectedGroupIndex = groupIndex;
    this.selectedCardIndex = cardIndex;
  }

  public saveData(): void {
    const dataStr = JSON.stringify(this.cardData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);

    const link = document.createElement('a');
    link.href = url;
    link.download = this.cardData.filename;
    link.click();

    URL.revokeObjectURL(url);
  }

  public getCircles(count: number, type: string): any[] {
    return Array(count).fill(type);
  }

  public getDetailTitleX(detail: CardDetail): number {
    return 28 + Math.max(detail.apCost + detail.spCost, 1) * 8 + 5;
  }

  public getCardImage(): string {
    return this.currentCard?.backgroundImage || 'default.png';
  }

  public onImageChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file && this.currentCard) {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (this.currentCard) {
          this.currentCard.backgroundImage = e.target?.result as string;
        }
      };
      reader.readAsDataURL(file);
    }
  }

  public addDetail(): void {
    if (this.currentCard) {
      this.currentCard.details.push({
        type: 'New Action',
        details: 'Description here',
        apCost: 0,
        spCost: 0
      });
    }
  }

  public removeDetail(index: number): void {
    if (this.currentCard && this.currentCard.details.length > 1) {
      this.currentCard.details.splice(index, 1);
    }
  }

  public addGroup(): void {
    this.cardData.groups.push({
      name: 'New Group',
      cards: []
    });
  }

  public removeGroup(index: number): void {
    if (this.cardData.groups.length > 1) {
      this.cardData.groups.splice(index, 1);
      // Reset selection if we deleted the current group
      if (this.selectedGroupIndex >= this.cardData.groups.length) {
        this.selectedGroupIndex = 0;
        this.selectedCardIndex = 0;
      }
    }
  }

  public addCard(groupIndex: number): void {
    this.cardData.groups[groupIndex].cards.push({
      title: 'New Card',
      element: 'neutral',
      backgroundImage: '',
      details: [{
        type: 'Action',
        details: 'Description here',
        apCost: 1,
        spCost: 0
      }]
    });
  }
}
