import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { Subject, Observable } from 'rxjs';
import { takeUntil, map } from 'rxjs/operators';

// V2 Imports - using absolute paths from app/v2
import { CardDataService } from '../../../features/card-management/services/card-data.service';
import { ElementService } from '../../../features/card-management/services/element.service';
import { CardEditingWorkflow } from '../../../features/card-management/workflows/card-editing.workflow';
import { BulkOperationsWorkflow } from '../../../features/card-management/workflows/bulk-operations.workflow';
import { SelectionService } from '../../../features/ui-state/services/selection.service';
import { ViewportService } from '../../../features/ui-state/services/viewport.service';
import { ModalService } from '../../../features/ui-state/services/modal.service';
import { NotificationService } from '../../../features/ui-state/services/notification.service';
import { FileStateService } from '../../../features/file-management/services/file-state.service';
import { PreferencesService } from '../../../features/preferences/services/preferences.service';
import { ContextMenuService } from '../../../features/ui-state/services/context-menu.service';
import { KeyboardHandler } from '../../../shared/ui/interactions/keyboard.handler';
import { ViewportControlService } from '../../../shared/services/viewport-control.service';
import { TouchHandler } from '../../../shared/ui/interactions/touch.handler';
import { GroupActions } from '../../../features/card-management/actions/group.actions';
import { CardActions } from '../../../features/card-management/actions/card.actions';
import { SaveActions } from '../../../features/file-management/actions/save.actions';
import { LoadActions } from '../../../features/file-management/actions/load.actions';
import { ExportActions } from '../../../features/file-management/actions/export.actions';
import { ContextMenuComponent } from '../../ui/context-menu/context-menu.component';
import { DeleteConfirmationModalComponent } from '../../ui/delete-confirmation-modal/delete-confirmation-modal.component';
import { DragDropService } from '../../../shared/services/drag-drop.service';
import { ThemeService } from '../../../services/theme.service';

// Models
import { CardData, Card, CardGroup } from '../../../core/models/card.model';
import { CardSelection, UIState, SelectionState, ViewportState } from '../../../core/models/ui-state.model';
import { AppPreferences } from '../../../core/models/preferences.model';
import { SaveResult, LoadResult } from '../../../core/models/api.model';
import { CardDataState } from '../../../features/card-management/services/card-data.service';
import { ContextMenuEvent } from '../../../features/ui-state/services/context-menu.service';

@Component({
  selector: 'app-card-editor',
  templateUrl: './card-editor-container.component.html',
  styleUrls: ['./card-editor-container.component.css'],
  standalone: false
})
export class CardEditorContainerComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('cardViewport') cardViewport!: ElementRef<HTMLElement>;
  @ViewChild('viewportContent') viewportContent!: ElementRef<HTMLElement>;
  @ViewChild(ContextMenuComponent) contextMenuComponent!: ContextMenuComponent;
  @ViewChild(DeleteConfirmationModalComponent) deleteModal!: DeleteConfirmationModalComponent;

  private destroy$ = new Subject<void>();

  // State observables - properly typed
  cardData$: Observable<CardData>;
  selection$: Observable<SelectionState>;
  viewport$: Observable<ViewportState>;
  fileState$: Observable<any>;
  preferences$: Observable<AppPreferences>;
  editingState$: Observable<any>;
  modals$: Observable<any>;

  // Current state snapshots
  currentCard: Card | null = null;
  currentSelection: CardSelection = { groupIndex: 0, cardIndex: 0 };
  selectedCards: CardSelection[] = [];
  hasUnsavedChanges = false;
  isLoading = false;
  isEditing = false;

  // Edit modal state
  editModalVisible = false;
  editingCard: Card | null = null;

  // Rename group modal state
  renameGroupModalVisible = false;
  renameGroupCurrentName = '';
  renameGroupIndex = -1;

  // UI state flags
  canUndo = false;
  canRedo = false;

  // Viewport state for template
  currentZoom = 1;
  zoomPercentage = 100;

  // Selection box state - initialized after viewportControl is available
  selectionBox$: Observable<any>;

  // Drag and drop state
  dragState$: Observable<any>;

  // Pending operations
  pendingGroupDeletion: number | null = null;
  pendingCardsDeletion: Array<{ groupIndex: number; cardIndex: number }> | null = null;
  pendingSpecificCardDeletion: { groupIndex: number; cardIndex: number } | null = null;

  // Theme - will be initialized in constructor
  currentTheme$!: Observable<any>;

  constructor(
    private cardDataService: CardDataService,
    private elementService: ElementService,
    private cardEditingWorkflow: CardEditingWorkflow,
    private bulkOperationsWorkflow: BulkOperationsWorkflow,
    private selectionService: SelectionService,
    private viewportService: ViewportService,
    private modalService: ModalService,
    private notificationService: NotificationService,
    private fileStateService: FileStateService,
    private preferencesService: PreferencesService,
    private contextMenuService: ContextMenuService,
    private keyboardHandler: KeyboardHandler,
    private viewportControl: ViewportControlService,
    private touchHandler: TouchHandler,
    private groupActions: GroupActions,
    private cardActions: CardActions,
    private saveActions: SaveActions,
    private loadActions: LoadActions,
    private exportActions: ExportActions,
    private dragDropService: DragDropService,
    private themeService: ThemeService,
    private cdr: ChangeDetectorRef
  ) {
    // Initialize observables after services are injected
    this.cardData$ = this.cardDataService.cardData$;
    this.selection$ = this.selectionService.selectionState$;
    this.viewport$ = this.viewportService.viewportState$;
    this.fileState$ = this.fileStateService.fileState$;
    this.preferences$ = this.preferencesService.preferences$;
    this.editingState$ = this.cardEditingWorkflow.editingState$;
    this.modals$ = this.modalService.modalState$;

    // Initialize selection box observable
    this.selectionBox$ = this.viewportControl.multiSelect$;

    // Initialize drag state observable
    this.dragState$ = this.dragDropService.dragState;

    // Initialize theme observable
    this.currentTheme$ = this.themeService.currentTheme$;
  }

  ngOnInit(): void {
    this.setupStateSubscriptions();
    this.setupEventHandlers();
    this.loadInitialData();
    this.setupThemeObservation();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngAfterViewInit(): void {
    // Initialize viewport control with container and content elements
    if (this.cardViewport && this.viewportContent) {
      this.viewportControl.initialize(
        this.cardViewport.nativeElement,
        this.viewportContent.nativeElement
      );
    }

    // Connect context menu component to service
    if (this.contextMenuComponent) {
      this.contextMenuService.setContextMenuComponent(this.contextMenuComponent);
      console.log('✅ Context menu component connected to service');
    } else {
      console.error('❌ Context menu component not found');
    }
  }

  private setupStateSubscriptions(): void {
    // Update current card and selection when selection changes
    this.selection$.pipe(
      takeUntil(this.destroy$)
    ).subscribe((selection: SelectionState) => {
      this.currentSelection = {
        groupIndex: selection.selectedGroupIndex,
        cardIndex: selection.selectedCardIndex
      };
      this.selectedCards = selection.selectedCards;
      this.currentCard = this.cardDataService.getCard(selection.selectedGroupIndex, selection.selectedCardIndex);
    });

    // Update unsaved changes flag
    this.cardDataService.cardDataState$.pipe(
      takeUntil(this.destroy$)
    ).subscribe((state: CardDataState) => {
      this.hasUnsavedChanges = state.hasUnsavedChanges;
      this.isLoading = state.isLoading;
    });

    // Update undo/redo flags
    this.cardEditingWorkflow.editingState$.pipe(
      takeUntil(this.destroy$)
    ).subscribe((state: any) => {
      this.canUndo = state.canUndo || false;
      this.canRedo = state.canRedo || false;
    });

    // Handle keyboard shortcuts
    this.keyboardHandler.keyboardEvents$.pipe(
      takeUntil(this.destroy$)
    ).subscribe((event: any) => {
      this.handleKeyboardShortcut(event.shortcut.action);
    });

    // Sync viewport state with template variables
    this.viewport$.pipe(
      takeUntil(this.destroy$)
    ).subscribe((viewport: ViewportState) => {
      this.currentZoom = viewport.zoom;
      this.zoomPercentage = Math.round(viewport.zoom * 100);
    });
  }

  private setupEventHandlers(): void {
    // Subscribe to viewport transform changes
    this.viewportControl.transform$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(transform => {
      this.currentZoom = transform.scale;
      this.zoomPercentage = Math.round(transform.scale * 100);

      // Sync with ViewportService if needed
      this.viewportService.setTransform(transform.scale, transform.translateX, transform.translateY);
    });

    // Subscribe to multi-select events
    this.viewportControl.multiSelect$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(event => {
      this.handleMultiSelectEvent(event);
    });
  }

  private loadInitialData(): void {
    // Data is automatically loaded by the CardDataService
    // We just need to ensure proper selection and filename synchronization
    this.cardDataService.cardData$.pipe(
      takeUntil(this.destroy$)
    ).subscribe((cardData: CardData) => {
      // Synchronize filename between CardDataService and FileStateService
      if (cardData.filename) {
        const currentFilename = this.fileStateService.currentState.currentFilename;
        if (currentFilename !== cardData.filename) {
          console.log(`🔄 Syncing filename: "${currentFilename}" → "${cardData.filename}"`);
          this.fileStateService.setCurrentFilename(cardData.filename);
        }
      }
      
      // Ensure proper card selection
      if (cardData.groups.length > 0) {
        const hasValidSelection = this.cardDataService.getCard(
          this.currentSelection.groupIndex,
          this.currentSelection.cardIndex
        );

        if (!hasValidSelection) {
          this.selectionService.selectFirst();
        }
      }
    });
  }

  // Create First Card Action
  createFirstCard(): void {
    // Create a default group if none exists, then add a card
    this.cardDataService.cardData$.pipe(takeUntil(this.destroy$)).subscribe(cardData => {
      if (cardData.groups.length === 0) {
        // Create default group first
        this.groupActions.createGroup('My Cards').subscribe(groupResult => {
          if (groupResult.success && groupResult.groupIndex !== undefined) {
            // Then create the first card
            this.createNewCard(groupResult.groupIndex);
          }
        });
      } else {
        // Create card in first existing group
        this.createNewCard(0);
      }
    });
  }

  private createNewCard(groupIndex: number): void {
    const defaultCard: Partial<Card> = {
      title: 'New Card',
      type: 'Action',
      element: 'arc',
      details: [{
        name: 'Basic Effect',
        details: 'Describe what this card does...',
        apCost: 1,
        spCost: 0
      }]
    };

    this.cardActions.createCard(groupIndex, defaultCard).subscribe(result => {
      if (result.success && result.cardIndex !== undefined) {
        // Select the newly created card
        this.selectionService.selectCard(groupIndex, result.cardIndex);
        // Start editing workflow
        this.cardEditingWorkflow.startEditing({ groupIndex, cardIndex: result.cardIndex });
      }
    });
  }

  // Create First Group Action
  createFirstGroup(): void {
    this.groupActions.createGroup('My Cards').subscribe(result => {
      if (result.success && result.groupIndex !== undefined) {
        this.selectionService.selectGroup(result.groupIndex);
        // Automatically create first card in the new group
        this.createNewCard(result.groupIndex);
      }
    });
  }

  // File Menu Actions - Connected to Backend API with Proper UX
  saveFile(): void {
    console.log('Save File clicked');
    this.saveActions.saveCurrentFile().subscribe((result: SaveResult) => {
      if (result.success) {
        console.log('File saved successfully to backend');
        this.notificationService.saveSuccess(result.filename || 'file');
      } else {
        console.error('Save failed:', result.error);
        this.notificationService.saveError('current file', result.error || 'Unknown error');
      }
    });
  }

  saveAsFile(): void {
    console.log('Save As clicked');
    this.modalService.openSaveAs();
  }

  loadFile(): void {
    console.log('Load File clicked');
    this.modalService.openFileManager();
  }

  exportAsJSON(): void {
    const cardData = this.cardDataService.currentCardData;
    this.exportActions.exportAsJson(cardData).subscribe(result => {
      if (result.success) {
        console.log('JSON export completed');
      } else {
        console.error('Export failed:', result.error);
      }
    });
  }

  exportAsSVG(): void {
    const cardData = this.cardDataService.currentCardData;
    this.exportActions.exportAsSvg(cardData).subscribe(result => {
      if (result.success) {
        console.log('SVG export completed');
      } else {
        console.error('Export failed:', result.error);
      }
    });
  }

  importFile(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      this.loadActions.loadFromFile(file).subscribe(result => {
        if (result.success) {
          console.log('File imported successfully');
        } else {
          console.error('Import failed:', result.error);
        }
      });
      // Reset input
      input.value = '';
    }
  }

  // Edit Menu Actions - Connected to Business Logic
  undo(): void {
    if (this.canUndo) {
      this.cardEditingWorkflow.undo().subscribe(result => {
        if (!result) {
          console.error('Undo failed');
        }
      });
    }
  }

  redo(): void {
    if (this.canRedo) {
      this.cardEditingWorkflow.redo().subscribe(result => {
        if (!result) {
          console.error('Redo failed');
        }
      });
    }
  }

  addNewGroup(): void {
    this.groupActions.createGroup('New Group').subscribe(result => {
      if (result.success && result.groupIndex !== undefined) {
        this.selectionService.selectGroup(result.groupIndex);
      } else {
        console.error('Failed to create group:', result.error);
      }
    });
  }

  duplicateCurrentCard(): void {
    if (this.currentCard) {
      this.cardActions.duplicateCard(this.currentSelection.groupIndex, this.currentSelection.cardIndex).subscribe(result => {
        if (result.success && result.cardIndex !== undefined) {
          this.selectionService.selectCard(this.currentSelection.groupIndex, result.cardIndex);
        } else {
          console.error('Failed to duplicate card:', result.error);
        }
      });
    }
  }

  deleteCurrentCard(): void {
    console.log('Delete current card requested');
    console.log('Current card:', this.currentCard);
    console.log('Selected cards:', this.selectedCards);
    
    // Handle multiple selected cards
    if (this.selectedCards.length > 1) {
      console.log('Multiple cards selected, delegating to deleteMultipleCards');
      this.deleteMultipleCards(this.selectedCards);
      return;
    }
    
    // Handle single card selection
    if (this.currentCard && this.selectedCards.length === 1) {
      console.log(`Deleting single card: "${this.currentCard.title}" at [${this.currentSelection.groupIndex}, ${this.currentSelection.cardIndex}]`);
      
      // Check confirm delete preference
      const currentPreferences = this.preferencesService.currentPreferences;
      const shouldConfirm = currentPreferences.confirmDeleteActions;
      
      if (shouldConfirm) {
        console.log('Opening delete confirmation modal via ModalService');
        this.modalService.openDeleteConfirmation(this.currentCard.title, 'card');
      } else {
        console.log('Preferences set to skip confirmation - deleting directly');
        this.deleteCard(this.currentSelection.groupIndex, this.currentSelection.cardIndex);
      }
      return;
    }
    
    // Handle case where no card is selected
    if (this.selectedCards.length === 0) {
      console.log('No card selected for deletion');
      this.notificationService.info('No Selection', 'Please select a card to delete');
      return;
    }
    
    // Fallback: try to delete based on current selection
    console.log('Fallback: attempting to delete based on current selection');
    const cardData = this.cardDataService.currentCardData;
    if (cardData.groups.length > 0 && cardData.groups[this.currentSelection.groupIndex]) {
      const group = cardData.groups[this.currentSelection.groupIndex];
      if (group.cards[this.currentSelection.cardIndex]) {
        const card = group.cards[this.currentSelection.cardIndex];
        console.log(`Fallback deletion of card: "${card.title}"`);
        
        // Check confirm delete preference for fallback too
        const currentPreferences = this.preferencesService.currentPreferences;
        const shouldConfirm = currentPreferences.confirmDeleteActions;
        
        if (shouldConfirm) {
          console.log('Opening delete confirmation modal via ModalService (fallback)');
          this.modalService.openDeleteConfirmation(card.title, 'card');
        } else {
          console.log('Preferences set to skip confirmation - deleting directly (fallback)');
          this.deleteCard(this.currentSelection.groupIndex, this.currentSelection.cardIndex);
        }
        return;
      }
    }
    
    console.log('Unable to determine card to delete');
    this.notificationService.info('No Card Found', 'Unable to determine which card to delete');
  }

  deleteCard(groupIndex: number, cardIndex: number): void {
    this.cardActions.deleteCard(groupIndex, cardIndex).subscribe(result => {
      if (result.success) {
        this.notificationService.success('Card Deleted', 'Card has been deleted successfully');
        // Select next available card or first card if none available
        this.selectionService.selectFirst();
      } else {
        console.error('Failed to delete card:', result.error);
        this.notificationService.error('Delete Failed', result.error || 'Failed to delete card');
      }
    });
  }

  // View Menu Actions - Using new viewport control service
  zoomIn(): void {
    this.viewportControl.zoomIn();
  }

  zoomOut(): void {
    this.viewportControl.zoomOut();
  }

  resetView(): void {
    this.viewportControl.resetView();
  }

  focusOnSelectedCard(): void {
    if (!this.currentCard || this.selectedCards.length === 0) {
      console.log('No card selected to focus on');
      return;
    }

    // Find the selected card element(s)
    const selection = this.selectedCards[0]; // Focus on first selected card
    const cardElement = document.querySelector(
      `.card-container[data-group-index="${selection.groupIndex}"][data-card-index="${selection.cardIndex}"]`
    ) as HTMLElement;

    if (!cardElement || !this.cardViewport) {
      console.log('Card element or viewport not found');
      return;
    }

    // Get viewport and card dimensions
    const viewportRect = this.cardViewport.nativeElement.getBoundingClientRect();
    const cardRect = cardElement.getBoundingClientRect();

    // Calculate the zoom level to make the card at least twice its height on screen
    const desiredCardHeight = Math.min(viewportRect.height * 0.5, viewportRect.width * 0.4); // Use 50% of viewport height or 40% of width, whichever is smaller
    const currentCardHeight = cardRect.height;
    const targetZoom = Math.max(1.0, desiredCardHeight / currentCardHeight);

    // Get current transform to calculate card position in world coordinates
    const currentTransform = this.viewportControl.getTransform();
    
    // Calculate card center in viewport coordinates (before zoom)
    const cardCenterX = (cardRect.left + cardRect.width / 2 - viewportRect.left - currentTransform.translateX) / currentTransform.scale;
    const cardCenterY = (cardRect.top + cardRect.height / 2 - viewportRect.top - currentTransform.translateY) / currentTransform.scale;

    // Calculate viewport center
    const viewportCenterX = viewportRect.width / 2;
    const viewportCenterY = viewportRect.height / 2;

    // Calculate new translation to center the card after zoom
    const newTranslateX = viewportCenterX - (cardCenterX * targetZoom);
    const newTranslateY = viewportCenterY - (cardCenterY * targetZoom);

    // Apply the new transform
    this.viewportControl.setTransform(targetZoom, newTranslateX, newTranslateY);

    console.log(`Focused on card: ${selection.groupIndex}[${selection.cardIndex}] with zoom: ${targetZoom.toFixed(2)}x`);
  }

  // Multi-select event handler
  private handleMultiSelectEvent(event: any): void {
    console.log('Multi-select event:', event);

    if (event.type === 'end' && event.selectedCards && event.selectedCards.length > 0) {
      // Handle multi-selection using the new SelectionService method
      console.log('Selected cards from drag-select:', event.selectedCards);
      console.log('Count before deduplication:', event.selectedCards.length);

      // Pass the selected cards to the selection service (which will handle deduplication)
      this.selectionService.selectMultipleCards(event.selectedCards);
    } else if (event.type === 'clear') {
      // Handle background click - clear selection only if there's a selection
      const currentSelection = this.selectionService.currentSelection;
      if (currentSelection.hasSelection || currentSelection.selectedCards.length > 0) {
        console.log('Background clicked - clearing selection');
        this.selectionService.clearSelection();
        console.log('Selection cleared, selection bounds should be cleared');
      } else {
        console.log('Background clicked - no selection to clear');
      }
    }
  }

  // Selection box helper methods for template
  getSelectionBoxLeft(selectionBox: any): number {
    if (!selectionBox || !selectionBox.box || selectionBox.type === 'end') return 0;
    if (!this.cardViewport) return 0;

    const viewportRect = this.cardViewport.nativeElement.getBoundingClientRect();
    return Math.min(selectionBox.box.startX, selectionBox.box.endX) - viewportRect.left;
  }

  getSelectionBoxTop(selectionBox: any): number {
    if (!selectionBox || !selectionBox.box || selectionBox.type === 'end') return 0;
    if (!this.cardViewport) return 0;

    const viewportRect = this.cardViewport.nativeElement.getBoundingClientRect();
    return Math.min(selectionBox.box.startY, selectionBox.box.endY) - viewportRect.top;
  }

  getSelectionBoxWidth(selectionBox: any): number {
    if (!selectionBox || !selectionBox.box || selectionBox.type === 'end') return 0;
    return Math.abs(selectionBox.box.endX - selectionBox.box.startX);
  }

  getSelectionBoxHeight(selectionBox: any): number {
    if (!selectionBox || !selectionBox.box || selectionBox.type === 'end') return 0;
    return Math.abs(selectionBox.box.endY - selectionBox.box.startY);
  }

  // Help Menu Actions
  openGettingStarted(): void {
    this.modalService.openGettingStarted();
  }

  openKeyboardShortcuts(): void {
    this.modalService.openKeyboardShortcuts();
  }

  openAbout(): void {
    this.modalService.openAbout();
  }

  openPreferences(): void {
    this.modalService.openPreferences();
  }

  // Event Handlers
  onCardSelected(selection: CardSelection): void {
    console.log('CardEditorContainer: Card selected:', selection);

    if (selection.action === 'add') {
      // Add to selection (shift+click)
      this.selectionService.addToSelection(selection.groupIndex, selection.cardIndex);
      console.log('CardEditorContainer: Added card to selection');
    } else if (selection.action === 'remove') {
      // Remove from selection (shift+click on selected card)
      this.selectionService.removeFromSelection(selection.groupIndex, selection.cardIndex);
      console.log('CardEditorContainer: Removed card from selection');
    } else {
      // Normal selection (replaces current selection)
      this.selectionService.selectCard(selection.groupIndex, selection.cardIndex);
      console.log('CardEditorContainer: Single card selection');
    }
  }

  onCardAdded(selection: CardSelection): void {
    this.cardActions.createCard(selection.groupIndex).subscribe(result => {
      if (result.success && result.cardIndex !== undefined) {
        this.selectionService.selectCard(selection.groupIndex, result.cardIndex);
        // Removed notification - card creation is a frequent action that doesn't need notification
      } else {
        this.notificationService.error('Creation Failed', result.error || 'Failed to create card');
      }
    });
  }

  onCardDeleted(deletion: { groupIndex: number; cardIndex: number }): void {
    // Check confirm delete preference for direct card deletions
    const currentPreferences = this.preferencesService.currentPreferences;
    const shouldConfirm = currentPreferences.confirmDeleteActions;
    
    if (shouldConfirm) {
      const card = this.cardDataService.getCard(deletion.groupIndex, deletion.cardIndex);
      if (card) {
        console.log(`Card deletion from component requires confirmation: "${card.title}" at [${deletion.groupIndex}, ${deletion.cardIndex}]`);
        // Store the specific card to delete after confirmation
        this.pendingSpecificCardDeletion = { groupIndex: deletion.groupIndex, cardIndex: deletion.cardIndex };
        this.modalService.openDeleteConfirmation(card.title, 'card');
      }
    } else {
      console.log('Preferences set to skip confirmation - deleting card directly from component');
      this.deleteCard(deletion.groupIndex, deletion.cardIndex);
    }
  }

  onGroupRenamed(renaming: { groupIndex: number; newName: string }): void {
    this.groupActions.updateGroupName(renaming.groupIndex, renaming.newName).subscribe(result => {
      if (result.success) {
        this.notificationService.success('Group Renamed', `Group renamed to "${renaming.newName}"`);
      } else {
        console.error('Failed to rename group:', result.error);
        this.notificationService.error('Rename Failed', result.error || 'Unknown error');
      }
    });
  }

  onCardMoved(event: { fromGroup: number; fromCard: number; toGroup: number; toCard: number; draggedCards?: any[]; draggedIndices?: number[]; isMultiMove?: boolean }): void {
    console.log('Card moved:', event);

    if (event.isMultiMove && event.draggedCards && event.draggedIndices) {
      // Handle multi-card move with a simpler, more reliable approach
      this.handleMultiCardMoveBulk(event);
    } else {
      // Handle single card move - update selection BEFORE the card move
      // This ensures the selection is correct when Angular recreates the DOM
      console.log(`Single card move: ${event.fromGroup}[${event.fromCard}] → ${event.toGroup}[${event.toCard}]`);

      // Pre-update selection to the target position
      this.selectionService.selectCard(event.toGroup, event.toCard);

      // Then perform the card move
      this.cardActions.moveCard(
        event.fromGroup,
        event.fromCard,
        event.toGroup,
        event.toCard
      ).subscribe(result => {
        if (result.success) {
          console.log(`Single card move completed successfully`);
        } else {
          console.error('Failed to move card:', result.error);
          this.notificationService.error('Move Failed', result.error || 'Failed to move card');
          // Revert selection on failure
          this.selectionService.selectCard(event.fromGroup, event.fromCard);
        }
      });
    }
  }

  private handleMultiCardMoveBulk(event: { fromGroup: number; fromCard: number; toGroup: number; toCard: number; draggedCards?: any[]; draggedIndices?: number[]; isMultiMove?: boolean }): void {
    const { fromGroup, toGroup, toCard, draggedCards, draggedIndices } = event;

    // Type guards to ensure we have the required data
    if (!draggedCards || !draggedIndices) {
      console.error('Missing required data for multi-card move');
      this.notificationService.error('Move Failed', 'Missing card data for multi-card move');
      return;
    }

    console.log(`Bulk moving ${draggedCards.length} cards from group ${fromGroup} to group ${toGroup} at position ${toCard}`);

    // Calculate the new selection positions BEFORE the move
    const newSelections: { groupIndex: number; cardIndex: number }[] = [];

    if (fromGroup === toGroup) {
      // Same-group move
      const sortedOriginalIndices = [...draggedIndices].sort((a, b) => a - b);
      const movedCardsBefore = sortedOriginalIndices.filter(index => index < toCard).length;
      const adjustedInsertPosition = toCard - movedCardsBefore;

      for (let i = 0; i < draggedCards.length; i++) {
        newSelections.push({
          groupIndex: toGroup,
          cardIndex: adjustedInsertPosition + i
        });
      }
    } else {
      // Cross-group move
      for (let i = 0; i < draggedCards.length; i++) {
        newSelections.push({
          groupIndex: toGroup,
          cardIndex: toCard + i
        });
      }
    }

    // Update selection BEFORE the move operation
    this.selectionService.selectMultipleCards(newSelections);

    try {
      // Use the CardDataService directly for bulk operations
      const success = this.cardDataService.moveMultipleCards(
        fromGroup,
        draggedIndices,
        toGroup,
        toCard,
        draggedCards
      );

      if (success) {
        console.log(`Multi-card move completed successfully`);
      } else {
        console.error('Bulk move operation failed');
        this.notificationService.error('Move Failed', 'Failed to move multiple cards');
        // Revert selection on failure
        const originalSelections = draggedIndices.map(index => ({
          groupIndex: fromGroup,
          cardIndex: index
        }));
        this.selectionService.selectMultipleCards(originalSelections);
      }
    } catch (error: any) {
      console.error('Error during bulk move:', error);
      this.notificationService.error('Move Failed', error.message || 'Failed to move multiple cards');
      // Revert selection on failure
      const originalSelections = draggedIndices.map(index => ({
        groupIndex: fromGroup,
        cardIndex: index
      }));
      this.selectionService.selectMultipleCards(originalSelections);
    }
  }

  // Multi-card operations
  duplicateMultipleCards(selectedCards: Array<{ groupIndex: number; cardIndex: number }>): void {
    console.log(`Duplicating ${selectedCards.length} cards`);
    
    // Group cards by group for efficient processing
    const cardsByGroup = new Map<number, Array<{ originalIndex: number; card: any }>>();
    
    // First, collect the actual card data along with indices
    selectedCards.forEach(selection => {
      if (!cardsByGroup.has(selection.groupIndex)) {
        cardsByGroup.set(selection.groupIndex, []);
      }
      
      const card = this.cardDataService.getCard(selection.groupIndex, selection.cardIndex);
      if (card) {
        cardsByGroup.get(selection.groupIndex)!.push({
          originalIndex: selection.cardIndex,
          card: card
        });
      }
    });

    // Track new selections for the duplicated cards
    const newSelections: Array<{ groupIndex: number; cardIndex: number }> = [];
    let completedGroups = 0;
    const totalGroups = cardsByGroup.size;

    // Process each group
    cardsByGroup.forEach((cardData, groupIndex) => {
      // Sort by original index to maintain order in duplicates
      const sortedCardData = cardData.sort((a, b) => a.originalIndex - b.originalIndex);
      
      let completedCards = 0;
      
      // Create all duplicates at the beginning of the group (position 0, 1, 2, etc.)
      sortedCardData.forEach((cardInfo, arrayIndex) => {
        // Create a new card object for duplication with copy indicator
        const cardCopy = { ...cardInfo.card };
        delete cardCopy.id; // Remove ID so a new one is generated
        
        // Add copy indicator to the title
        if (cardCopy.title && !cardCopy.title.includes('(Copy)')) {
          cardCopy.title = `${cardCopy.title} (Copy)`;
        } else if (!cardCopy.title) {
          cardCopy.title = 'Untitled Card (Copy)';
        }
        
        // Insert at position arrayIndex (0, 1, 2, etc.) to maintain order
        this.cardActions.createCard(groupIndex, cardCopy).subscribe(createResult => {
          if (createResult.success && createResult.cardIndex !== undefined) {
            // Move the newly created card to its correct position at the beginning
            const targetPosition = arrayIndex;
            
            if (createResult.cardIndex !== targetPosition) {
              this.cardActions.moveCard(groupIndex, createResult.cardIndex, groupIndex, targetPosition).subscribe(moveResult => {
                completedCards++;
                
                if (moveResult.success && moveResult.cardIndex !== undefined) {
                  newSelections.push({ groupIndex, cardIndex: moveResult.cardIndex });
                }
                
                // Check if all cards are completed
                if (completedCards === sortedCardData.length) {
                  completedGroups++;
                  
                  if (completedGroups === totalGroups) {
                    // All duplications completed
                    const sortedNewSelections = newSelections.sort((a, b) => {
                      if (a.groupIndex !== b.groupIndex) return a.groupIndex - b.groupIndex;
                      return a.cardIndex - b.cardIndex;
                    });
                    
                    this.selectionService.selectMultipleCards(sortedNewSelections);
                    this.notificationService.success(
                      'Cards Duplicated', 
                      `Successfully duplicated ${selectedCards.length} cards`
                    );
                  }
                }
              });
            } else {
              // Card is already in the right position
              completedCards++;
              newSelections.push({ groupIndex, cardIndex: createResult.cardIndex });
              
              if (completedCards === sortedCardData.length) {
                completedGroups++;
                
                if (completedGroups === totalGroups) {
                  const sortedNewSelections = newSelections.sort((a, b) => {
                    if (a.groupIndex !== b.groupIndex) return a.groupIndex - b.groupIndex;
                    return a.cardIndex - b.cardIndex;
                  });
                  
                  this.selectionService.selectMultipleCards(sortedNewSelections);
                  this.notificationService.success(
                    'Cards Duplicated', 
                    `Successfully duplicated ${selectedCards.length} cards`
                  );
                }
              }
            }
          }
        });
      });
    });
  }

  deleteMultipleCards(selectedCards: Array<{ groupIndex: number; cardIndex: number }>): void {
    console.log(`Deleting ${selectedCards.length} cards`);
    
    // Check confirm delete preference
    const currentPreferences = this.preferencesService.currentPreferences;
    const shouldConfirm = currentPreferences.confirmDeleteActions;
    
    if (shouldConfirm) {
      console.log('Preferences require confirmation for delete - showing confirmation dialog for multiple cards');
      // For multiple cards, show a confirmation with the count
      const cardCount = selectedCards.length;
      const confirmationMessage = `${cardCount} selected cards`;
      this.modalService.openDeleteConfirmation(confirmationMessage, 'card');
      
      // Store the pending deletion so we can process it in onDeleteConfirmed
      this.pendingCardsDeletion = selectedCards;
    } else {
      console.log('Preferences set to skip confirmation - deleting multiple cards directly');
      this.proceedWithMultipleCardDeletion(selectedCards);
    }
  }

  private proceedWithMultipleCardDeletion(selectedCards: Array<{ groupIndex: number; cardIndex: number }>): void {
    // Group cards by group for efficient processing
    const cardsByGroup = new Map<number, number[]>();
    selectedCards.forEach(selection => {
      if (!cardsByGroup.has(selection.groupIndex)) {
        cardsByGroup.set(selection.groupIndex, []);
      }
      cardsByGroup.get(selection.groupIndex)!.push(selection.cardIndex);
    });

    let completedGroups = 0;
    const totalGroups = cardsByGroup.size;
    let totalDeleted = 0;

    // Process each group
    cardsByGroup.forEach((cardIndices, groupIndex) => {
      // Sort indices in descending order to maintain correct positions during deletion
      const sortedIndices = cardIndices.sort((a, b) => b - a);
      let completedCards = 0;
      
      sortedIndices.forEach(cardIndex => {
        this.cardActions.deleteCard(groupIndex, cardIndex).subscribe(result => {
          completedCards++;
          
          if (result.success) {
            totalDeleted++;
          }
          
          // Check if all cards in this group are completed
          if (completedCards === sortedIndices.length) {
            completedGroups++;
            
            // Check if all groups are completed
            if (completedGroups === totalGroups) {
              // All deletions completed
              this.selectionService.clearSelection();
              this.notificationService.success(
                'Cards Deleted', 
                `Successfully deleted ${totalDeleted} cards`
              );
              
              // Select first available card if any exist
              this.selectionService.selectFirst();
            }
          }
        });
      });
    });
  }

  private setupThemeObservation(): void {
    // Subscribe to theme changes from preferences
    this.preferences$.pipe(
      takeUntil(this.destroy$)
    ).subscribe((preferences: AppPreferences) => {
      // Apply theme changes to the component if needed
      console.log('Theme preferences updated:', preferences.theme);
    });
  }

  private handleKeyboardShortcut(action: string): void {
    console.log('Keyboard shortcut received:', action); // Debug log
    switch (action) {
      case 'save':
        this.saveFile();
        break;
      case 'undo':
        this.undo();
        break;
      case 'redo':
        this.redo();
        break;
      case 'delete':
        this.deleteCurrentCard();
        break;
      case 'duplicate':
        this.duplicateCurrentCard();
        break;
      case 'zoomIn':
        this.zoomIn();
        break;
      case 'zoomOut':
        this.zoomOut();
        break;
      case 'resetView':
        this.resetView();
        break;
      case 'moveLeft':
        console.log('Move left triggered');
        this.moveSelectedCardLeft();
        break;
      case 'moveRight':
        console.log('Move right triggered');
        this.moveSelectedCardRight();
        break;
      case 'help':
        this.openGettingStarted();
        break;
      case 'shortcuts':
        this.openKeyboardShortcuts();
        break;
      case 'preferences':
        this.openPreferences();
        break;
      case 'escape':
        // Handle escape key - close modals or clear selection
        const handledByModal = this.modalService.handleEscapeKey();
        if (!handledByModal) {
          // If no modal was closed, clear selection
          this.selectionService.clearSelection();
        }
        break;
      // Navigation actions (these might be the ones getting triggered instead)
      case 'selectPreviousGroup':
        console.log('Select previous group (plain left arrow)');
        // For now, we'll ignore these, but this confirms if Ctrl isn't being detected
        break;
      case 'selectNextGroup':
        console.log('Select next group (plain right arrow)');
        // For now, we'll ignore these, but this confirms if Ctrl isn't being detected
        break;
      case 'selectPrevious':
        console.log('Select previous (up arrow)');
        break;
      case 'selectNext':
        console.log('Select next (down arrow)');
        break;
      default:
        console.log('Unhandled keyboard shortcut:', action);
    }
  }

  onCardEditRequested(event: { groupIndex: number; cardIndex: number }): void {
    console.log('CardEditorContainer: Card edit requested for:', event);
    const card = this.cardDataService.getCard(event.groupIndex, event.cardIndex);
    console.log('CardEditorContainer: Retrieved card:', card);
    if (card) {
      this.editingCard = card;
      this.editModalVisible = true;
      console.log('CardEditorContainer: Modal should now be visible. editModalVisible:', this.editModalVisible, 'editingCard:', this.editingCard);
    } else {
      console.error('CardEditorContainer: No card found for indices:', event);
    }
  }

  onCloseEditModal(): void {
    this.editModalVisible = false;
    this.editingCard = null;
  }

  openRenameGroupModal(groupIndex: number): void {
    const cardData = this.cardDataService.currentCardData;
    const group = cardData.groups[groupIndex];
    if (group) {
      this.renameGroupIndex = groupIndex;
      this.renameGroupCurrentName = group.name;
      this.renameGroupModalVisible = true;
    }
  }

  onCloseRenameGroupModal(): void {
    this.renameGroupModalVisible = false;
    this.renameGroupCurrentName = '';
    this.renameGroupIndex = -1;
  }

  onCardUpdated(updatedCard: Card): void {
    console.log('CardEditorContainer: Card updated:', updatedCard);
    if (this.editingCard && this.currentSelection) {
      // Replace the entire card by passing all properties as updates
      const success = this.cardDataService.updateCard(
        this.currentSelection.groupIndex,
        this.currentSelection.cardIndex,
        updatedCard
      );

      if (success) {
        this.notificationService.success('Card Updated', 'Card changes have been saved');
        console.log('CardEditorContainer: Card update successful');

        // Update the local reference
        this.editingCard = updatedCard;
      } else {
        this.notificationService.error('Update Failed', 'Failed to update card');
        console.error('CardEditorContainer: Card update failed');
      }
    }
  }

  // Template helper methods
  getTotalCardCount(cardData: CardData): number {
    return cardData.groups.reduce((total, group) => total + group.cards.length, 0);
  }

  getViewportElement(): HTMLElement | null {
    return this.cardViewport?.nativeElement || null;
  }

  getViewportContentElement(): HTMLElement | null {
    return this.viewportContent?.nativeElement || null;
  }

  // Track by function for multi-card preview
  trackByCardIndex(index: number, card: any): any {
    return card.id || index;
  }

  // Context menu and modal event handlers
  onBackgroundContextMenu(event: MouseEvent): void {
    event.preventDefault();
    // Show background context menu
    this.contextMenuService.showForBackground({ x: event.clientX, y: event.clientY });
  }

  onFileSelected(filename: string): void {
    this.loadActions.loadFile(filename).subscribe(result => {
      if (result.success) {
        this.notificationService.success('File Loaded', `Successfully loaded ${filename}`);
      } else {
        this.notificationService.error('Load Failed', result.error || 'Failed to load file');
      }
    });
  }

  onSaveAsFilename(filename: string): void {
    const cardData = this.cardDataService.currentCardData;
    this.saveActions.saveAs(cardData, filename).subscribe((result: SaveResult) => {
      if (result.success) {
        this.notificationService.success('File Saved', `Successfully saved as ${filename}`);
      } else {
        this.notificationService.error('Save Failed', result.error || 'Failed to save file');
      }
    });
  }

  onDeleteConfirmed(confirmed: boolean): void {
    if (confirmed) {
      if (this.pendingGroupDeletion !== null) {
        // Delete group
        this.groupActions.deleteGroup(this.pendingGroupDeletion).subscribe(result => {
          if (result.success) {
            this.notificationService.success('Group Deleted', 'Group has been deleted');
          } else {
            this.notificationService.error('Delete Failed', result.error || 'Failed to delete group');
          }
        });
        this.pendingGroupDeletion = null;
      } else if (this.pendingCardsDeletion && this.pendingCardsDeletion.length > 0) {
        // Delete multiple cards
        const deletions = this.pendingCardsDeletion;
        this.proceedWithMultipleCardDeletion(deletions);
        this.pendingCardsDeletion = null;
      } else if (this.pendingSpecificCardDeletion) {
        // Delete specific card (from context menu or hover delete)
        console.log(`Confirmed deletion of specific card at [${this.pendingSpecificCardDeletion.groupIndex}, ${this.pendingSpecificCardDeletion.cardIndex}]`);
        this.deleteCard(this.pendingSpecificCardDeletion.groupIndex, this.pendingSpecificCardDeletion.cardIndex);
        this.pendingSpecificCardDeletion = null;
      } else if (this.currentCard) {
        // Delete current single card (from Edit menu or keyboard shortcut)
        console.log(`Confirmed deletion of current card: "${this.currentCard.title}" at [${this.currentSelection.groupIndex}, ${this.currentSelection.cardIndex}]`);
        this.deleteCard(this.currentSelection.groupIndex, this.currentSelection.cardIndex);
      }
    } else {
      // User cancelled deletion
      this.pendingGroupDeletion = null;
      this.pendingCardsDeletion = null;
      this.pendingSpecificCardDeletion = null;
      console.log('Card deletion cancelled by user');
    }
  }

  onContextMenuAction(event: ContextMenuEvent): void {
    console.log('Context menu action:', event.action);
    switch (event.action) {
      case 'edit-card':
        // Handle edit card from context menu
        if (event.groupIndex !== undefined && event.cardIndex !== undefined) {
          this.onCardEditRequested({ groupIndex: event.groupIndex, cardIndex: event.cardIndex });
        }
        break;
      case 'duplicate-card':
        // Handle duplicate card from context menu
        if (event.groupIndex !== undefined && event.cardIndex !== undefined) {
          this.cardActions.duplicateCard(event.groupIndex, event.cardIndex).subscribe(result => {
            if (result.success && result.cardIndex !== undefined) {
              this.selectionService.selectCard(event.groupIndex!, result.cardIndex);
              this.notificationService.success('Card Duplicated', 'Card has been duplicated successfully');
            } else {
              this.notificationService.error('Duplicate Failed', result.error || 'Failed to duplicate card');
            }
          });
        }
        break;
      case 'duplicate-cards':
        // Handle duplicate multiple cards from context menu
        if (event.selectedCards && event.selectedCards.length > 0) {
          this.duplicateMultipleCards(event.selectedCards);
        }
        break;
      case 'delete-card':
        // Handle delete card from context menu
        if (event.groupIndex !== undefined && event.cardIndex !== undefined) {
          // Check confirm delete preference
          const currentPreferences = this.preferencesService.currentPreferences;
          const shouldConfirm = currentPreferences.confirmDeleteActions;
          
          if (shouldConfirm) {
            const card = this.cardDataService.getCard(event.groupIndex, event.cardIndex);
            if (card) {
              console.log(`Context menu card deletion requires confirmation: "${card.title}" at [${event.groupIndex}, ${event.cardIndex}]`);
              // Store the specific card to delete after confirmation
              this.pendingSpecificCardDeletion = { groupIndex: event.groupIndex, cardIndex: event.cardIndex };
              this.modalService.openDeleteConfirmation(card.title, 'card');
            }
          } else {
            this.deleteCard(event.groupIndex, event.cardIndex);
          }
        }
        break;
      case 'delete-cards':
        // Handle delete multiple cards from context menu
        if (event.selectedCards && event.selectedCards.length > 0) {
          this.deleteMultipleCards(event.selectedCards);
        }
        break;
      case 'move-card':
        // Handle move card left/right from context menu
        if (event.groupIndex !== undefined && event.cardIndex !== undefined && event.direction) {
          const cardData = this.cardDataService.currentCardData;
          const group = cardData.groups[event.groupIndex];

          if (group) {
            if (event.direction === 'left' && event.cardIndex > 0) {
              this.onCardMoved({
                fromGroup: event.groupIndex,
                fromCard: event.cardIndex,
                toGroup: event.groupIndex,
                toCard: event.cardIndex - 1
              });
            } else if (event.direction === 'right' && event.cardIndex < group.cards.length - 1) {
              this.onCardMoved({
                fromGroup: event.groupIndex,
                fromCard: event.cardIndex,
                toGroup: event.groupIndex,
                toCard: event.cardIndex + 1
              });
            }
          }
        }
        break;
      case 'add-card':
        // Handle add card from context menu (for group context menu)
        if (event.groupIndex !== undefined) {
          this.onCardAdded({ groupIndex: event.groupIndex, cardIndex: -1 });
        } else {
          this.onCardAdded(this.currentSelection);
        }
        break;
      case 'add-group':
        this.addNewGroup();
        break;
      case 'rename-group':
        // Handle rename group from context menu
        if (event.groupIndex !== undefined) {
          this.openRenameGroupModal(event.groupIndex);
        }
        break;
      case 'group-cards':
        // Handle group multiple cards (placeholder for future implementation)
        console.log('Group cards action - not yet implemented');
        this.notificationService.info('Coming Soon', 'Card grouping feature will be available in a future update');
        break;
      default:
        console.log('Unhandled context menu action:', event.action);
    }
  }

  // Keyboard card movement methods
  moveSelectedCardLeft(): void {
    if (!this.currentCard || this.selectedCards.length === 0) {
      console.log('No card selected to move left');
      return;
    }

    const selection = this.currentSelection;
    const cardData = this.cardDataService.currentCardData;
    const group = cardData.groups[selection.groupIndex];

    if (!group) {
      console.log('Invalid group for selected card');
      return;
    }

    // Check if card can move left (not the first card)
    if (selection.cardIndex > 0) {
      this.onCardMoved({
        fromGroup: selection.groupIndex,
        fromCard: selection.cardIndex,
        toGroup: selection.groupIndex,
        toCard: selection.cardIndex - 1
      });
      console.log(`Moved card left: ${selection.groupIndex}[${selection.cardIndex}] → [${selection.cardIndex - 1}]`);
    } else {
      console.log('Card is already at the leftmost position');
    }
  }

  moveSelectedCardRight(): void {
    if (!this.currentCard || this.selectedCards.length === 0) {
      console.log('No card selected to move right');
      return;
    }

    const selection = this.currentSelection;
    const cardData = this.cardDataService.currentCardData;
    const group = cardData.groups[selection.groupIndex];

    if (!group) {
      console.log('Invalid group for selected card');
      return;
    }

    // Check if card can move right (not the last card)
    if (selection.cardIndex < group.cards.length - 1) {
      this.onCardMoved({
        fromGroup: selection.groupIndex,
        fromCard: selection.cardIndex,
        toGroup: selection.groupIndex,
        toCard: selection.cardIndex + 1
      });
      console.log(`Moved card right: ${selection.groupIndex}[${selection.cardIndex}] → [${selection.cardIndex + 1}]`);
    } else {
      console.log('Card is already at the rightmost position');
    }
  }
}
