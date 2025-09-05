import { Component, OnInit, OnDestroy, HostListener, ViewChild } from '@angular/core';
import { Subscription } from 'rxjs';

import { CardService, CardData, Card } from '../../services/card.service';
import { PreferencesService } from '../../services/preferences.service';
import { ThemeService } from '../../services/theme.service';
import { StateService } from '../../services/state.service';

import { CardSelection } from '../card-hierarchy/card-hierarchy.component';
import { FileManagerModalComponent } from '../file-manager-modal/file-manager-modal.component';
import { OverwriteConfirmationModalComponent } from '../overwrite-confirmation-modal/overwrite-confirmation-modal.component';
import { GettingStartedModalComponent } from '../getting-started-modal/getting-started-modal.component';
import { PreferencesModalComponent } from '../preferences-modal/preferences-modal.component';
import { SaveAsModalComponent } from '../save-as-modal/save-as-modal.component';
import { DeleteConfirmationModalComponent } from '../delete-confirmation-modal/delete-confirmation-modal.component';
import { KeyboardShortcutsModalComponent } from '../keyboard-shortcuts-modal/keyboard-shortcuts-modal.component';

@Component({
  selector: 'app-card-editor',
  templateUrl: './card-editor.component.html',
  styleUrls: ['./card-editor.component.css'],
  standalone: false
})
export class CardEditorComponent implements OnInit, OnDestroy {
  @ViewChild('fileManagerModal', { static: false }) fileManagerModal!: FileManagerModalComponent;
  @ViewChild('overwriteModal', { static: false }) overwriteModal!: OverwriteConfirmationModalComponent;
  @ViewChild('gettingStartedModal', { static: false }) gettingStartedModal!: GettingStartedModalComponent;
  @ViewChild('preferencesModal', { static: false }) preferencesModal!: PreferencesModalComponent;
  @ViewChild('saveAsModal', { static: false }) saveAsModal!: SaveAsModalComponent;
  @ViewChild('deleteModal', { static: false }) deleteModal!: DeleteConfirmationModalComponent;
  @ViewChild('keyboardShortcutsModal', { static: false }) keyboardShortcutsModal!: KeyboardShortcutsModalComponent;
  
  isEditorOpen = true;
  isBottomPanelOpen = true;
  selectedGroupIndex = 0;
  selectedCardIndex = 0;
  cardData: CardData = { filename: '', groups: [] };
  pendingSaveAsFilename = '';
  pendingDeleteAction: (() => void) | null = null;
  
  private cardDataSubscription?: Subscription;

  constructor(
    public cardService: CardService,
    private preferencesService: PreferencesService,
    private themeService: ThemeService,
    private stateService: StateService
  ) {}

  ngOnInit(): void {
    this.cardDataSubscription = this.cardService.cardData$.subscribe(data => {
      this.cardData = data;
      this.ensureValidSelection();
    });

    if (this.preferencesService.preferences.showWelcomeOnStartup) {
      setTimeout(() => this.gettingStartedModal?.show(), 1000);
    }
  }

  ngOnDestroy(): void {
    this.cardDataSubscription?.unsubscribe();
  }

  @HostListener('document:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    if (event.ctrlKey || event.metaKey) {
      switch (event.key.toLowerCase()) {
        case 's':
          event.preventDefault();
          if (event.shiftKey) {
            this.showSaveAsModal();
          } else {
            this.saveData();
          }
          break;
        case 'o':
          event.preventDefault();
          this.showLoadModal();
          break;
        case 'e':
          event.preventDefault();
          this.exportData();
          break;
        case ',':
          event.preventDefault();
          this.showPreferences();
          break;
      }
    }
  }

  get currentCard(): Card | null {
    const group = this.cardData.groups[this.selectedGroupIndex];
    return group?.cards[this.selectedCardIndex] || null;
  }

  get hasCards(): boolean {
    return this.cardService.hasCards;
  }

  get noCardMessage(): string {
    return !this.hasCards ? 'No cards available. Create a card to get started.' : 'Select a card from the hierarchy to start editing';
  }

  get currentElementSymbol(): string {
    return this.currentCard ? this.cardService.getElementSymbol(this.currentCard.element) : '';
  }

  toggleEditor(): void { 
    this.isEditorOpen = !this.isEditorOpen; 
  }
  
  toggleBottomPanel(): void { 
    this.isBottomPanelOpen = !this.isBottomPanelOpen; 
  }

  async saveData(): Promise<void> {
    try {
      await this.stateService.saveData();
    } catch (error) {
      if (error === 'file_exists') {
        this.overwriteModal.show(this.cardData.filename || 'card-set.json');
      }
    }
  }

  showSaveAsModal(): void {
    this.saveAsModal?.show(this.cardData.filename);
  }

  async onSaveAsFilename(filename: string): Promise<void> {
    try {
      this.pendingSaveAsFilename = filename;
      await this.stateService.saveAsData(filename);
    } catch (error) {
      if (error === 'file_exists') {
        this.overwriteModal.show(filename);
      }
    }
  }

  async onOverwriteConfirmed(confirmed: boolean): Promise<void> {
    if (confirmed) {
      if (this.pendingSaveAsFilename) {
        await this.stateService.saveAsWithOverwrite(this.pendingSaveAsFilename);
        this.pendingSaveAsFilename = '';
      } else {
        await this.stateService.saveWithOverwrite();
      }
    } else {
      this.pendingSaveAsFilename = '';
    }
  }

  exportData(): void {
    this.stateService.exportData();
  }

  exportAsSVG(): void {
    this.stateService.exportAsSVG(this.currentCard?.title);
  }

  importFile(event: Event): void {
    this.stateService.importFile(event);
  }

  showLoadModal(): void {
    this.fileManagerModal?.show();
  }

  onFileSelected(filename: string): void {
    this.stateService.loadFile(filename);
  }

  duplicateCurrentCard(): void {
    if (!this.currentCard) return;
    this.stateService.duplicateCard(this.selectedGroupIndex, this.selectedCardIndex, this.currentCard.title);
    this.selectedCardIndex = this.selectedCardIndex + 1;
  }

  deleteCurrentCard(): void {
    if (!this.currentCard) return;
    
    const shouldConfirm = this.preferencesService.preferences.confirmDeleteActions;
    if (shouldConfirm) {
      this.pendingDeleteAction = () => {
        this.stateService.deleteCard(this.selectedGroupIndex, this.selectedCardIndex, this.currentCard!.title);
        this.ensureValidSelection();
      };
      this.deleteModal?.show(this.currentCard.title, 'card');
    } else {
      this.stateService.deleteCard(this.selectedGroupIndex, this.selectedCardIndex, this.currentCard.title);
      this.ensureValidSelection();
    }
  }

  onDeleteConfirmed(confirmed: boolean): void {
    if (confirmed && this.pendingDeleteAction) {
      this.pendingDeleteAction();
    }
    this.pendingDeleteAction = null;
  }

  onDeleteCard(groupIndex: number, cardIndex: number): void {
    const card = this.cardData.groups[groupIndex]?.cards[cardIndex];
    if (!card) return;

    const shouldConfirm = this.preferencesService.preferences.confirmDeleteActions;
    if (shouldConfirm) {
      this.pendingDeleteAction = () => {
        this.stateService.deleteCard(groupIndex, cardIndex, card.title);
        this.ensureValidSelection();
      };
      this.deleteModal?.show(card.title, 'card');
    } else {
      this.stateService.deleteCard(groupIndex, cardIndex, card.title);
      this.ensureValidSelection();
    }
  }

  onDeleteGroup(groupIndex: number): void {
    const group = this.cardData.groups[groupIndex];
    if (!group || this.cardData.groups.length === 1) return;

    const shouldConfirm = this.preferencesService.preferences.confirmDeleteActions;
    if (shouldConfirm) {
      this.pendingDeleteAction = () => {
        this.cardService.removeGroup(groupIndex);
        this.ensureValidSelection();
      };
      this.deleteModal?.show(group.name, 'group');
    } else {
      this.cardService.removeGroup(groupIndex);
      this.ensureValidSelection();
    }
  }

  onDeleteDetail(detailIndex: number): void {
    if (!this.currentCard) return;

    const detail = this.currentCard.details[detailIndex];
    if (!detail || this.currentCard.details.length === 1) return;

    this.pendingDeleteAction = () => {
      this.cardService.removeDetail(this.currentCard!, detailIndex);
    };
    this.deleteModal?.show(detail.name || 'detail', 'detail');
  }

  showPreferences(): void {
    this.preferencesModal?.show();
  }

  showGettingStarted(): void {
    this.gettingStartedModal?.show();
  }

  showKeyboardShortcuts(): void {
    this.keyboardShortcutsModal?.show();
  }

  openAboutPage(): void {
    window.open('https://github.com/ChrisHaliga/Dragoneye', '_blank');
  }

  onCardSelected(selection: CardSelection): void {
    this.selectedGroupIndex = selection.groupIndex;
    this.selectedCardIndex = selection.cardIndex;
  }

  onCardAdded(selection: CardSelection): void {
    this.selectedGroupIndex = selection.groupIndex;
    this.selectedCardIndex = selection.cardIndex;
  }

  private ensureValidSelection(): void {
    if (!this.cardData.groups.length) {
      this.selectedGroupIndex = 0;
      this.selectedCardIndex = 0;
      return;
    }

    if (this.selectedGroupIndex >= this.cardData.groups.length) {
      this.selectedGroupIndex = 0;
    }
    
    const currentGroup = this.cardData.groups[this.selectedGroupIndex];
    if (currentGroup && this.selectedCardIndex >= currentGroup.cards.length) {
      this.selectedCardIndex = Math.max(0, currentGroup.cards.length - 1);
    }
  }
}
