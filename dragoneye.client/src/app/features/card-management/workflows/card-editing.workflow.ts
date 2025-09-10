import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject } from 'rxjs';
import { map } from 'rxjs/operators';

import { Card, CardDetail } from '../../../core/models/card.model';
import { CardSelection } from '../../../core/models/ui-state.model';
import { CardDataService } from '../services/card-data.service';
import { CardActions } from '../actions/card.actions';
import { DetailActions } from '../actions/detail.actions';
import { CardValidationService } from '../services/card-validation.service';

export interface EditingState {
  isEditing: boolean;
  editingCard: CardSelection | null;
  hasUnsavedChanges: boolean;
  lastAction?: string;
  canUndo: boolean;
  canRedo: boolean;
}

export interface EditingAction {
  type: 'card_update' | 'detail_add' | 'detail_update' | 'detail_delete' | 'detail_move';
  cardSelection: CardSelection;
  description: string;
  timestamp: Date;
  undo: () => void;
  redo: () => void;
}

@Injectable({
  providedIn: 'root'
})
export class CardEditingWorkflow {
  private editingStateSubject = new BehaviorSubject<EditingState>({
    isEditing: false,
    editingCard: null,
    hasUnsavedChanges: false,
    canUndo: false,
    canRedo: false
  });

  private undoStack: EditingAction[] = [];
  private redoStack: EditingAction[] = [];
  private readonly maxUndoActions = 50;

  public editingState$ = this.editingStateSubject.asObservable();

  constructor(
    private cardDataService: CardDataService,
    private cardActions: CardActions,
    private detailActions: DetailActions,
    private cardValidationService: CardValidationService
  ) {
    // Subscribe to card data changes to update editing state
    this.cardDataService.cardDataState$.subscribe(state => {
      this.updateEditingState({
        hasUnsavedChanges: state.hasUnsavedChanges
      });
    });
  }

  get currentEditingState(): EditingState {
    return this.editingStateSubject.value;
  }

  startEditing(cardSelection: CardSelection): Observable<boolean> {
    return new Observable(observer => {
      const card = this.cardDataService.getCard(cardSelection.groupIndex, cardSelection.cardIndex);
      if (!card) {
        observer.next(false);
        observer.complete();
        return;
      }

      this.updateEditingState({
        isEditing: true,
        editingCard: cardSelection,
        lastAction: 'Started editing'
      });

      observer.next(true);
      observer.complete();
    });
  }

  stopEditing(): Observable<boolean> {
    return new Observable(observer => {
      const currentState = this.currentEditingState;
      
      if (currentState.hasUnsavedChanges) {
        // You might want to prompt user to save changes
        console.warn('Stopping editing with unsaved changes');
      }

      this.updateEditingState({
        isEditing: false,
        editingCard: null,
        lastAction: 'Stopped editing'
      });

      observer.next(true);
      observer.complete();
    });
  }

  updateCardTitle(title: string): Observable<boolean> {
    const editingCard = this.currentEditingState.editingCard;
    if (!editingCard) return new Observable(obs => { obs.next(false); obs.complete(); });

    const oldCard = this.cardDataService.getCard(editingCard.groupIndex, editingCard.cardIndex);
    if (!oldCard) return new Observable(obs => { obs.next(false); obs.complete(); });

    return this.cardActions.updateCardTitle(editingCard.groupIndex, editingCard.cardIndex, title).pipe(
      map(result => {
        if (result.success) {
          this.addUndoAction({
            type: 'card_update',
            cardSelection: editingCard,
            description: `Updated card title from "${oldCard.title}" to "${title}"`,
            timestamp: new Date(),
            undo: () => this.cardActions.updateCardTitle(editingCard.groupIndex, editingCard.cardIndex, oldCard.title).subscribe(),
            redo: () => this.cardActions.updateCardTitle(editingCard.groupIndex, editingCard.cardIndex, title).subscribe()
          });

          this.updateEditingState({
            lastAction: 'Updated card title'
          });
        }
        return result.success;
      })
    );
  }

  updateCardType(type: string): Observable<boolean> {
    const editingCard = this.currentEditingState.editingCard;
    if (!editingCard) return new Observable(obs => { obs.next(false); obs.complete(); });

    const oldCard = this.cardDataService.getCard(editingCard.groupIndex, editingCard.cardIndex);
    if (!oldCard) return new Observable(obs => { obs.next(false); obs.complete(); });

    return this.cardActions.updateCardType(editingCard.groupIndex, editingCard.cardIndex, type).pipe(
      map(result => {
        if (result.success) {
          this.addUndoAction({
            type: 'card_update',
            cardSelection: editingCard,
            description: `Updated card type from "${oldCard.type}" to "${type}"`,
            timestamp: new Date(),
            undo: () => this.cardActions.updateCardType(editingCard.groupIndex, editingCard.cardIndex, oldCard.type).subscribe(),
            redo: () => this.cardActions.updateCardType(editingCard.groupIndex, editingCard.cardIndex, type).subscribe()
          });

          this.updateEditingState({
            lastAction: 'Updated card type'
          });
        }
        return result.success;
      })
    );
  }

  updateCardElement(element: string): Observable<boolean> {
    const editingCard = this.currentEditingState.editingCard;
    if (!editingCard) return new Observable(obs => { obs.next(false); obs.complete(); });

    const oldCard = this.cardDataService.getCard(editingCard.groupIndex, editingCard.cardIndex);
    if (!oldCard) return new Observable(obs => { obs.next(false); obs.complete(); });

    return this.cardActions.updateCardElement(editingCard.groupIndex, editingCard.cardIndex, element).pipe(
      map(result => {
        if (result.success) {
          this.addUndoAction({
            type: 'card_update',
            cardSelection: editingCard,
            description: `Updated card element from "${oldCard.element}" to "${element}"`,
            timestamp: new Date(),
            undo: () => this.cardActions.updateCardElement(editingCard.groupIndex, editingCard.cardIndex, oldCard.element).subscribe(),
            redo: () => this.cardActions.updateCardElement(editingCard.groupIndex, editingCard.cardIndex, element).subscribe()
          });

          this.updateEditingState({
            lastAction: 'Updated card element'
          });
        }
        return result.success;
      })
    );
  }

  updateCardBackgroundImage(backgroundImage: string): Observable<boolean> {
    const editingCard = this.currentEditingState.editingCard;
    if (!editingCard) return new Observable(obs => { obs.next(false); obs.complete(); });

    const oldCard = this.cardDataService.getCard(editingCard.groupIndex, editingCard.cardIndex);
    if (!oldCard) return new Observable(obs => { obs.next(false); obs.complete(); });

    return this.cardActions.updateCardBackgroundImage(editingCard.groupIndex, editingCard.cardIndex, backgroundImage).pipe(
      map(result => {
        if (result.success) {
          this.addUndoAction({
            type: 'card_update',
            cardSelection: editingCard,
            description: 'Updated card background image',
            timestamp: new Date(),
            undo: () => this.cardActions.updateCardBackgroundImage(editingCard.groupIndex, editingCard.cardIndex, oldCard.backgroundImage || '').subscribe(),
            redo: () => this.cardActions.updateCardBackgroundImage(editingCard.groupIndex, editingCard.cardIndex, backgroundImage).subscribe()
          });

          this.updateEditingState({
            lastAction: 'Updated background image'
          });
        }
        return result.success;
      })
    );
  }

  addDetail(detailTemplate?: Partial<CardDetail>): Observable<boolean> {
    const editingCard = this.currentEditingState.editingCard;
    if (!editingCard) return new Observable(obs => { obs.next(false); obs.complete(); });

    return this.detailActions.addDetail(editingCard.groupIndex, editingCard.cardIndex, detailTemplate).pipe(
      map(result => {
        if (result.success && result.detail && result.detailIndex !== undefined) {
          this.addUndoAction({
            type: 'detail_add',
            cardSelection: editingCard,
            description: `Added detail "${result.detail.name}"`,
            timestamp: new Date(),
            undo: () => this.detailActions.deleteDetail(editingCard.groupIndex, editingCard.cardIndex, result.detailIndex!).subscribe(),
            redo: () => this.detailActions.addDetail(editingCard.groupIndex, editingCard.cardIndex, result.detail).subscribe()
          });

          this.updateEditingState({
            lastAction: 'Added detail'
          });
        }
        return result.success;
      })
    );
  }

  updateDetail(detailIndex: number, updates: Partial<CardDetail>): Observable<boolean> {
    const editingCard = this.currentEditingState.editingCard;
    if (!editingCard) return new Observable(obs => { obs.next(false); obs.complete(); });

    const oldCard = this.cardDataService.getCard(editingCard.groupIndex, editingCard.cardIndex);
    if (!oldCard || detailIndex >= oldCard.details.length) {
      return new Observable(obs => { obs.next(false); obs.complete(); });
    }

    const oldDetail = oldCard.details[detailIndex];

    return this.detailActions.updateDetail(editingCard.groupIndex, editingCard.cardIndex, detailIndex, updates).pipe(
      map(result => {
        if (result.success) {
          this.addUndoAction({
            type: 'detail_update',
            cardSelection: editingCard,
            description: `Updated detail "${oldDetail.name}"`,
            timestamp: new Date(),
            undo: () => this.detailActions.updateDetail(editingCard.groupIndex, editingCard.cardIndex, detailIndex, oldDetail).subscribe(),
            redo: () => this.detailActions.updateDetail(editingCard.groupIndex, editingCard.cardIndex, detailIndex, updates).subscribe()
          });

          this.updateEditingState({
            lastAction: 'Updated detail'
          });
        }
        return result.success;
      })
    );
  }

  deleteDetail(detailIndex: number): Observable<boolean> {
    const editingCard = this.currentEditingState.editingCard;
    if (!editingCard) return new Observable(obs => { obs.next(false); obs.complete(); });

    const card = this.cardDataService.getCard(editingCard.groupIndex, editingCard.cardIndex);
    if (!card || detailIndex >= card.details.length) {
      return new Observable(obs => { obs.next(false); obs.complete(); });
    }

    const detailToDelete = card.details[detailIndex];

    return this.detailActions.deleteDetail(editingCard.groupIndex, editingCard.cardIndex, detailIndex).pipe(
      map(result => {
        if (result.success) {
          this.addUndoAction({
            type: 'detail_delete',
            cardSelection: editingCard,
            description: `Deleted detail "${detailToDelete.name}"`,
            timestamp: new Date(),
            undo: () => this.detailActions.addDetail(editingCard.groupIndex, editingCard.cardIndex, detailToDelete).subscribe(),
            redo: () => this.detailActions.deleteDetail(editingCard.groupIndex, editingCard.cardIndex, detailIndex).subscribe()
          });

          this.updateEditingState({
            lastAction: 'Deleted detail'
          });
        }
        return result.success;
      })
    );
  }

  moveDetail(fromIndex: number, toIndex: number): Observable<boolean> {
    const editingCard = this.currentEditingState.editingCard;
    if (!editingCard) return new Observable(obs => { obs.next(false); obs.complete(); });

    return this.detailActions.moveDetail(editingCard.groupIndex, editingCard.cardIndex, fromIndex, toIndex).pipe(
      map(result => {
        if (result.success) {
          this.addUndoAction({
            type: 'detail_move',
            cardSelection: editingCard,
            description: `Moved detail from position ${fromIndex + 1} to ${toIndex + 1}`,
            timestamp: new Date(),
            undo: () => this.detailActions.moveDetail(editingCard.groupIndex, editingCard.cardIndex, toIndex, fromIndex).subscribe(),
            redo: () => this.detailActions.moveDetail(editingCard.groupIndex, editingCard.cardIndex, fromIndex, toIndex).subscribe()
          });

          this.updateEditingState({
            lastAction: 'Moved detail'
          });
        }
        return result.success;
      })
    );
  }

  undo(): Observable<boolean> {
    return new Observable(observer => {
      if (this.undoStack.length === 0) {
        observer.next(false);
        observer.complete();
        return;
      }

      const action = this.undoStack.pop()!;
      this.redoStack.push(action);
      
      try {
        action.undo();
        this.updateEditingState({
          canUndo: this.undoStack.length > 0,
          canRedo: this.redoStack.length > 0,
          lastAction: `Undid: ${action.description}`
        });
        observer.next(true);
      } catch (error) {
        console.error('Failed to undo action:', error);
        observer.next(false);
      }
      
      observer.complete();
    });
  }

  redo(): Observable<boolean> {
    return new Observable(observer => {
      if (this.redoStack.length === 0) {
        observer.next(false);
        observer.complete();
        return;
      }

      const action = this.redoStack.pop()!;
      this.undoStack.push(action);
      
      try {
        action.redo();
        this.updateEditingState({
          canUndo: this.undoStack.length > 0,
          canRedo: this.redoStack.length > 0,
          lastAction: `Redid: ${action.description}`
        });
        observer.next(true);
      } catch (error) {
        console.error('Failed to redo action:', error);
        observer.next(false);
      }
      
      observer.complete();
    });
  }

  validateCurrentCard(): Observable<boolean> {
    const editingCard = this.currentEditingState.editingCard;
    if (!editingCard) return new Observable(obs => { obs.next(false); obs.complete(); });

    const card = this.cardDataService.getCard(editingCard.groupIndex, editingCard.cardIndex);
    if (!card) return new Observable(obs => { obs.next(false); obs.complete(); });

    return this.cardActions.validateCard(card).pipe(
      map(validation => validation.isValid)
    );
  }

  canNavigateAway(): boolean {
    return !this.currentEditingState.hasUnsavedChanges;
  }

  getEditingHistory(): EditingAction[] {
    return [...this.undoStack].reverse(); // Most recent first
  }

  clearHistory(): void {
    this.undoStack = [];
    this.redoStack = [];
    this.updateEditingState({
      canUndo: false,
      canRedo: false
    });
  }

  private addUndoAction(action: EditingAction): void {
    this.undoStack.push(action);
    this.redoStack = []; // Clear redo stack when new action is performed
    
    // Limit undo stack size
    if (this.undoStack.length > this.maxUndoActions) {
      this.undoStack = this.undoStack.slice(-this.maxUndoActions);
    }

    this.updateEditingState({
      canUndo: true,
      canRedo: false
    });
  }

  private updateEditingState(updates: Partial<EditingState>): void {
    const currentState = this.currentEditingState;
    this.editingStateSubject.next({ ...currentState, ...updates });
  }
}
