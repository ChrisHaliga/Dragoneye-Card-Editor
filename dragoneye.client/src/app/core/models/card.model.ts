// Card-related data models

export interface CardDetail {
  name: string;
  details: string;
  apCost: number;
  spCost: number;
}

export interface Card {
  title: string;
  type: string;
  element: string;
  backgroundImage?: string;
  details: CardDetail[];
}

export interface CardGroup {
  name: string;
  cards: Card[];
  expanded?: boolean; // Optional for backward compatibility, not used in v2 components
}

export interface CardData {
  filename: string;
  groups: CardGroup[];
}

// Layout-related models for card display
export interface TextLine {
  text: string;
  width: number;
}

export interface DetailLayout {
  detail: CardDetail;
  yPosition: number;
  height: number;
  titleX: number;
  lines: TextLine[];
}

// Event models
export interface DeleteCardEvent {
  groupIndex: number;
  cardIndex: number;
}

// Validation models
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface CardValidationRules {
  titleRequired: boolean;
  titleMaxLength: number;
  typeRequired: boolean;
  elementRequired: boolean;
  detailsMinCount: number;
  detailsMaxCount: number;
}
