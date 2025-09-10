import { ValidationResult } from '../../../core/models/card.model';

export class FileValidator {
  
  static validateJsonFile(file: File): ValidationResult {
    const errors: string[] = [];

    if (!file) {
      errors.push('No file provided');
      return { isValid: false, errors };
    }

    // Check file type
    if (!file.type.includes('json') && !file.name.toLowerCase().endsWith('.json')) {
      errors.push('File must be a JSON file (.json)');
    }

    // Check file size (10MB limit)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      errors.push(`File size must be less than ${maxSize / (1024 * 1024)}MB`);
    }

    // Check if file is empty
    if (file.size === 0) {
      errors.push('File cannot be empty');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  static validateImageFile(file: File): ValidationResult {
    const errors: string[] = [];

    if (!file) {
      errors.push('No file provided');
      return { isValid: false, errors };
    }

    // Check if it's an image
    if (!file.type.startsWith('image/')) {
      errors.push('File must be an image');
    }

    // Check supported formats
    const supportedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
    if (!supportedTypes.includes(file.type)) {
      errors.push('Supported image formats: JPEG, PNG, GIF, WebP, SVG');
    }

    // Check file size (5MB limit for images)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      errors.push(`Image size must be less than ${maxSize / (1024 * 1024)}MB`);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  static validateExportFile(filename: string, format: string): ValidationResult {
    const errors: string[] = [];

    if (!filename || filename.trim().length === 0) {
      errors.push('Filename cannot be empty');
    }

    if (filename.length > 255) {
      errors.push('Filename is too long (max 255 characters)');
    }

    // Check for invalid characters
    const invalidChars = /[<>:"/\\|?*]/;
    if (invalidChars.test(filename)) {
      errors.push('Filename contains invalid characters: < > : " / \\ | ? *');
    }

    // Check format-specific requirements
    const allowedFormats = ['json', 'svg', 'pdf'];
    if (!allowedFormats.includes(format.toLowerCase())) {
      errors.push(`Unsupported export format: ${format}`);
    }

    // Ensure proper file extension
    const expectedExtension = `.${format.toLowerCase()}`;
    if (!filename.toLowerCase().endsWith(expectedExtension)) {
      errors.push(`Filename must end with ${expectedExtension}`);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  static validateCardDataFile(content: string): ValidationResult {
    const errors: string[] = [];

    try {
      const data = JSON.parse(content);

      // Check required properties
      if (!data.hasOwnProperty('filename')) {
        errors.push('Missing required property: filename');
      }

      if (!data.hasOwnProperty('groups')) {
        errors.push('Missing required property: groups');
      }

      if (!Array.isArray(data.groups)) {
        errors.push('Groups must be an array');
      }

      // Validate groups structure
      if (Array.isArray(data.groups)) {
        data.groups.forEach((group: any, groupIndex: number) => {
          if (!group.hasOwnProperty('name')) {
            errors.push(`Group ${groupIndex}: Missing required property: name`);
          }

          if (!group.hasOwnProperty('cards')) {
            errors.push(`Group ${groupIndex}: Missing required property: cards`);
          }

          if (!Array.isArray(group.cards)) {
            errors.push(`Group ${groupIndex}: Cards must be an array`);
          }

          // Validate cards structure
          if (Array.isArray(group.cards)) {
            group.cards.forEach((card: any, cardIndex: number) => {
              const cardLocation = `Group ${groupIndex}, Card ${cardIndex}`;

              if (!card.hasOwnProperty('title')) {
                errors.push(`${cardLocation}: Missing required property: title`);
              }

              if (!card.hasOwnProperty('type')) {
                errors.push(`${cardLocation}: Missing required property: type`);
              }

              if (!card.hasOwnProperty('element')) {
                errors.push(`${cardLocation}: Missing required property: element`);
              }

              if (!card.hasOwnProperty('details')) {
                errors.push(`${cardLocation}: Missing required property: details`);
              }

              if (!Array.isArray(card.details)) {
                errors.push(`${cardLocation}: Details must be an array`);
              }

              // Validate details structure
              if (Array.isArray(card.details)) {
                card.details.forEach((detail: any, detailIndex: number) => {
                  const detailLocation = `${cardLocation}, Detail ${detailIndex}`;

                  if (!detail.hasOwnProperty('name')) {
                    errors.push(`${detailLocation}: Missing required property: name`);
                  }

                  if (!detail.hasOwnProperty('details')) {
                    errors.push(`${detailLocation}: Missing required property: details`);
                  }

                  if (!detail.hasOwnProperty('apCost')) {
                    errors.push(`${detailLocation}: Missing required property: apCost`);
                  }

                  if (!detail.hasOwnProperty('spCost')) {
                    errors.push(`${detailLocation}: Missing required property: spCost`);
                  }

                  if (typeof detail.apCost !== 'number') {
                    errors.push(`${detailLocation}: apCost must be a number`);
                  }

                  if (typeof detail.spCost !== 'number') {
                    errors.push(`${detailLocation}: spCost must be a number`);
                  }
                });
              }
            });
          }
        });
      }

    } catch (parseError) {
      errors.push('Invalid JSON format');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  static sanitizeFilename(filename: string): string {
    return filename
      .replace(/[<>:"/\\|?*]/g, '_')  // Replace invalid characters
      .replace(/\s+/g, '_')           // Replace spaces with underscores
      .replace(/_+/g, '_')            // Replace multiple underscores with single
      .replace(/^_|_$/g, '')          // Remove leading/trailing underscores
      .substring(0, 255);             // Limit length
  }

  static getFileExtension(filename: string): string {
    const lastDot = filename.lastIndexOf('.');
    return lastDot !== -1 ? filename.substring(lastDot + 1).toLowerCase() : '';
  }

  static changeFileExtension(filename: string, newExtension: string): string {
    const lastDot = filename.lastIndexOf('.');
    const baseName = lastDot !== -1 ? filename.substring(0, lastDot) : filename;
    return `${baseName}.${newExtension}`;
  }

  static isValidFilename(filename: string): boolean {
    if (!filename || filename.trim().length === 0) return false;
    if (filename.length > 255) return false;
    
    const invalidChars = /[<>:"/\\|?*]/;
    return !invalidChars.test(filename);
  }
}
