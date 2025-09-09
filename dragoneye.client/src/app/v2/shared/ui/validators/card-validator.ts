import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { Card, CardDetail, CardGroup, ValidationResult } from '../../../core/models/card.model';

@Injectable({
  providedIn: 'root'
})
export class CardValidator {
  
  /**
   * Validate a complete card
   */
  validateCard(card: Card): ValidationResult {
    const errors: string[] = [];

    // Title validation
    if (!card.title || card.title.trim().length === 0) {
      errors.push('Card title is required');
    } else if (card.title.length > 100) {
      errors.push('Card title must be 100 characters or less');
    }

    // Type validation
    if (!card.type || card.type.trim().length === 0) {
      errors.push('Card type is required');
    }

    // Element validation
    if (!card.element || card.element.trim().length === 0) {
      errors.push('Card element is required');
    }

    // Details validation
    if (!card.details || !Array.isArray(card.details)) {
      errors.push('Card must have details array');
    } else {
      if (card.details.length === 0) {
        errors.push('Card must have at least one detail');
      }

      card.details.forEach((detail, index) => {
        const detailValidation = this.validateDetail(detail);
        if (!detailValidation.isValid) {
          detailValidation.errors.forEach(error => {
            errors.push(`Detail ${index + 1}: ${error}`);
          });
        }
      });
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate a card detail
   */
  validateDetail(detail: CardDetail): ValidationResult {
    const errors: string[] = [];

    // Name validation
    if (!detail.name || detail.name.trim().length === 0) {
      errors.push('Detail name is required');
    } else if (detail.name.length > 50) {
      errors.push('Detail name must be 50 characters or less');
    }

    // Description validation
    if (!detail.details || detail.details.trim().length === 0) {
      errors.push('Detail description is required');
    } else if (detail.details.length > 500) {
      errors.push('Detail description must be 500 characters or less');
    }

    // Cost validation
    if (typeof detail.apCost !== 'number' || detail.apCost < 0) {
      errors.push('AP cost must be a non-negative number');
    } else if (detail.apCost > 99) {
      errors.push('AP cost cannot exceed 99');
    }

    if (typeof detail.spCost !== 'number' || detail.spCost < 0) {
      errors.push('SP cost must be a non-negative number');
    } else if (detail.spCost > 99) {
      errors.push('SP cost cannot exceed 99');
    }

    // At least one cost must be non-zero
    if (detail.apCost === 0 && detail.spCost === 0) {
      errors.push('At least one cost (AP or SP) must be greater than 0');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate a card group
   */
  validateGroup(group: CardGroup): ValidationResult {
    const errors: string[] = [];

    // Name validation
    if (!group.name || group.name.trim().length === 0) {
      errors.push('Group name is required');
    } else if (group.name.length > 100) {
      errors.push('Group name must be 100 characters or less');
    }

    // Cards validation
    if (!group.cards || !Array.isArray(group.cards)) {
      errors.push('Group must have cards array');
    } else {
      group.cards.forEach((card, index) => {
        const cardValidation = this.validateCard(card);
        if (!cardValidation.isValid) {
          cardValidation.errors.forEach(error => {
            errors.push(`Card ${index + 1}: ${error}`);
          });
        }
      });
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate card title uniqueness within group
   */
  validateCardTitleUniqueness(title: string, cards: Card[], excludeIndex?: number): ValidationResult {
    const errors: string[] = [];
    const lowerTitle = title.toLowerCase().trim();

    const duplicateIndex = cards.findIndex((card, index) => 
      index !== excludeIndex && card.title.toLowerCase().trim() === lowerTitle
    );

    if (duplicateIndex !== -1) {
      errors.push('Card title must be unique within the group');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate detail name uniqueness within card
   */
  validateDetailNameUniqueness(name: string, details: CardDetail[], excludeIndex?: number): ValidationResult {
    const errors: string[] = [];
    const lowerName = name.toLowerCase().trim();

    const duplicateIndex = details.findIndex((detail, index) => 
      index !== excludeIndex && detail.name.toLowerCase().trim() === lowerName
    );

    if (duplicateIndex !== -1) {
      errors.push('Detail name must be unique within the card');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate group name uniqueness
   */
  validateGroupNameUniqueness(name: string, groups: CardGroup[], excludeIndex?: number): ValidationResult {
    const errors: string[] = [];
    const lowerName = name.toLowerCase().trim();

    const duplicateIndex = groups.findIndex((group, index) => 
      index !== excludeIndex && group.name.toLowerCase().trim() === lowerName
    );

    if (duplicateIndex !== -1) {
      errors.push('Group name must be unique');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate costs are within reasonable balance
   */
  validateCostBalance(apCost: number, spCost: number): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    const totalCost = apCost + spCost;

    // Balance warnings
    if (totalCost > 20) {
      warnings.push('Total cost is very high - consider balancing');
    } else if (totalCost === 1 && apCost === 1 && spCost === 0) {
      // This is often default, might be fine
    } else if (totalCost < 1) {
      warnings.push('Total cost is very low - consider increasing');
    }

    // Ratio warnings
    if (apCost > 0 && spCost > 0) {
      const ratio = Math.max(apCost, spCost) / Math.min(apCost, spCost);
      if (ratio > 5) {
        warnings.push('Cost ratio is unbalanced');
      }
    }

    return {
      isValid: errors.length === 0,
      errors: [...errors, ...warnings]
    };
  }

  /**
   * Quick validation for real-time feedback
   */
  quickValidateField(fieldName: string, value: any): ValidationResult {
    const errors: string[] = [];

    switch (fieldName) {
      case 'title':
        if (!value || value.trim().length === 0) {
          errors.push('Title is required');
        } else if (value.length > 100) {
          errors.push('Title is too long');
        }
        break;

      case 'detailName':
        if (!value || value.trim().length === 0) {
          errors.push('Detail name is required');
        } else if (value.length > 50) {
          errors.push('Detail name is too long');
        }
        break;

      case 'detailDescription':
        if (!value || value.trim().length === 0) {
          errors.push('Description is required');
        } else if (value.length > 500) {
          errors.push('Description is too long');
        }
        break;

      case 'apCost':
      case 'spCost':
        if (typeof value !== 'number' || value < 0) {
          errors.push('Cost must be a non-negative number');
        } else if (value > 99) {
          errors.push('Cost cannot exceed 99');
        }
        break;

      case 'groupName':
        if (!value || value.trim().length === 0) {
          errors.push('Group name is required');
        } else if (value.length > 100) {
          errors.push('Group name is too long');
        }
        break;
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Sanitize text input
   */
  sanitizeText(text: string, maxLength?: number): string {
    if (!text) return '';
    
    let sanitized = text
      .replace(/[<>:"\/\\|?*]/g, '_') // Remove invalid characters
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();

    if (maxLength) {
      sanitized = sanitized.substring(0, maxLength);
    }

    return sanitized;
  }

  /**
   * Check if card data structure is valid
   */
  validateCardDataStructure(data: any): ValidationResult {
    const errors: string[] = [];

    if (!data) {
      errors.push('Data is required');
      return { isValid: false, errors };
    }

    if (!data.hasOwnProperty('filename')) {
      errors.push('Missing filename property');
    }

    if (!data.hasOwnProperty('groups')) {
      errors.push('Missing groups property');
    } else if (!Array.isArray(data.groups)) {
      errors.push('Groups must be an array');
    } else {
      data.groups.forEach((group: any, groupIndex: number) => {
        if (!group.hasOwnProperty('name')) {
          errors.push(`Group ${groupIndex}: Missing name property`);
        }
        if (!group.hasOwnProperty('cards')) {
          errors.push(`Group ${groupIndex}: Missing cards property`);
        } else if (!Array.isArray(group.cards)) {
          errors.push(`Group ${groupIndex}: Cards must be an array`);
        }
      });
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Get validation summary for entire card set
   */
  validateCardSet(data: any): {
    isValid: boolean;
    totalErrors: number;
    totalWarnings: number;
    summary: string[];
    details: { [key: string]: ValidationResult };
  } {
    const details: { [key: string]: ValidationResult } = {};
    let totalErrors = 0;
    let totalWarnings = 0;
    const summary: string[] = [];

    // Structure validation
    const structureValidation = this.validateCardDataStructure(data);
    details['structure'] = structureValidation;
    if (!structureValidation.isValid) {
      totalErrors += structureValidation.errors.length;
      summary.push(`Structure: ${structureValidation.errors.length} errors`);
      return {
        isValid: false,
        totalErrors,
        totalWarnings,
        summary,
        details
      };
    }

    // Group validations
    if (data.groups && Array.isArray(data.groups)) {
      data.groups.forEach((group: any, groupIndex: number) => {
        const groupValidation = this.validateGroup(group);
        details[`group_${groupIndex}`] = groupValidation;
        
        if (!groupValidation.isValid) {
          totalErrors += groupValidation.errors.length;
        }
      });
    }

    const isValid = totalErrors === 0;
    summary.push(`${data.groups?.length || 0} groups validated`);
    summary.push(`${totalErrors} errors found`);
    summary.push(`${totalWarnings} warnings found`);

    return {
      isValid,
      totalErrors,
      totalWarnings,
      summary,
      details
    };
  }
}
