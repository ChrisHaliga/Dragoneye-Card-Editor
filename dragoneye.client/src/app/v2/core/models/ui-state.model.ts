// UI state models

export interface ViewportState {
  zoom: number;
  panX: number;
  panY: number;
}

export interface SelectionState {
  selectedGroupIndex: number;
  selectedCardIndex: number;
  selectedCards: CardSelection[]; // Array of all selected cards
  hasSelection: boolean;
  isMultiSelect: boolean; // True when multiple cards are selected
}

export interface CardSelection {
  groupIndex: number;
  cardIndex: number;
  action?: 'select' | 'add' | 'remove'; // Optional action for multi-selection operations
}

export interface EditingState {
  editingGroupIndex: number;
  isEditingCard: boolean;
  hasUnsavedChanges: boolean;
}

export interface ModalState {
  fileManagerOpen: boolean;
  overwriteModalOpen: boolean;
  gettingStartedOpen: boolean;
  preferencesOpen: boolean;
  saveAsOpen: boolean;
  deleteConfirmationOpen: boolean;
  keyboardShortcutsOpen: boolean;
  aboutOpen: boolean;
}

export interface UIState {
  viewport: ViewportState;
  selection: SelectionState;
  editing: EditingState;
  modals: ModalState;
  isEditorOpen: boolean;
  isBottomPanelOpen: boolean;
}

export interface TouchState {
  lastPinchDistance: number | null;
  isTouching: boolean;
  touchCount: number;
}
