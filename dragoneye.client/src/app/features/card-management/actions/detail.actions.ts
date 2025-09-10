import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { CardDetail, ValidationResult } from '../../../core/models/card.model';
import { CardDataService } from '../services/card-data.service';
import { CardValidationService } from '../services/card-validation.service';

export interface DetailActionResult {
  success: boolean;
  detail?: CardDetail;
  detailIndex?: number;
  error?: string;
  validationErrors?: string[];
}

@Injectable({
  providedIn: 'root'
})
export class DetailActions {

  constructor(
    private cardDataService: CardDataService,
    private cardValidationService: CardValidationService
  ) {}

  addDetail(groupIndex: number, cardIndex: number, detailTemplate?: Partial<CardDetail>): Observable<DetailActionResult> {
    return new Observable(observer => {
      try {
        const card = this.cardDataService.getCard(groupIndex, cardIndex);
        if (!card) {
          observer.next({
            success: false,
            error: 'Card not found'
          });
          observer.complete();
          return;
        }

        const defaultDetail: CardDetail = {
          name: 'New Action',
          details: 'Enter description here',
          apCost: 1,
          spCost: 0,
          ...detailTemplate
        };

        // Validate the new detail
        const validation = this.cardValidationService.validateDetail(defaultDetail);
        if (!validation.isValid) {
          observer.next({
            success: false,
            error: 'Detail validation failed',
            validationErrors: validation.errors
          });
          observer.complete();
          return;
        }

        const createdDetail = this.cardDataService.addDetail(groupIndex, cardIndex, defaultDetail);
        
        if (createdDetail) {
          const detailIndex = card.details.length; // New detail is at the end
          observer.next({
            success: true,
            detail: createdDetail,
            detailIndex
          });
        } else {
          observer.next({
            success: false,
            error: 'Failed to add detail'
          });
        }
        
        observer.complete();
      } catch (error: any) {
        observer.next({
          success: false,
          error: error.message || 'Failed to add detail'
        });
        observer.complete();
      }
    });
  }

  duplicateDetail(groupIndex: number, cardIndex: number, detailIndex: number): Observable<DetailActionResult> {
    return new Observable(observer => {
      try {
        const card = this.cardDataService.getCard(groupIndex, cardIndex);
        if (!card || detailIndex >= card.details.length) {
          observer.next({
            success: false,
            error: 'Detail not found'
          });
          observer.complete();
          return;
        }

        const duplicatedDetail = this.cardDataService.duplicateDetail(groupIndex, cardIndex, detailIndex);
        
        if (duplicatedDetail) {
          const newDetailIndex = detailIndex + 1;
          observer.next({
            success: true,
            detail: duplicatedDetail,
            detailIndex: newDetailIndex
          });
        } else {
          observer.next({
            success: false,
            error: 'Failed to duplicate detail'
          });
        }
        
        observer.complete();
      } catch (error: any) {
        observer.next({
          success: false,
          error: error.message || 'Failed to duplicate detail'
        });
        observer.complete();
      }
    });
  }

  updateDetail(groupIndex: number, cardIndex: number, detailIndex: number, updates: Partial<CardDetail>): Observable<DetailActionResult> {
    return new Observable(observer => {
      try {
        const card = this.cardDataService.getCard(groupIndex, cardIndex);
        if (!card || detailIndex >= card.details.length) {
          observer.next({
            success: false,
            error: 'Detail not found'
          });
          observer.complete();
          return;
        }

        const currentDetail = card.details[detailIndex];
        const updatedDetail = { ...currentDetail, ...updates };

        // Validate the updated detail
        const validation = this.cardValidationService.validateDetail(updatedDetail);
        if (!validation.isValid) {
          observer.next({
            success: false,
            error: 'Detail validation failed',
            validationErrors: validation.errors
          });
          observer.complete();
          return;
        }

        const success = this.cardDataService.updateDetail(groupIndex, cardIndex, detailIndex, updates);
        
        if (success) {
          observer.next({
            success: true,
            detail: updatedDetail,
            detailIndex
          });
        } else {
          observer.next({
            success: false,
            error: 'Failed to update detail'
          });
        }
        
        observer.complete();
      } catch (error: any) {
        observer.next({
          success: false,
          error: error.message || 'Failed to update detail'
        });
        observer.complete();
      }
    });
  }

  deleteDetail(groupIndex: number, cardIndex: number, detailIndex: number): Observable<DetailActionResult> {
    return new Observable(observer => {
      try {
        const card = this.cardDataService.getCard(groupIndex, cardIndex);
        if (!card || detailIndex >= card.details.length) {
          observer.next({
            success: false,
            error: 'Detail not found'
          });
          observer.complete();
          return;
        }

        // Check if this is the last detail
        if (card.details.length <= 1) {
          observer.next({
            success: false,
            error: 'Cannot delete the last detail'
          });
          observer.complete();
          return;
        }

        const detail = card.details[detailIndex];
        const success = this.cardDataService.removeDetail(groupIndex, cardIndex, detailIndex);
        
        if (success) {
          observer.next({
            success: true,
            detail,
            detailIndex
          });
        } else {
          observer.next({
            success: false,
            error: 'Failed to delete detail'
          });
        }
        
        observer.complete();
      } catch (error: any) {
        observer.next({
          success: false,
          error: error.message || 'Failed to delete detail'
        });
        observer.complete();
      }
    });
  }

  validateDetail(detail: CardDetail): Observable<ValidationResult> {
    return new Observable(observer => {
      try {
        const validation = this.cardValidationService.validateDetail(detail);
        observer.next(validation);
        observer.complete();
      } catch (error: any) {
        observer.next({
          isValid: false,
          errors: [error.message || 'Validation failed']
        });
        observer.complete();
      }
    });
  }

  validateDetailName(name: string, groupIndex: number, cardIndex: number, excludeDetailIndex?: number): Observable<ValidationResult> {
    return new Observable(observer => {
      try {
        const card = this.cardDataService.getCard(groupIndex, cardIndex);
        if (!card) {
          observer.next({
            isValid: false,
            errors: ['Card not found']
          });
          observer.complete();
          return;
        }

        const existingNames = card.details
          .map((detail, index) => index === excludeDetailIndex ? null : detail.name.toLowerCase().trim())
          .filter(name => name !== null) as string[];

        const validation = this.cardValidationService.validateDetailName(name, existingNames);
        observer.next(validation);
        observer.complete();
      } catch (error: any) {
        observer.next({
          isValid: false,
          errors: [error.message || 'Validation failed']
        });
        observer.complete();
      }
    });
  }

  updateDetailName(groupIndex: number, cardIndex: number, detailIndex: number, name: string): Observable<DetailActionResult> {
    return new Observable(observer => {
      this.validateDetailName(name, groupIndex, cardIndex, detailIndex).subscribe(validation => {
        if (!validation.isValid) {
          observer.next({
            success: false,
            error: 'Detail name validation failed',
            validationErrors: validation.errors
          });
          observer.complete();
          return;
        }

        const sanitizedName = this.cardValidationService.sanitizeDetailName(name);
        this.updateDetail(groupIndex, cardIndex, detailIndex, { name: sanitizedName }).subscribe(result => {
          observer.next(result);
          observer.complete();
        });
      });
    });
  }

  updateDetailDescription(groupIndex: number, cardIndex: number, detailIndex: number, details: string): Observable<DetailActionResult> {
    return this.updateDetail(groupIndex, cardIndex, detailIndex, { details });
  }

  updateDetailCosts(groupIndex: number, cardIndex: number, detailIndex: number, apCost: number, spCost: number): Observable<DetailActionResult> {
    return new Observable(observer => {
      // Validate costs
      const costValidation = this.cardValidationService.validateCosts(apCost, spCost);
      if (!costValidation.isValid) {
        observer.next({
          success: false,
          error: 'Cost validation failed',
          validationErrors: costValidation.errors
        });
        observer.complete();
        return;
      }

      this.updateDetail(groupIndex, cardIndex, detailIndex, { apCost, spCost }).subscribe(result => {
        observer.next(result);
        observer.complete();
      });
    });
  }

  moveDetail(groupIndex: number, cardIndex: number, fromIndex: number, toIndex: number): Observable<DetailActionResult> {
    return new Observable(observer => {
      try {
        const card = this.cardDataService.getCard(groupIndex, cardIndex);
        if (!card || fromIndex >= card.details.length || toIndex >= card.details.length) {
          observer.next({
            success: false,
            error: 'Invalid detail indices'
          });
          observer.complete();
          return;
        }

        const detailToMove = card.details[fromIndex];
        const updatedDetails = [...card.details];
        
        // Remove from source position
        updatedDetails.splice(fromIndex, 1);
        
        // Insert at destination position
        updatedDetails.splice(toIndex, 0, detailToMove);
        
        const success = this.cardDataService.updateCard(groupIndex, cardIndex, { details: updatedDetails });
        
        if (success) {
          observer.next({
            success: true,
            detail: detailToMove,
            detailIndex: toIndex
          });
        } else {
          observer.next({
            success: false,
            error: 'Failed to move detail'
          });
        }
        
        observer.complete();
      } catch (error: any) {
        observer.next({
          success: false,
          error: error.message || 'Failed to move detail'
        });
        observer.complete();
      }
    });
  }

  getDetailsByName(name: string): Array<{
    detail: CardDetail;
    groupIndex: number;
    cardIndex: number;
    detailIndex: number;
  }> {
    const results: Array<{
      detail: CardDetail;
      groupIndex: number;
      cardIndex: number;
      detailIndex: number;
    }> = [];

    const cardData = this.cardDataService.currentCardData;
    const lowerName = name.toLowerCase();

    cardData.groups.forEach((group, groupIndex) => {
      group.cards.forEach((card, cardIndex) => {
        card.details.forEach((detail, detailIndex) => {
          if (detail.name.toLowerCase().includes(lowerName)) {
            results.push({
              detail,
              groupIndex,
              cardIndex,
              detailIndex
            });
          }
        });
      });
    });

    return results;
  }

  getDetailStatistics(groupIndex: number, cardIndex: number): {
    totalDetails: number;
    totalAPCost: number;
    totalSPCost: number;
    averageAPCost: number;
    averageSPCost: number;
    mostExpensiveDetail: CardDetail | null;
    cheapestDetail: CardDetail | null;
  } | null {
    const card = this.cardDataService.getCard(groupIndex, cardIndex);
    if (!card) return null;

    const details = card.details;
    const totalAPCost = details.reduce((sum, detail) => sum + detail.apCost, 0);
    const totalSPCost = details.reduce((sum, detail) => sum + detail.spCost, 0);

    let mostExpensive = details[0];
    let cheapest = details[0];

    details.forEach(detail => {
      const totalCost = detail.apCost + detail.spCost;
      const mostExpensiveCost = mostExpensive.apCost + mostExpensive.spCost;
      const cheapestCost = cheapest.apCost + cheapest.spCost;

      if (totalCost > mostExpensiveCost) {
        mostExpensive = detail;
      }
      if (totalCost < cheapestCost) {
        cheapest = detail;
      }
    });

    return {
      totalDetails: details.length,
      totalAPCost,
      totalSPCost,
      averageAPCost: details.length > 0 ? totalAPCost / details.length : 0,
      averageSPCost: details.length > 0 ? totalSPCost / details.length : 0,
      mostExpensiveDetail: mostExpensive,
      cheapestDetail: cheapest
    };
  }

  bulkUpdateCosts(groupIndex: number, cardIndex: number, costMultiplier: number): Observable<DetailActionResult[]> {
    return new Observable(observer => {
      try {
        const card = this.cardDataService.getCard(groupIndex, cardIndex);
        if (!card) {
          observer.next([{
            success: false,
            error: 'Card not found'
          }]);
          observer.complete();
          return;
        }

        const results: DetailActionResult[] = [];
        const updatedDetails = card.details.map((detail, index) => {
          const newAPCost = Math.round(detail.apCost * costMultiplier);
          const newSPCost = Math.round(detail.spCost * costMultiplier);

          // Validate new costs
          const costValidation = this.cardValidationService.validateCosts(newAPCost, newSPCost);
          if (costValidation.isValid) {
            const updatedDetail = { ...detail, apCost: newAPCost, spCost: newSPCost };
            results.push({
              success: true,
              detail: updatedDetail,
              detailIndex: index
            });
            return updatedDetail;
          } else {
            results.push({
              success: false,
              detailIndex: index,
              error: 'Cost validation failed',
              validationErrors: costValidation.errors
            });
            return detail; // Keep original if validation fails
          }
        });

        const success = this.cardDataService.updateCard(groupIndex, cardIndex, { details: updatedDetails });
        
        if (!success) {
          results.forEach(result => {
            if (result.success) result.success = false;
            if (result.success === false && !result.error) result.error = 'Failed to save changes';
          });
        }

        observer.next(results);
        observer.complete();
      } catch (error: any) {
        observer.next([{
          success: false,
          error: error.message || 'Failed to bulk update costs'
        }]);
        observer.complete();
      }
    });
  }
}
