import { Injectable } from '@angular/core';
import { Observable, forkJoin, of } from 'rxjs';
import { map, switchMap, catchError } from 'rxjs/operators';

import { Card, CardGroup } from '../../../core/models/card.model';
import { CardSelection } from '../../../core/models/ui-state.model';
import { CardDataService } from '../services/card-data.service';
import { CardActions } from '../actions/card.actions';
import { GroupActions } from '../actions/group.actions';
import { DetailActions } from '../actions/detail.actions';

export interface BulkOperationResult {
  success: boolean;
  processedCount: number;
  failedCount: number;
  errors: string[];
  results: any[];
}

export interface BulkDeleteOptions {
  cards?: CardSelection[];
  groups?: number[];
  confirmBeforeDelete?: boolean;
}

export interface BulkUpdateOptions {
  cards?: CardSelection[];
  updates?: {
    type?: string;
    elements?: string[];
    costMultiplier?: number;
  };
}

export interface BulkDuplicateOptions {
  cards?: CardSelection[];
  groups?: number[];
  namePrefix?: string;
  nameSuffix?: string;
}

@Injectable({
  providedIn: 'root'
})
export class BulkOperationsWorkflow {

  constructor(
    private cardDataService: CardDataService,
    private cardActions: CardActions,
    private groupActions: GroupActions,
    private detailActions: DetailActions
  ) {}

  bulkDeleteCards(cardSelections: CardSelection[]): Observable<BulkOperationResult> {
    return new Observable(observer => {
      const results: any[] = [];
      const errors: string[] = [];
      let processedCount = 0;
      let failedCount = 0;

      // Sort by groupIndex and cardIndex in reverse order to avoid index shifting issues
      const sortedSelections = [...cardSelections].sort((a, b) => {
        if (a.groupIndex !== b.groupIndex) {
          return b.groupIndex - a.groupIndex;
        }
        return b.cardIndex - a.cardIndex;
      });

      const deleteOperations = sortedSelections.map(selection => 
        this.cardActions.deleteCard(selection.groupIndex, selection.cardIndex).pipe(
          map(result => {
            if (result.success) {
              processedCount++;
            } else {
              failedCount++;
              errors.push(`Failed to delete card at group ${selection.groupIndex}, card ${selection.cardIndex}: ${result.error}`);
            }
            results.push(result);
            return result;
          }),
          catchError(error => {
            failedCount++;
            errors.push(`Error deleting card at group ${selection.groupIndex}, card ${selection.cardIndex}: ${error.message}`);
            return of({ success: false, error: error.message });
          })
        )
      );

      forkJoin(deleteOperations).subscribe({
        next: () => {
          observer.next({
            success: failedCount === 0,
            processedCount,
            failedCount,
            errors,
            results
          });
          observer.complete();
        },
        error: (error) => {
          observer.next({
            success: false,
            processedCount,
            failedCount: cardSelections.length,
            errors: [error.message],
            results
          });
          observer.complete();
        }
      });
    });
  }

  bulkDeleteGroups(groupIndices: number[]): Observable<BulkOperationResult> {
    return new Observable(observer => {
      const results: any[] = [];
      const errors: string[] = [];
      let processedCount = 0;
      let failedCount = 0;

      // Sort in reverse order to avoid index shifting issues
      const sortedIndices = [...groupIndices].sort((a, b) => b - a);

      const deleteOperations = sortedIndices.map(groupIndex => 
        this.groupActions.deleteGroup(groupIndex).pipe(
          map(result => {
            if (result.success) {
              processedCount++;
            } else {
              failedCount++;
              errors.push(`Failed to delete group ${groupIndex}: ${result.error}`);
            }
            results.push(result);
            return result;
          }),
          catchError(error => {
            failedCount++;
            errors.push(`Error deleting group ${groupIndex}: ${error.message}`);
            return of({ success: false, error: error.message });
          })
        )
      );

      forkJoin(deleteOperations).subscribe({
        next: () => {
          observer.next({
            success: failedCount === 0,
            processedCount,
            failedCount,
            errors,
            results
          });
          observer.complete();
        },
        error: (error) => {
          observer.next({
            success: false,
            processedCount,
            failedCount: groupIndices.length,
            errors: [error.message],
            results
          });
          observer.complete();
        }
      });
    });
  }

  bulkDuplicateCards(cardSelections: CardSelection[], options: BulkDuplicateOptions = {}): Observable<BulkOperationResult> {
    return new Observable(observer => {
      const results: any[] = [];
      const errors: string[] = [];
      let processedCount = 0;
      let failedCount = 0;

      const duplicateOperations = cardSelections.map(selection => 
        this.cardActions.duplicateCard(selection.groupIndex, selection.cardIndex).pipe(
          switchMap(result => {
            if (result.success && result.card && (options.namePrefix || options.nameSuffix)) {
              // Update the name if prefix or suffix specified
              const newTitle = `${options.namePrefix || ''}${result.card.title}${options.nameSuffix || ''}`;
              const newCardIndex = selection.cardIndex + 1; // Duplicated card is right after original
              
              return this.cardActions.updateCardTitle(selection.groupIndex, newCardIndex, newTitle).pipe(
                map(updateResult => {
                  if (updateResult.success) {
                    processedCount++;
                    return { ...result, card: updateResult.card };
                  } else {
                    failedCount++;
                    errors.push(`Duplicated card but failed to update title: ${updateResult.error}`);
                    return result;
                  }
                })
              );
            } else if (result.success) {
              processedCount++;
              return of(result);
            } else {
              failedCount++;
              errors.push(`Failed to duplicate card at group ${selection.groupIndex}, card ${selection.cardIndex}: ${result.error}`);
              return of(result);
            }
          }),
          catchError(error => {
            failedCount++;
            errors.push(`Error duplicating card at group ${selection.groupIndex}, card ${selection.cardIndex}: ${error.message}`);
            return of({ success: false, error: error.message });
          })
        )
      );

      forkJoin(duplicateOperations).subscribe({
        next: (operationResults) => {
          results.push(...operationResults);
          observer.next({
            success: failedCount === 0,
            processedCount,
            failedCount,
            errors,
            results
          });
          observer.complete();
        },
        error: (error) => {
          observer.next({
            success: false,
            processedCount,
            failedCount: cardSelections.length,
            errors: [error.message],
            results
          });
          observer.complete();
        }
      });
    });
  }

  bulkUpdateCards(cardSelections: CardSelection[], updates: BulkUpdateOptions['updates'] = {}): Observable<BulkOperationResult> {
    return new Observable(observer => {
      const results: any[] = [];
      const errors: string[] = [];
      let processedCount = 0;
      let failedCount = 0;

      const updateOperations = cardSelections.map(selection => {
        const card = this.cardDataService.getCard(selection.groupIndex, selection.cardIndex);
        if (!card) {
          failedCount++;
          errors.push(`Card not found at group ${selection.groupIndex}, card ${selection.cardIndex}`);
          return of({ success: false, error: 'Card not found' });
        }

        const cardUpdates: Partial<Card> = {};
        if (updates.type) cardUpdates.type = updates.type;
        if (updates.elements) cardUpdates.elements = updates.elements;

        let updateObservable = this.cardActions.updateCard(selection.groupIndex, selection.cardIndex, cardUpdates);

        // Handle cost multiplier for details
        if (updates.costMultiplier && updates.costMultiplier !== 1) {
          updateObservable = updateObservable.pipe(
            switchMap(result => {
              if (result.success) {
                return this.detailActions.bulkUpdateCosts(selection.groupIndex, selection.cardIndex, updates.costMultiplier!).pipe(
                  map(detailResults => {
                    const allDetailUpdatesSucceeded = detailResults.every(dr => dr.success);
                    if (!allDetailUpdatesSucceeded) {
                      const detailErrors = detailResults.filter(dr => !dr.success).map(dr => dr.error).join('; ');
                      errors.push(`Failed to update costs for some details: ${detailErrors}`);
                    }
                    return { ...result, detailResults };
                  })
                );
              }
              return of(result);
            })
          );
        }

        return updateObservable.pipe(
          map(result => {
            if (result.success) {
              processedCount++;
            } else {
              failedCount++;
              errors.push(`Failed to update card at group ${selection.groupIndex}, card ${selection.cardIndex}: ${result.error}`);
            }
            results.push(result);
            return result;
          }),
          catchError(error => {
            failedCount++;
            errors.push(`Error updating card at group ${selection.groupIndex}, card ${selection.cardIndex}: ${error.message}`);
            return of({ success: false, error: error.message });
          })
        );
      });

      forkJoin(updateOperations).subscribe({
        next: () => {
          observer.next({
            success: failedCount === 0,
            processedCount,
            failedCount,
            errors,
            results
          });
          observer.complete();
        },
        error: (error) => {
          observer.next({
            success: false,
            processedCount,
            failedCount: cardSelections.length,
            errors: [error.message],
            results
          });
          observer.complete();
        }
      });
    });
  }

  moveMultipleCards(moves: Array<{from: CardSelection, to: CardSelection}>): Observable<BulkOperationResult> {
    return new Observable(observer => {
      const results: any[] = [];
      const errors: string[] = [];
      let processedCount = 0;
      let failedCount = 0;

      // Execute moves sequentially to avoid index conflicts
      let currentObservable: Observable<any> = of(null);

      moves.forEach((move, index) => {
        currentObservable = currentObservable.pipe(
          switchMap(() => 
            this.cardActions.moveCard(
              move.from.groupIndex, 
              move.from.cardIndex, 
              move.to.groupIndex, 
              move.to.cardIndex
            ).pipe(
              map(result => {
                if (result.success) {
                  processedCount++;
                } else {
                  failedCount++;
                  errors.push(`Failed to move card ${index + 1}: ${result.error}`);
                }
                results.push(result);
                return result;
              }),
              catchError(error => {
                failedCount++;
                errors.push(`Error moving card ${index + 1}: ${error.message}`);
                results.push({ success: false, error: error.message });
                return of({ success: false, error: error.message });
              })
            )
          )
        );
      });

      currentObservable.subscribe({
        next: () => {
          observer.next({
            success: failedCount === 0,
            processedCount,
            failedCount,
            errors,
            results
          });
          observer.complete();
        },
        error: (error) => {
          observer.next({
            success: false,
            processedCount,
            failedCount: moves.length,
            errors: [error.message],
            results
          });
          observer.complete();
        }
      });
    });
  }

  exportSelectedCards(cardSelections: CardSelection[]): Observable<Card[]> {
    return new Observable(observer => {
      const cards: Card[] = [];
      
      cardSelections.forEach(selection => {
        const card = this.cardDataService.getCard(selection.groupIndex, selection.cardIndex);
        if (card) {
          // Deep clone the card to avoid reference issues
          const clonedCard: Card = {
            ...card,
            details: card.details.map(detail => ({ ...detail }))
          };
          cards.push(clonedCard);
        }
      });

      observer.next(cards);
      observer.complete();
    });
  }

  importCards(cards: Card[], targetGroupIndex: number): Observable<BulkOperationResult> {
    return new Observable(observer => {
      const results: any[] = [];
      const errors: string[] = [];
      let processedCount = 0;
      let failedCount = 0;

      const importOperations = cards.map((card, index) => 
        this.cardActions.createCard(targetGroupIndex, card).pipe(
          map(result => {
            if (result.success) {
              processedCount++;
            } else {
              failedCount++;
              errors.push(`Failed to import card ${index + 1} (${card.title}): ${result.error}`);
            }
            results.push(result);
            return result;
          }),
          catchError(error => {
            failedCount++;
            errors.push(`Error importing card ${index + 1} (${card.title}): ${error.message}`);
            return of({ success: false, error: error.message });
          })
        )
      );

      forkJoin(importOperations).subscribe({
        next: () => {
          observer.next({
            success: failedCount === 0,
            processedCount,
            failedCount,
            errors,
            results
          });
          observer.complete();
        },
        error: (error) => {
          observer.next({
            success: false,
            processedCount,
            failedCount: cards.length,
            errors: [error.message],
            results
          });
          observer.complete();
        }
      });
    });
  }

  balanceAllCards(): Observable<BulkOperationResult> {
    return new Observable(observer => {
      const allCards = this.cardDataService.getAllCards();
      const cardSelections: CardSelection[] = [];
      
      // Build list of all card selections
      this.cardDataService.currentCardData.groups.forEach((group, groupIndex) => {
        group.cards.forEach((card, cardIndex) => {
          cardSelections.push({ groupIndex, cardIndex });
        });
      });

      // Apply balance changes based on card complexity
      const balanceOperations = cardSelections.map(selection => {
        const card = this.cardDataService.getCard(selection.groupIndex, selection.cardIndex);
        if (!card) return of([{ success: false, error: 'Card not found', detail: null, detailIndex: -1 }]);

        const totalCost = card.details.reduce((sum, detail) => sum + detail.apCost + detail.spCost, 0);
        const totalDetails = card.details.length;
        const avgCostPerDetail = totalCost / totalDetails;

        // Simple balancing: if average cost per detail is too low/high, adjust
        let costMultiplier = 1;
        if (avgCostPerDetail < 2) {
          costMultiplier = 1.5; // Increase costs
        } else if (avgCostPerDetail > 6) {
          costMultiplier = 0.8; // Decrease costs
        }

        if (costMultiplier !== 1) {
          return this.detailActions.bulkUpdateCosts(selection.groupIndex, selection.cardIndex, costMultiplier);
        }

        return of([{ success: true, detail: null, detailIndex: -1 }]);
      });

      const results: any[] = [];
      const errors: string[] = [];
      let processedCount = 0;
      let failedCount = 0;

      forkJoin(balanceOperations).subscribe({
        next: (operationResults) => {
          operationResults.forEach((detailResults, index) => {
            const hasFailures = Array.isArray(detailResults) && detailResults.some(dr => !dr.success);
            if (hasFailures) {
              failedCount++;
              const detailErrors = detailResults
                .filter(dr => !dr.success)
                .map(dr => (dr as any).error || 'Unknown error')
                .join('; ');
              errors.push(`Failed to balance card ${index + 1}: ${detailErrors}`);
            } else {
              processedCount++;
            }
            results.push(detailResults);
          });

          observer.next({
            success: failedCount === 0,
            processedCount,
            failedCount,
            errors,
            results
          });
          observer.complete();
        },
        error: (error) => {
          observer.next({
            success: false,
            processedCount,
            failedCount: cardSelections.length,
            errors: [error.message],
            results
          });
          observer.complete();
        }
      });
    });
  }
}
