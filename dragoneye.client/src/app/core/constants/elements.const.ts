// Element symbols and mappings
export const ELEMENT_SYMBOLS: { [key: string]: string } = {
  'pyr': '🔥',
  'hyd': '💧',
  'geo': '🌍',
  'aer': '💨',
  'nyx': '🌑',
  'lux': '☀️',
  'arc': '✶',
  'nat': '🌿',  // All 4 natural elements
  'duo': '☯️'   // Light + Dark combination
};

// Element image paths in public folder
export const ELEMENT_IMAGES: { [key: string]: string } = {
  'pyr': '/runes/pyr.png',
  'hyd': '/runes/hyd.png',
  'geo': '/runes/geo.png',
  'aer': '/runes/aer.png',
  'nyx': '/runes/nyx.png',
  'lux': '/runes/lux.png',
  'arc': '/runes/arc.png',
  'nat': '/runes/nat.png',  // All 4 natural elements
  'duo': '/runes/duo.png'   // Light + Dark combination
};

export const DEFAULT_ELEMENT_KEY = 'arc';
export const DEFAULT_ELEMENT_SYMBOL = '✶';
export const DEFAULT_ELEMENT_IMAGE = '/runes/arc.png';

export const ELEMENT_CSS_CLASSES: { [key: string]: string } = {
  'pyr': 'element-fire',
  'hyd': 'element-water',
  'geo': 'element-earth',
  'aer': 'element-air',
  'nyx': 'element-dark',
  'lux': 'element-light',
  'arc': 'element-arcane'
};
