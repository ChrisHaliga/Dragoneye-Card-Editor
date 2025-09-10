import { ElementSymbolMap, ElementImageMap } from '../models/element.model';

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

// Element image paths in public folder
export const ELEMENT_IMAGES: ElementImageMap = {
  'pyr': '/pyr.png',
  'hyd': '/hyd.png',
  'geo': '/geo.png',
  'aer': '/aer.png',
  'nyx': '/nyx.png',
  'lux': '/lux.png',
  'arc': '/arc.png'
};

export const DEFAULT_ELEMENT_KEY = 'arc';
export const DEFAULT_ELEMENT_SYMBOL = '✶';
export const DEFAULT_ELEMENT_IMAGE = '/arc.png';

export const ELEMENT_CSS_CLASSES: { [key: string]: string } = {
  'pyr': 'element-fire',
  'hyd': 'element-water',
  'geo': 'element-earth',
  'aer': 'element-air',
  'nyx': 'element-dark',
  'lux': 'element-light',
  'arc': 'element-arcane'
};
