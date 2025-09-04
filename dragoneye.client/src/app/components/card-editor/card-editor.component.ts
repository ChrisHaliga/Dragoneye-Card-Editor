import { Component, OnInit, OnDestroy, HostListener, ViewChild, AfterViewInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { CardService, CardData, Card } from '../../services/card.service';
import { CardSelection } from '../card-hierarchy/card-hierarchy.component';
import { FileManagerModalComponent } from '../file-manager-modal/file-manager-modal.component';
import { OverwriteConfirmationModalComponent } from '../overwrite-confirmation-modal/overwrite-confirmation-modal.component';
import { GettingStartedModalComponent } from '../getting-started-modal/getting-started-modal.component';

@Component({
  selector: 'app-card-editor',
  templateUrl: './card-editor.component.html',
  styleUrls: ['./card-editor.component.css'],
  standalone: false
})
export class CardEditorComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('fileManagerModal', { static: false }) fileManagerModal!: FileManagerModalComponent;
  @ViewChild('overwriteModal', { static: false }) overwriteModal!: OverwriteConfirmationModalComponent;
  @ViewChild('gettingStartedModal', { static: false }) gettingStartedModal!: GettingStartedModalComponent;
  
  public isEditorOpen: boolean = true;
  public isBottomPanelOpen: boolean = true;
  public selectedGroupIndex: number = 0;
  public selectedCardIndex: number = 0;
  public cardData: CardData = { filename: '', groups: [] };
  
  private cardDataSubscription?: Subscription;
  private viewInitialized = false;

  constructor(public cardService: CardService) {}

  public ngOnInit(): void {
    this.cardDataSubscription = this.cardService.cardData$.subscribe(data => {
      this.cardData = data;
      this.ensureValidSelection();
    });
  }

  public ngAfterViewInit(): void {
    this.viewInitialized = true;
  }

  public ngOnDestroy(): void {
    this.cardDataSubscription?.unsubscribe();
  }

  @HostListener('document:keydown', ['$event'])
  public onKeyDown(event: KeyboardEvent): void {
    // Handle keyboard shortcuts
    if (event.ctrlKey || event.metaKey) {
      switch (event.key.toLowerCase()) {
        case 's':
          event.preventDefault();
          this.saveData();
          break;
        case 'o':
          event.preventDefault();
          this.showLoadModal();
          break;
        case 'e':
          event.preventDefault();
          this.exportData();
          break;
      }
    }
    
    if (event.key === 'Escape') {
      // Let child components handle their own escape logic
    }
  }

  private ensureValidSelection(): void {
    if (this.selectedGroupIndex >= this.cardData.groups.length) {
      this.selectedGroupIndex = 0;
    }
    const currentGroup = this.cardData.groups[this.selectedGroupIndex];
    if (currentGroup && this.selectedCardIndex >= currentGroup.cards.length) {
      this.selectedCardIndex = 0;
    }
  }

  public get currentCard(): Card | null {
    const group = this.cardData.groups[this.selectedGroupIndex];
    return group?.cards[this.selectedCardIndex] || null;
  }

  public get hasCards(): boolean {
    return this.cardService.hasCards;
  }

  public get noCardMessage(): string {
    return !this.hasCards ? 'No cards available. Create a card to get started.' : 'Select a card from the hierarchy to start editing';
  }

  public get currentElementSymbol(): string {
    return this.currentCard ? this.cardService.getElementSymbol(this.currentCard.element) : '';
  }

  // Panel management
  public toggleEditor(): void { 
    this.isEditorOpen = !this.isEditorOpen; 
  }
  
  public toggleBottomPanel(): void { 
    this.isBottomPanelOpen = !this.isBottomPanelOpen; 
  }

  // File operations
  public async saveData(): Promise<void> {
    const filename = this.cardData.filename || 'card-set.json';
    
    try {
      const exists = await this.cardService.checkFileExists(filename);
      
      if (exists) {
        // Show overwrite confirmation modal
        this.overwriteModal.show(filename);
      } else {
        // File doesn't exist, save directly
        await this.cardService.saveDataWithOverwrite();
      }
    } catch (error) {
      console.error('Error checking file existence:', error);
      // If check fails, try to save anyway
      await this.cardService.saveDataWithOverwrite();
    }
  }

  public async onOverwriteConfirmed(confirmed: boolean): Promise<void> {
    if (confirmed) {
      try {
        await this.cardService.saveDataWithOverwrite(true);
      } catch (error) {
        console.error('Failed to save file:', error);
      }
    }
  }

  public exportData(): void {
    this.cardService.exportData();
  }

  public exportAsSVG(): void {
    if (!this.currentCard) {
      alert('Please select a card to export as SVG');
      return;
    }
    
    // Find the card display SVG element
    const svgElement = document.querySelector('.displayed-card') as SVGElement;
    if (!svgElement) {
      alert('No card is currently displayed');
      return;
    }

    // Create a copy of the SVG
    const svgClone = svgElement.cloneNode(true) as SVGElement;
    
    // Convert to string
    const svgString = new XMLSerializer().serializeToString(svgClone);
    
    // Create downloadable file
    const blob = new Blob([svgString], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${this.currentCard.title || 'card'}.svg`;
    link.click();
    URL.revokeObjectURL(url);
  }

  public importFile(event: Event): void {
    this.cardService.importFile(event).catch(error => {
      console.error(error);
    });
  }

  public showLoadModal(): void {
    setTimeout(() => {
      if (!this.fileManagerModal) {
        console.error('File manager modal is not available');
        return;
      }
      
      try {
        this.fileManagerModal.show();
      } catch (error) {
        console.error('Error showing modal:', error);
      }
    }, 0);
  }

  public onFileSelected(filename: string): void {
    this.cardService.loadFile(filename).catch(error => {
      console.error('Failed to load file:', error);
    });
  }

  // Edit operations
  public duplicateCurrentCard(): void {
    if (!this.currentCard) return;
    
    const newCard = this.cardService.duplicateCard(this.selectedGroupIndex, this.selectedCardIndex);
    // Select the new card
    this.selectedCardIndex = this.selectedCardIndex + 1;
  }

  public deleteCurrentCard(): void {
    if (!this.currentCard) return;
    
    if (confirm(`Are you sure you want to delete "${this.currentCard.title}"?`)) {
      this.cardService.removeCard(this.selectedGroupIndex, this.selectedCardIndex);
      // Adjust selection if needed
      this.ensureValidSelection();
    }
  }

  // Help operations
  public showGettingStarted(): void {
    if (this.gettingStartedModal) {
      this.gettingStartedModal.show();
    }
  }

  public showKeyboardShortcuts(): void {
    // Placeholder for keyboard shortcuts modal
    alert('Keyboard shortcuts:\n\nCtrl+S - Save\nCtrl+O - Load\nCtrl+E - Export\nEsc - Close modals');
  }

  public openAboutPage(): void {
    window.open('https://www.youtube.com/watch?v=dQw4w9WgXcQ', '_blank');
  }

  // Card selection
  public onCardSelected(selection: CardSelection): void {
    this.selectedGroupIndex = selection.groupIndex;
    this.selectedCardIndex = selection.cardIndex;
  }

  public onCardAdded(selection: CardSelection): void {
    this.selectedGroupIndex = selection.groupIndex;
    this.selectedCardIndex = selection.cardIndex;
  }
}
