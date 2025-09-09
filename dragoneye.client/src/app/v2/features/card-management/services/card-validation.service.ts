// Card validation service

import { Injectable } from '@angular/core';

import { Card, CardDetail, CardGroup, ValidationResult, CardValidationRules } from '../../../core/models/card.model';
import { ElementService } from './element.service';

@Injectable({
  providedIn: 'root'
})
export class CardValidationService {
  private readonly defaultRules: CardValidationRules = {
    titleRequired: true,
    titleMaxLength: 100,
    typeRequired: true,
    elementRequired: true,
    detailsMinCount: 1,
    detailsMaxCount: 10
  };

  constructor(private elementService: ElementService) {}

  validateCard(card: Card, rules: Partial<CardValidationRules> = {}): ValidationResult {
    const validationRules = { ...this.defaultRules, ...rules };
    const errors: string[] = [];

    // Validate title
    if (validationRules.titleRequired && (!card.title || card.title.trim().length === 0)) {
      errors.push('Card title is required');
    }

    if (card.title && card.title.length > validationRules.titleMaxLength) {
      errors.push(`Card title must be ${validationRules.titleMaxLength} characters or less`);
    }

    // Validate type
    if (validationRules.typeRequired && (!card.type || card.type.trim().length === 0)) {
      errors.push('Card type is required');
    }

    if (card.type && !this.isValidCardType(card.type)) {
      errors.push('Invalid card type');
    }

    // Validate element
    if (validationRules.elementRequired && (!card.element || card.element.trim().length === 0)) {
      errors.push('Card element is required');
    }

    if (card.element && !this.elementService.isValidElement(card.element)) {
      const suggestion = this.elementService.validateElementKey(card.element).suggestion;
      errors.push(`Invalid element: ${card.element}${suggestion ? `. Did you mean "${suggestion}"?` : ''}`);
    }

    // Validate details
    if (!card.details || !Array.isArray(card.details)) {
      errors.push('Card details must be an array');
    } else {
      if (card.details.length < validationRules.detailsMinCount) {
        errors.push(`Card must have at least ${validationRules.detailsMinCount} detail(s)`);
      }

      if (card.details.length > validationRules.detailsMaxCount) {
        errors.push(`Card cannot have more than ${validationRules.detailsMaxCount} details`);
      }

      // Validate each detail
      card.details.forEach((detail, index) => {
        const detailErrors = this.validateDetail(detail);
        if (!detailErrors.isValid) {
          detailErrors.errors.forEach(error => {
            errors.push(`Detail ${index + 1}: ${error}`);
          });
        }
      });
    }

    // Validate background image URL if present
    if (card.backgroundImage && !this.isValidImageUrl(card.backgroundImage)) {
      errors.push('Invalid background image URL');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  validateDetail(detail: CardDetail): ValidationResult {
    const errors: string[] = [];

    // Validate name
    if (!detail.name || detail.name.trim().length === 0) {
      errors.push('Detail name is required');
    }

    if (detail.name && detail.name.length > 50) {
      errors.push('Detail name must be 50 characters or less');
    }

    // Validate description
    if (!detail.details || detail.details.trim().length === 0) {
      errors.push('Detail description is required');
    }

    if (detail.details && detail.details.length > 500) {
      errors.push('Detail description must be 500 characters or less');
    }

    // Validate costs
    if (typeof detail.apCost !== 'number' || detail.apCost < 0) {
      errors.push('AP cost must be a non-negative number');
    }

    if (typeof detail.spCost !== 'number' || detail.spCost < 0) {
      errors.push('SP cost must be a non-negative number');
    }

    if (detail.apCost > 99) {
      errors.push('AP cost cannot exceed 99');
    }

    if (detail.spCost > 99) {
      errors.push('SP cost cannot exceed 99');
    }

    // Validate that at least one cost is non-zero
    if (detail.apCost === 0 && detail.spCost === 0) {
      errors.push('At least one cost (AP or SP) must be greater than 0');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  validateGroup(group: CardGroup): ValidationResult {
    const errors: string[] = [];

    // Validate name
    if (!group.name || group.name.trim().length === 0) {
      errors.push('Group name is required');
    }

    if (group.name && group.name.length > 100) {
      errors.push('Group name must be 100 characters or less');
    }

    // Validate cards array
    if (!group.cards || !Array.isArray(group.cards)) {
      errors.push('Group cards must be an array');
    } else {
      // Validate each card in the group
      group.cards.forEach((card, index) => {
        const cardErrors = this.validateCard(card);
        if (!cardErrors.isValid) {
          cardErrors.errors.forEach(error => {
            errors.push(`Card ${index + 1}: ${error}`);
          });
        }
      });

      // Check for duplicate card titles within the group
      const cardTitles = group.cards.map(card => card.title.toLowerCase().trim());
      const duplicates = cardTitles.filter((title, index) => cardTitles.indexOf(title) !== index);
      if (duplicates.length > 0) {
        errors.push(`Duplicate card titles found: ${[...new Set(duplicates)].join(', ')}`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  validateCardTitle(title: string, existingTitles: string[] = []): ValidationResult {
    const errors: string[] = [];

    if (!title || title.trim().length === 0) {
      errors.push('Card title is required');
    }

    if (title && title.length > 100) {
      errors.push('Card title must be 100 characters or less');
    }

    // Check for invalid characters
    const invalidChars = /[<>:"\/\\|?*]/;
    if (title && invalidChars.test(title)) {
      errors.push('Card title contains invalid characters');
    }

    // Check for duplicates
    if (title && existingTitles.includes(title.toLowerCase().trim())) {
      errors.push('Card title must be unique');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  validateDetailName(name: string, existingNames: string[] = []): ValidationResult {
    const errors: string[] = [];

    if (!name || name.trim().length === 0) {
      errors.push('Detail name is required');
    }

    if (name && name.length > 50) {
      errors.push('Detail name must be 50 characters or less');
    }

    // Check for duplicates within the same card
    if (name && existingNames.includes(name.toLowerCase().trim())) {
      errors.push('Detail name must be unique within the card');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  validateCosts(apCost: number, spCost: number): ValidationResult {
    const errors: string[] = [];

    if (typeof apCost !== 'number' || apCost < 0 || apCost > 99) {
      errors.push('AP cost must be between 0 and 99');
    }

    if (typeof spCost !== 'number' || spCost < 0 || spCost > 99) {
      errors.push('SP cost must be between 0 and 99');
    }

    if (apCost === 0 && spCost === 0) {
      errors.push('At least one cost (AP or SP) must be greater than 0');
    }

    // Warn if costs are very high
    if (apCost + spCost > 20) {
      errors.push('Total cost is very high - consider balancing');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  private isValidCardType(type: string): boolean {
    const validTypes = ['Action', 'Passive', 'Spell', 'Equipment', 'Ritual'];
    return validTypes.includes(type);
  }

  private isValidImageUrl(url: string): boolean {
    if (!url) return true; // Empty URL is valid (no image)

    try {
      new URL(url);
      // Check if it looks like an image URL
      const imageExtensions = /\.(jpg|jpeg|png|gif|webp|svg)(\?.*)?$/i;
      const isDataUrl = url.startsWith('data:image/');
      return imageExtensions.test(url) || isDataUrl;
    } catch {
      return false;
    }
  }

  getValidCardTypes(): string[] {
    return ['Action', 'Passive', 'Spell', 'Equipment', 'Ritual'];
  }

  sanitizeCardTitle(title: string): string {
    return title
      .replace(/[<>:"\/\\|?*]/g, '_')
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 100);
  }

  sanitizeDetailName(name: string): string {
    return name
      .replace(/[<>:"\/\\|?*]/g, '_')
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 50);
  }

  getCardComplexityScore(card: Card): number {
    let score = 0;
    
    // Base score for existing
    score += 1;
    
    // Score for details
    score += card.details.length * 2;
    
    // Score for costs
    card.details.forEach(detail => {
      score += detail.apCost + detail.spCost;
    });
    
    // Score for description length
    card.details.forEach(detail => {
      score += Math.ceil(detail.details.length / 50);
    });
    
    return score;
  }

  suggestBalanceChanges(card: Card): string[] {
    const suggestions: string[] = [];
    const totalCost = card.details.reduce((sum, detail) => sum + detail.apCost + detail.spCost, 0);
    const complexityScore = this.getCardComplexityScore(card);
    
    if (totalCost < complexityScore / 2) {
      suggestions.push('Consider increasing costs - card appears undercosted');
    }
    
    if (totalCost > complexityScore * 2) {
      suggestions.push('Consider decreasing costs - card appears overcosted');
    }
    
    if (card.details.length > 5) {
      suggestions.push('Consider consolidating details - card may be too complex');
    }
    
    return suggestions;
  }
}
