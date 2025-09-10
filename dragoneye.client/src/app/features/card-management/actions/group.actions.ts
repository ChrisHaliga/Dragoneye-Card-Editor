import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { CardGroup, ValidationResult } from '../../../core/models/card.model';
import { CardDataService } from '../services/card-data.service';
import { CardValidationService } from '../services/card-validation.service';

export interface GroupActionResult {
  success: boolean;
  group?: CardGroup;
  groupIndex?: number;
  error?: string;
  validationErrors?: string[];
}

@Injectable({
  providedIn: 'root'
})
export class GroupActions {

  constructor(
    private cardDataService: CardDataService,
    private cardValidationService: CardValidationService
  ) {}

  createGroup(name: string = 'New Group'): Observable<GroupActionResult> {
    return new Observable(observer => {
      try {
        // Validate group name
        const existingNames = this.getExistingGroupNames();
        const validation = this.validateGroupName(name, existingNames);
        
        if (!validation.isValid) {
          observer.next({
            success: false,
            error: 'Group name validation failed',
            validationErrors: validation.errors
          });
          observer.complete();
          return;
        }

        const sanitizedName = this.sanitizeGroupName(name);
        const createdGroup = this.cardDataService.addGroup(sanitizedName);
        const groupIndex = this.cardDataService.getGroupCount() - 1;
        
        if (createdGroup) {
          observer.next({
            success: true,
            group: createdGroup,
            groupIndex
          });
        } else {
          observer.next({
            success: false,
            error: 'Failed to create group'
          });
        }
        
        observer.complete();
      } catch (error: any) {
        observer.next({
          success: false,
          error: error.message || 'Failed to create group'
        });
        observer.complete();
      }
    });
  }

  duplicateGroup(groupIndex: number): Observable<GroupActionResult> {
    return new Observable(observer => {
      try {
        const originalGroup = this.cardDataService.getGroup(groupIndex);
        if (!originalGroup) {
          observer.next({
            success: false,
            error: 'Group not found'
          });
          observer.complete();
          return;
        }

        const duplicatedGroup = this.cardDataService.duplicateGroup(groupIndex);
        
        if (duplicatedGroup) {
          const newGroupIndex = groupIndex + 1;
          observer.next({
            success: true,
            group: duplicatedGroup,
            groupIndex: newGroupIndex
          });
        } else {
          observer.next({
            success: false,
            error: 'Failed to duplicate group'
          });
        }
        
        observer.complete();
      } catch (error: any) {
        observer.next({
          success: false,
          error: error.message || 'Failed to duplicate group'
        });
        observer.complete();
      }
    });
  }

  updateGroup(groupIndex: number, updates: Partial<CardGroup>): Observable<GroupActionResult> {
    return new Observable(observer => {
      try {
        const currentGroup = this.cardDataService.getGroup(groupIndex);
        if (!currentGroup) {
          observer.next({
            success: false,
            error: 'Group not found'
          });
          observer.complete();
          return;
        }

        // If updating name, validate it
        if (updates.name !== undefined) {
          const existingNames = this.getExistingGroupNames(groupIndex);
          const validation = this.validateGroupName(updates.name, existingNames);
          
          if (!validation.isValid) {
            observer.next({
              success: false,
              error: 'Group name validation failed',
              validationErrors: validation.errors
            });
            observer.complete();
            return;
          }

          updates.name = this.sanitizeGroupName(updates.name);
        }

        const success = this.cardDataService.updateGroup(groupIndex, updates);
        
        if (success) {
          const updatedGroup = this.cardDataService.getGroup(groupIndex);
          observer.next({
            success: true,
            group: updatedGroup || undefined,
            groupIndex
          });
        } else {
          observer.next({
            success: false,
            error: 'Failed to update group'
          });
        }
        
        observer.complete();
      } catch (error: any) {
        observer.next({
          success: false,
          error: error.message || 'Failed to update group'
        });
        observer.complete();
      }
    });
  }

  deleteGroup(groupIndex: number): Observable<GroupActionResult> {
    return new Observable(observer => {
      try {
        // Check if this is the last group
        if (this.cardDataService.getGroupCount() <= 1) {
          observer.next({
            success: false,
            error: 'Cannot delete the last group'
          });
          observer.complete();
          return;
        }

        const group = this.cardDataService.getGroup(groupIndex);
        if (!group) {
          observer.next({
            success: false,
            error: 'Group not found'
          });
          observer.complete();
          return;
        }

        const success = this.cardDataService.removeGroup(groupIndex);
        
        if (success) {
          observer.next({
            success: true,
            group,
            groupIndex
          });
        } else {
          observer.next({
            success: false,
            error: 'Failed to delete group'
          });
        }
        
        observer.complete();
      } catch (error: any) {
        observer.next({
          success: false,
          error: error.message || 'Failed to delete group'
        });
        observer.complete();
      }
    });
  }

  toggleGroupExpansion(groupIndex: number): Observable<GroupActionResult> {
    return new Observable(observer => {
      try {
        const group = this.cardDataService.getGroup(groupIndex);
        if (!group) {
          observer.next({
            success: false,
            error: 'Group not found'
          });
          observer.complete();
          return;
        }

        const success = this.cardDataService.toggleGroupExpansion(groupIndex);
        
        if (success) {
          const updatedGroup = this.cardDataService.getGroup(groupIndex);
          observer.next({
            success: true,
            group: updatedGroup || undefined,
            groupIndex
          });
        } else {
          observer.next({
            success: false,
            error: 'Failed to toggle group expansion'
          });
        }
        
        observer.complete();
      } catch (error: any) {
        observer.next({
          success: false,
          error: error.message || 'Failed to toggle group expansion'
        });
        observer.complete();
      }
    });
  }

  updateGroupName(groupIndex: number, name: string): Observable<GroupActionResult> {
    return this.updateGroup(groupIndex, { name });
  }

  expandGroup(groupIndex: number): Observable<GroupActionResult> {
    return this.updateGroup(groupIndex, { expanded: true });
  }

  collapseGroup(groupIndex: number): Observable<GroupActionResult> {
    return this.updateGroup(groupIndex, { expanded: false });
  }

  expandAllGroups(): Observable<GroupActionResult[]> {
    return new Observable(observer => {
      const results: GroupActionResult[] = [];
      const groupCount = this.cardDataService.getGroupCount();
      
      for (let i = 0; i < groupCount; i++) {
        const success = this.cardDataService.updateGroup(i, { expanded: true });
        const group = this.cardDataService.getGroup(i);
        
        results.push({
          success,
          group: group || undefined,
          groupIndex: i,
          error: success ? undefined : 'Failed to expand group'
        });
      }
      
      observer.next(results);
      observer.complete();
    });
  }

  collapseAllGroups(): Observable<GroupActionResult[]> {
    return new Observable(observer => {
      const results: GroupActionResult[] = [];
      const groupCount = this.cardDataService.getGroupCount();
      
      for (let i = 0; i < groupCount; i++) {
        const success = this.cardDataService.updateGroup(i, { expanded: false });
        const group = this.cardDataService.getGroup(i);
        
        results.push({
          success,
          group: group || undefined,
          groupIndex: i,
          error: success ? undefined : 'Failed to collapse group'
        });
      }
      
      observer.next(results);
      observer.complete();
    });
  }

  validateGroup(groupIndex: number): Observable<ValidationResult> {
    return new Observable(observer => {
      try {
        const group = this.cardDataService.getGroup(groupIndex);
        if (!group) {
          observer.next({
            isValid: false,
            errors: ['Group not found']
          });
          observer.complete();
          return;
        }

        const validation = this.cardValidationService.validateGroup(group);
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

  moveGroup(fromIndex: number, toIndex: number): Observable<GroupActionResult> {
    return new Observable(observer => {
      try {
        const groups = this.cardDataService.currentCardData.groups;
        
        if (fromIndex < 0 || fromIndex >= groups.length || toIndex < 0 || toIndex >= groups.length) {
          observer.next({
            success: false,
            error: 'Invalid group indices'
          });
          observer.complete();
          return;
        }

        const groupToMove = groups[fromIndex];
        const updatedGroups = [...groups];
        
        // Remove from source position
        updatedGroups.splice(fromIndex, 1);
        
        // Insert at destination position
        updatedGroups.splice(toIndex, 0, groupToMove);
        
        const updatedData = { ...this.cardDataService.currentCardData };
        updatedData.groups = updatedGroups;
        this.cardDataService.updateCardData(updatedData);
        
        observer.next({
          success: true,
          group: groupToMove,
          groupIndex: toIndex
        });
        observer.complete();
      } catch (error: any) {
        observer.next({
          success: false,
          error: error.message || 'Failed to move group'
        });
        observer.complete();
      }
    });
  }

  getGroupStatistics(groupIndex: number): {
    cardCount: number;
    totalComplexity: number;
    averageComplexity: number;
    elementDistribution: { [element: string]: number };
    typeDistribution: { [type: string]: number };
  } | null {
    const group = this.cardDataService.getGroup(groupIndex);
    if (!group) return null;

    const elementDistribution: { [element: string]: number } = {};
    const typeDistribution: { [type: string]: number } = {};
    let totalComplexity = 0;

    group.cards.forEach(card => {
      // Count elements
      elementDistribution[card.element] = (elementDistribution[card.element] || 0) + 1;
      
      // Count types
      typeDistribution[card.type] = (typeDistribution[card.type] || 0) + 1;
      
      // Sum complexity
      totalComplexity += this.cardValidationService.getCardComplexityScore(card);
    });

    return {
      cardCount: group.cards.length,
      totalComplexity,
      averageComplexity: group.cards.length > 0 ? totalComplexity / group.cards.length : 0,
      elementDistribution,
      typeDistribution
    };
  }

  private validateGroupName(name: string, existingNames: string[] = []): ValidationResult {
    const errors: string[] = [];

    if (!name || name.trim().length === 0) {
      errors.push('Group name is required');
    }

    if (name && name.length > 100) {
      errors.push('Group name must be 100 characters or less');
    }

    // Check for invalid characters
    const invalidChars = /[<>:"\/\\|?*]/;
    if (name && invalidChars.test(name)) {
      errors.push('Group name contains invalid characters');
    }

    // Check for duplicates
    if (name && existingNames.includes(name.toLowerCase().trim())) {
      errors.push('Group name must be unique');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  private sanitizeGroupName(name: string): string {
    return name
      .replace(/[<>:"\/\\|?*]/g, '_')
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 100);
  }

  private getExistingGroupNames(excludeIndex?: number): string[] {
    return this.cardDataService.currentCardData.groups
      .map((group, index) => index === excludeIndex ? null : group.name.toLowerCase().trim())
      .filter(name => name !== null) as string[];
  }
}
