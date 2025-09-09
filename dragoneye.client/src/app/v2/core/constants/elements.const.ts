import { ElementSymbolMap } from '../models/element.model';

// Element symbols and mappings
export const ELEMENT_SYMBOLS: ElementSymbolMap = {
  'pyr': '🔥',
  'hyd': '💧',
  'geo': '🌍',
  'aer': '💨',
  'nyx': '🌑',
  'lux': '☀️',
  'arc': '✶'
};

export const DEFAULT_ELEMENT_KEY = 'arc';
export const DEFAULT_ELEMENT_SYMBOL = '✶';

export const ELEMENT_CSS_CLASSES: { [key: string]: string } = {
  'pyr': 'element-fire',
  'hyd': 'element-water',
  'geo': 'element-earth',
  'aer': 'element-air',
  'nyx': 'element-dark',
  'lux': 'element-light',
  'arc': 'element-arcane'
};
